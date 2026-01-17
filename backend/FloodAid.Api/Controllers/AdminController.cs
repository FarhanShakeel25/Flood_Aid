using FloodAid.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/admins")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly FloodAidContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(FloodAidContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all admins (SuperAdmin only)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllAdmins(
            [FromQuery] string? role = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var safePage = Math.Max(1, page);
                var safePageSize = Math.Clamp(pageSize, 1, 100);

                var query = _context.Admins
                    .Include(a => a.Province)
                    .AsNoTracking()
                    .AsQueryable();

                // Filter by role
                if (!string.IsNullOrWhiteSpace(role))
                {
                    query = query.Where(a => a.Role == role);
                }

                // Search by name or email
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.Trim().ToLower();
                    query = query.Where(a =>
                        a.Name.ToLower().Contains(term) ||
                        a.Email.ToLower().Contains(term) ||
                        a.Username.ToLower().Contains(term)
                    );
                }

                var totalCount = await query.CountAsync();

                var admins = await query
                    .OrderByDescending(a => a.CreatedAt)
                    .Skip((safePage - 1) * safePageSize)
                    .Take(safePageSize)
                    .Select(a => new
                    {
                        a.Id,
                        a.Name,
                        a.Email,
                        a.Username,
                        a.Role,
                        a.IsActive,
                        a.ProvinceId,
                        ProvinceName = a.Province != null ? a.Province.Name : null,
                        a.CreatedAt,
                        a.LastLoginAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    data = admins,
                    totalCount,
                    page = safePage,
                    pageSize = safePageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admins");
                return StatusCode(500, new { message = "Error fetching admins", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific admin by ID (SuperAdmin only)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAdmin(int id)
        {
            try
            {
                var admin = await _context.Admins
                    .Include(a => a.Province)
                    .AsNoTracking()
                    .Where(a => a.Id == id)
                    .Select(a => new
                    {
                        a.Id,
                        a.Name,
                        a.Email,
                        a.Username,
                        a.Role,
                        a.IsActive,
                        a.ProvinceId,
                        ProvinceName = a.Province != null ? a.Province.Name : null,
                        a.CreatedAt,
                        a.LastLoginAt
                    })
                    .FirstOrDefaultAsync();

                if (admin == null)
                    return NotFound(new { message = "Admin not found" });

                return Ok(admin);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching admin");
                return StatusCode(500, new { message = "Error fetching admin", error = ex.Message });
            }
        }

        /// <summary>
        /// Update admin status (SuperAdmin only)
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateAdminStatus(int id, [FromBody] UpdateAdminStatusDto dto)
        {
            try
            {
                var admin = await _context.Admins.FindAsync(id);

                if (admin == null)
                    return NotFound(new { message = "Admin not found" });

                admin.IsActive = dto.IsActive;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin {Id} status updated to IsActive={IsActive}", id, dto.IsActive);

                return Ok(new { message = "Admin status updated successfully", id, isActive = admin.IsActive });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating admin status");
                return StatusCode(500, new { message = "Error updating admin status", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete an admin (SuperAdmin only)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdmin(int id)
        {
            try
            {
                var admin = await _context.Admins.FindAsync(id);

                if (admin == null)
                    return NotFound(new { message = "Admin not found" });

                // Prevent deleting the primary SuperAdmin
                if (admin.Role == "SuperAdmin")
                {
                    var superAdminCount = await _context.Admins.CountAsync(a => a.Role == "SuperAdmin");
                    if (superAdminCount <= 1)
                        return BadRequest(new { message = "Cannot delete the last SuperAdmin" });
                }

                _context.Admins.Remove(admin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Admin {Id} ({Email}) deleted", id, admin.Email);

                return Ok(new { message = "Admin deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting admin");
                return StatusCode(500, new { message = "Error deleting admin", error = ex.Message });
            }
        }
    }

    public class UpdateAdminStatusDto
    {
        public bool IsActive { get; set; }
    }
}
