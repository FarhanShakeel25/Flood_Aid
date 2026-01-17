using FloodAid.Api.Data;
using FloodAid.Api.Models;
using FloodAid.Api.Enums;
using FloodAid.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/invitations")]
    [Authorize]
    public class InvitationController : ControllerBase
    {
        private readonly FloodAidContext _context;
        private readonly ILogger<InvitationController> _logger;
        private readonly IEmailService _emailService;

        public InvitationController(FloodAidContext context, ILogger<InvitationController> logger, IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        /// <summary>
        /// Create a new invitation (SuperAdmin can invite ProvinceAdmin, ProvinceAdmin can invite Volunteer)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,ProvinceAdmin")]
        public async Task<IActionResult> CreateInvitation([FromBody] CreateInvitationDto dto)
        {
            try
            {
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);

                if (admin == null)
                    return Unauthorized(new { message = "Admin not found" });

                // Validate role-based creation permissions
                if (dto.Role == UserRole.SuperAdmin)
                {
                    return BadRequest(new { message = "Cannot create SuperAdmin invitations" });
                }

                // Only SuperAdmin can invite ProvinceAdmin
                if (dto.Role == UserRole.ProvinceAdmin)
                {
                    if (admin.Role != "SuperAdmin")
                        return Forbid(); // Only SuperAdmin can invite ProvinceAdmins
                    
                    if (!dto.ProvinceId.HasValue)
                    {
                        return BadRequest(new { message = "ProvinceId is required for ProvinceAdmin invitations" });
                    }
                }

                // Only ProvinceAdmin can invite Volunteer (not SuperAdmin directly inviting Volunteers)
                if (dto.Role == UserRole.Volunteer)
                {
                    if (admin.Role != "ProvinceAdmin")
                        return Forbid(); // Only ProvinceAdmin can invite Volunteers
                    
                    if (!dto.CityId.HasValue)
                    {
                        return BadRequest(new { message = "CityId is required for Volunteer invitations" });
                    }
                    
                    // Ensure city is within ProvinceAdmin's province
                    var city = await _context.Cities.FindAsync(dto.CityId);
                    if (city == null || city.ProvinceId != admin.ProvinceId)
                    {
                        return BadRequest(new { message = "City must be within your province" });
                    }
                }
                else if (dto.Role == UserRole.ProvinceAdmin)
                {
                    // ProvinceAdmin cannot invite ProvinceAdmin - only SuperAdmin can
                    if (admin.Role == "ProvinceAdmin")
                        return Forbid(); // ProvinceAdmin cannot create ProvinceAdmin invitations
                }

                // Check for existing invitation
                var existingInvitation = await _context.Invitations
                    .FirstOrDefaultAsync(i => i.Email == dto.Email && i.Status == InvitationStatus.Pending);

                if (existingInvitation != null)
                {
                    return Conflict(new { message = "Pending invitation already exists for this email" });
                }

                // Check if user already exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                if (existingUser != null)
                {
                    return Conflict(new { message = "User with this email already exists" });
                }

                // Generate unique token
                var token = Guid.NewGuid().ToString("N");

                var invitation = new Invitation
                {
                    Email = dto.Email,
                    Token = token,
                    Role = (int)dto.Role,
                    ProvinceId = dto.ProvinceId,
                    CityId = dto.CityId,
                    Status = InvitationStatus.Pending,
                    ExpiresAt = DateTime.UtcNow.AddDays(7),
                    CreatedByAdminId = admin.Id,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Invitations.Add(invitation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Invitation created for {Email} by {AdminEmail}", dto.Email, adminEmail);

                // Send invitation email
                string? scopeInfo = null;
                if (dto.Role == UserRole.ProvinceAdmin && dto.ProvinceId.HasValue)
                {
                    var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Id == dto.ProvinceId);
                    scopeInfo = province?.Name ?? $"Province {dto.ProvinceId}";
                }
                else if (dto.Role == UserRole.Volunteer && dto.CityId.HasValue)
                {
                    var city = await _context.Cities.Include(c => c.Province).FirstOrDefaultAsync(c => c.Id == dto.CityId);
                    scopeInfo = city != null ? $"{city.Name}, {city.Province?.Name}" : $"City {dto.CityId}";
                }

                var roleName = dto.Role == UserRole.ProvinceAdmin ? "Province Admin" : "Volunteer";
                await _emailService.SendInvitationEmailAsync(dto.Email, token, roleName, scopeInfo);

                return Ok(new
                {
                    message = "Invitation sent successfully",
                    invitationId = invitation.Id,
                    token, // Remove in production
                    expiresAt = invitation.ExpiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating invitation");
                return StatusCode(500, new { message = "Error creating invitation", error = ex.Message });
            }
        }

        /// <summary>
        /// Resend an existing invitation
        /// </summary>
        [HttpPost("{id}/resend")]
        public async Task<IActionResult> ResendInvitation(int id)
        {
            var invitation = await _context.Invitations.FindAsync(id);

            if (invitation == null)
                return NotFound(new { message = "Invitation not found" });

            if (invitation.Status != InvitationStatus.Pending)
                return BadRequest(new { message = $"Cannot resend invitation with status: {invitation.Status}" });

            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                invitation.Status = InvitationStatus.Expired;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Invitation has expired" });
            }

            // Send invitation email again
            string? scopeInfo = null;
            if (invitation.ProvinceId.HasValue)
            {
                var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Id == invitation.ProvinceId);
                scopeInfo = province?.Name ?? $"Province {invitation.ProvinceId}";
            }
            else if (invitation.CityId.HasValue)
            {
                var city = await _context.Cities.Include(c => c.Province).FirstOrDefaultAsync(c => c.Id == invitation.CityId);
                scopeInfo = city != null ? $"{city.Name}, {city.Province?.Name}" : $"City {invitation.CityId}";
            }

            var roleInt = (UserRole)invitation.Role;
            var roleName = roleInt == UserRole.ProvinceAdmin ? "Province Admin" : "Volunteer";
            await _emailService.SendInvitationEmailAsync(invitation.Email, invitation.Token, roleName, scopeInfo);

            _logger.LogInformation("Invitation {Id} resent to {Email}", id, invitation.Email);

            return Ok(new { message = "Invitation resent successfully" });
        }

        /// <summary>
        /// Revoke an invitation
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> RevokeInvitation(int id)
        {
            var invitation = await _context.Invitations.FindAsync(id);

            if (invitation == null)
                return NotFound(new { message = "Invitation not found" });

            if (invitation.Status != InvitationStatus.Pending)
                return BadRequest(new { message = $"Cannot revoke invitation with status: {invitation.Status}" });

            invitation.Status = InvitationStatus.Revoked;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Invitation {Id} revoked for {Email}", id, invitation.Email);

            return Ok(new { message = "Invitation revoked successfully" });
        }

        /// <summary>
        /// Accept an invitation and create user account
        /// </summary>
        [HttpPost("accept")]
        [AllowAnonymous]
        public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationDto dto)
        {
            // Validate password strength
            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Password is required" });
            
            if (dto.Password.Length < 8)
                return BadRequest(new { message = "Password must be at least 8 characters long" });
            
            // Check for at least one uppercase letter, one lowercase letter, one digit, and one special character
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[A-Z]"))
                return BadRequest(new { message = "Password must contain at least one uppercase letter" });
            
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[a-z]"))
                return BadRequest(new { message = "Password must contain at least one lowercase letter" });
            
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[0-9]"))
                return BadRequest(new { message = "Password must contain at least one digit" });
            
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.Password, @"[^a-zA-Z0-9]"))
                return BadRequest(new { message = "Password must contain at least one special character" });

            var invitation = await _context.Invitations
                .Include(i => i.Province)
                .Include(i => i.City)
                .FirstOrDefaultAsync(i => i.Token == dto.Token);

            if (invitation == null)
                return BadRequest(new { message = "Invalid invitation token" });

            if (invitation.Status != InvitationStatus.Pending)
                return BadRequest(new { message = $"Invitation is {invitation.Status.ToString().ToLower()}" });

            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                invitation.Status = InvitationStatus.Expired;
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Invitation has expired" });
            }

            // Mark invitation as accepted immediately and save
            invitation.Status = InvitationStatus.Accepted;
            invitation.AcceptedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Determine if this is an admin invitation or volunteer invitation
            var invitationRole = (UserRole)invitation.Role;
            var isAdmin = invitationRole == UserRole.ProvinceAdmin;
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 11);

            if (isAdmin)
            {
                // Create as AdminUser for ProvinceAdmin
                var existingAdmin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == invitation.Email);
                if (existingAdmin != null)
                {
                    return Conflict(new { message = "Admin with this email already exists" });
                }

                var admin = new AdminUser
                {
                    Name = dto.Name,
                    Email = invitation.Email,
                    Username = invitation.Email,
                    PasswordHash = passwordHash,
                    Role = "ProvinceAdmin",
                    ProvinceId = invitation.ProvinceId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Admins.Add(admin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("ProvinceAdmin {Email} created via invitation acceptance", invitation.Email);

                return Ok(new
                {
                    message = "Admin account created successfully",
                    email = invitation.Email,
                    role = "ProvinceAdmin",
                    province = invitation.Province?.Name,
                    redirectTo = "/admin/login"
                });
            }
            else
            {
                // Create as regular User for Volunteer
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == invitation.Email);
                if (existingUser != null)
                {
                    return Conflict(new { message = "User with this email already exists" });
                }

                var user = new User
                {
                    Name = dto.Name,
                    Email = invitation.Email,
                    PhoneNumber = dto.PhoneNumber,
                    Role = (int)invitationRole,
                    ProvinceId = invitation.ProvinceId,
                    CityId = invitation.CityId,
                    Status = 1, // 1 = Approved (auto-approved via invitation)
                    PasswordHash = passwordHash,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Volunteer {Email} created via invitation acceptance", invitation.Email);

                return Ok(new
                {
                    message = "Account created successfully",
                    email = invitation.Email,
                    role = "Volunteer",
                    city = invitation.City?.Name,
                    province = invitation.Province?.Name,
                    redirectTo = "/home"
                });
            }
        }

        /// <summary>
        /// Get all invitations (filtered by admin scope)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetInvitations()
        {
            var adminEmail = User.FindFirstValue(ClaimTypes.Email);
            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);

            if (admin == null)
                return Unauthorized(new { message = "Admin not found" });

            IQueryable<Invitation> query = _context.Invitations
                .Include(i => i.Province)
                .Include(i => i.City);

            // Filter by admin scope
            if (admin.Role == "ProvinceAdmin")
            {
                query = query.Where(i => i.ProvinceId == admin.ProvinceId || i.CityId.HasValue &&
                    _context.Cities.Any(c => c.Id == i.CityId && c.ProvinceId == admin.ProvinceId));
            }

            var invitations = await query
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new
                {
                    i.Id,
                    i.Email,
                    Role = i.Role.ToString(),
                    Province = i.Province != null ? i.Province.Name : null,
                    City = i.City != null ? i.City.Name : null,
                    Status = i.Status.ToString(),
                    i.CreatedAt,
                    i.ExpiresAt,
                    i.AcceptedAt
                })
                .ToListAsync();

            return Ok(invitations);
        }
    }

    public class CreateInvitationDto
    {
        public required string Email { get; set; }
        public UserRole Role { get; set; }
        public int? ProvinceId { get; set; }
        public int? CityId { get; set; }
    }

    public class AcceptInvitationDto
    {
        public required string Token { get; set; }
        public required string Name { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Password { get; set; }
    }
}
