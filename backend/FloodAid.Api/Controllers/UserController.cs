using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FloodAid.Api.Data;
using FloodAid.Api.Models;
using System.Security.Claims;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly FloodAidContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(FloodAidContext context, ILogger<UserController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Register as a donor (public endpoint) - Volunteers must be invited
        /// </summary>
        [HttpPost("register")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<UserResponseDto>> RegisterUser([FromBody] CreateUserDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { message = "Name is required" });
                }

                if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains("@"))
                {
                    return BadRequest(new { message = "Valid email is required" });
                }

                if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                {
                    return BadRequest(new { message = "Phone number is required" });
                }

                // Only allow donors to register publicly - Volunteers must be invited
                if (dto.Role != 1)
                {
                    return BadRequest(new { message = "Only donors can register directly. Volunteers must be invited by admins." });
                }

                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

                if (existingUser != null)
                {
                    return Conflict(new { message = "Email already registered" });
                }

                var user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    Role = dto.Role,
                    Status = 0, // Pending
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User registered: {Email}, Role: {Role}", user.Email, user.Role);

                return Ok(MapToResponseDto(user));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user");
                return StatusCode(500, new { message = "Error registering user", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all users (admin only) with optional filtering
        /// Scope: SuperAdmin sees all, ProvinceAdmin sees their province only
        /// </summary>
        [HttpGet]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<object>> GetAllUsers(
            [FromQuery] int? status = null,
            [FromQuery] int? role = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var query = _context.Users.AsNoTracking().AsQueryable();

                // Apply role-based scoping for admin users
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null && admin.Role == "ProvinceAdmin")
                    {
                        // ProvinceAdmin can only see users in their province
                        query = query.Where(u => u.ProvinceId == admin.ProvinceId);
                    }
                    // SuperAdmin sees all (no filter)
                }

                if (status.HasValue)
                {
                    query = query.Where(u => u.Status == status.Value);
                }

                if (role.HasValue)
                {
                    query = query.Where(u => u.Role == role.Value);
                }

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.Trim().ToLower();
                    query = query.Where(u =>
                        u.Name.ToLower().Contains(term) ||
                        u.Email.ToLower().Contains(term) ||
                        u.PhoneNumber.Contains(term)
                    );
                }

                var totalCount = await query.CountAsync();

                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new
                {
                    data = users.Select(MapToResponseDto).ToList(),
                    totalCount,
                    page,
                    pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users");
                return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific user by ID
        /// </summary>
        [HttpGet("{id}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<UserResponseDto>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(MapToResponseDto(user));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user");
                return StatusCode(500, new { message = "Error fetching user", error = ex.Message });
            }
        }

        /// <summary>
        /// Update user status (approve or reject) - admin only
        /// </summary>
        [HttpPut("{id}/status")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<UserResponseDto>> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                if (dto.Status < 0 || dto.Status > 2)
                {
                    return BadRequest(new { message = "Invalid status. 0=Pending, 1=Approved, 2=Rejected" });
                }

                user.Status = dto.Status;
                user.UpdatedAt = DateTime.UtcNow;

                if (dto.Status == 1) // Approved
                {
                    user.ApprovedAt = DateTime.UtcNow;
                }

                if (dto.Status == 2) // Rejected
                {
                    user.ReasonForRejection = dto.ReasonForRejection;
                }

                if (!string.IsNullOrWhiteSpace(dto.VerificationNotes))
                {
                    user.VerificationNotes = dto.VerificationNotes;
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {Id} status updated to {Status}", id, dto.Status);

                return Ok(MapToResponseDto(user));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status");
                return StatusCode(500, new { message = "Error updating user status", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a user (admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {Id} deleted", id);

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user");
                return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
            }
        }

        /// <summary>
        /// Get user statistics (admin dashboard)
        /// </summary>
        [HttpGet("stats/summary")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<object>> GetUserStats()
        {
            try
            {
                var query = _context.Users.AsNoTracking();

                var total = await query.CountAsync();
                var pending = await query.CountAsync(u => u.Status == 0);
                var approved = await query.CountAsync(u => u.Status == 1);
                var rejected = await query.CountAsync(u => u.Status == 2);
                var volunteers = await query.CountAsync(u => u.Role == 0 || u.Role == 2);
                var donors = await query.CountAsync(u => u.Role == 1 || u.Role == 2);

                return Ok(new
                {
                    total,
                    pending,
                    approved,
                    rejected,
                    volunteers,
                    donors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user stats");
                return StatusCode(500, new { message = "Error fetching user stats", error = ex.Message });
            }
        }

        /// <summary>
        /// Helper method to map User to UserResponseDto
        /// </summary>
        private static UserResponseDto MapToResponseDto(User user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                Status = user.Status,
                ReasonForRejection = user.ReasonForRejection,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                ApprovedAt = user.ApprovedAt,
                VerificationNotes = user.VerificationNotes
            };
        }
    }
}
