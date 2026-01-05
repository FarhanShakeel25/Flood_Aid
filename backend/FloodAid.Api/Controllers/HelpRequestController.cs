using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FloodAid.Api.Data;
using FloodAid.Api.Models;
using FloodAid.Api.Enums;
using System.Security.Claims;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/helpRequest")]
    public class HelpRequestController : ControllerBase
    {
        private readonly FloodAidContext _context;
        private readonly ILogger<HelpRequestController> _logger;

        public HelpRequestController(FloodAidContext context, ILogger<HelpRequestController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Submit a new help request (Victim Module)
        /// </summary>
        [HttpPost]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<HelpRequest>> CreateHelpRequest([FromBody] CreateHelpRequestDto dto)
        {
            try
            {
                // Validate phone number
                if (string.IsNullOrWhiteSpace(dto.RequestorPhoneNumber))
                {
                    return BadRequest(new { message = "Phone number is required" });
                }

                // Validate coordinates
                if (dto.Latitude == 0 || dto.Longitude == 0)
                {
                    return BadRequest(new { message = "Location coordinates are required" });
                }

                // Validate request type
                if (!Enum.IsDefined(typeof(RequestType), dto.RequestType))
                {
                    return BadRequest(new { message = "Invalid request type" });
                }

                var helpRequest = new HelpRequest
                {
                    RequestorName = dto.RequestorName ?? "Anonymous",
                    RequestorPhoneNumber = dto.RequestorPhoneNumber,
                    RequestorEmail = dto.RequestorEmail,
                    RequestType = (RequestType)dto.RequestType,
                    Status = RequestStatus.Pending,
                    RequestDescription = dto.RequestDescription,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.HelpRequests.Add(helpRequest);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ New help request created: ID={helpRequest.Id}, Phone={helpRequest.RequestorPhoneNumber}, Type={helpRequest.RequestType}");

                return CreatedAtAction(nameof(GetHelpRequest), new { id = helpRequest.Id }, helpRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating help request");
                return StatusCode(500, new { message = "Error creating help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all help requests (Admin Module) with pagination & filters
        /// Scope: SuperAdmin sees all, ProvinceAdmin sees their province only, Volunteer sees their city only
        /// </summary>
        [HttpGet]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<object>> GetAllHelpRequests(
            [FromQuery] int? requestType = null,
            [FromQuery] RequestStatus? status = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (requestType.HasValue && !Enum.IsDefined(typeof(RequestType), requestType.Value))
                {
                    return BadRequest(new { message = "Invalid request type" });
                }

                var safePage = Math.Max(1, page);
                var safePageSize = Math.Clamp(pageSize, 1, 100);

                DateTime? normalizedStart = null;
                DateTime? normalizedEnd = null;

                if (startDate.HasValue)
                {
                    normalizedStart = startDate.Value.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc)
                        : startDate.Value.ToUniversalTime();
                }

                if (endDate.HasValue)
                {
                    normalizedEnd = endDate.Value.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc)
                        : endDate.Value.ToUniversalTime();
                }

                var query = _context.HelpRequests.AsNoTracking().AsQueryable();

                // Apply role-based scoping for admin users
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null)
                    {
                        if (admin.Role == "ProvinceAdmin")
                        {
                            // ProvinceAdmin can only see requests in their province
                            query = query.Where(h => h.ProvinceId == admin.ProvinceId);
                        }
                        // SuperAdmin sees all (no filter)
                    }
                }

                if (requestType.HasValue)
                {
                    query = query.Where(r => (int)r.RequestType == requestType.Value);
                }

                if (status.HasValue)
                {
                    query = query.Where(r => r.Status == status.Value);
                }

                if (normalizedStart.HasValue)
                {
                    query = query.Where(r => r.CreatedAt >= normalizedStart.Value);
                }

                if (normalizedEnd.HasValue)
                {
                    query = query.Where(r => r.CreatedAt <= normalizedEnd.Value);
                }

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.Trim().ToLower();
                    query = query.Where(r =>
                        (r.RequestorName != null && r.RequestorName.ToLower().Contains(term)) ||
                        (r.RequestorPhoneNumber != null && r.RequestorPhoneNumber.Contains(term)) ||
                        (r.RequestorEmail != null && r.RequestorEmail.ToLower().Contains(term))
                    );
                }

                var totalCount = await query.CountAsync();

                var requests = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((safePage - 1) * safePageSize)
                    .Take(safePageSize)
                    .ToListAsync();

                return Ok(new
                {
                    data = requests,
                    totalCount,
                    pageNumber = safePage,
                    pageSize = safePageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving help requests: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving help requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific help request by ID
        /// </summary>
        [HttpGet("{id}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<HelpRequest>> GetHelpRequest(int id)
        {
            try
            {
                var request = await _context.HelpRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                return Ok(request);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving help request {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Update help request status (Admin/Volunteer Module)
        /// </summary>
        [HttpPut("{id}/status")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<HelpRequest>> UpdateRequestStatus(int id, [FromBody] UpdateRequestStatusDto dto)
        {
            try
            {
                var request = await _context.HelpRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                // Validate status
                if (!Enum.IsDefined(typeof(RequestStatus), dto.Status))
                {
                    return BadRequest(new { message = "Invalid request status" });
                }

                request.Status = (RequestStatus)dto.Status;
                request.UpdatedAt = DateTime.UtcNow;

                _context.HelpRequests.Update(request);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Help request {id} status updated to: {dto.Status}");

                return Ok(request);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error updating request {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error updating help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Get requests by type (Food, Medical, Rescue)
        /// </summary>
        [HttpGet("type/{requestType}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<IEnumerable<HelpRequest>>> GetRequestsByType(int requestType)
        {
            try
            {
                if (!Enum.IsDefined(typeof(RequestType), requestType))
                {
                    return BadRequest(new { message = "Invalid request type" });
                }

                var requests = await _context.HelpRequests
                    .Where(r => r.RequestType == (RequestType)requestType)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving requests by type: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get pending requests (for volunteers)
        /// </summary>
        [HttpGet("status/pending")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<IEnumerable<HelpRequest>>> GetPendingRequests()
        {
            try
            {
                var requests = await _context.HelpRequests
                    .Where(r => r.Status == RequestStatus.Pending)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving pending requests: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving pending requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get aggregate counts for dashboard cards
        /// </summary>
        [HttpGet("stats")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<object>> GetHelpRequestStats()
        {
            try
            {
                var query = _context.HelpRequests.AsNoTracking();

                var total = await query.CountAsync();
                var pending = await query.CountAsync(r => r.Status == RequestStatus.Pending);
                var inProgress = await query.CountAsync(r => r.Status == RequestStatus.InProgress);
                var fulfilled = await query.CountAsync(r => r.Status == RequestStatus.Fulfilled);
                var cancelled = await query.CountAsync(r => r.Status == RequestStatus.Cancelled);
                var onHold = await query.CountAsync(r => r.Status == RequestStatus.OnHold);

                return Ok(new
                {
                    total,
                    pending,
                    inProgress,
                    fulfilled,
                    cancelled,
                    onHold
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving help request stats: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving help request stats", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a help request (Admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult> DeleteHelpRequest(int id)
        {
            try
            {
                var request = await _context.HelpRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                _context.HelpRequests.Remove(request);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Help request {id} deleted");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error deleting request {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting help request", error = ex.Message });
            }
        }
    }

    /// <summary>
    /// DTO for creating a help request
    /// </summary>
    public class CreateHelpRequestDto
    {
        public string? RequestorName { get; set; }
        public required string RequestorPhoneNumber { get; set; }
        public string? RequestorEmail { get; set; }
        public int RequestType { get; set; } // Matches RequestType enum: 0=MedicalSuppliesRequired, 1=FoodRequired, 2=EvacuationRequired, 3=ClothesRequired, 4=EmergencyCase
        public required string RequestDescription { get; set; }
        public required double Latitude { get; set; }
        public required double Longitude { get; set; }
    }

    /// <summary>
    /// DTO for updating request status
    /// </summary>
    public class UpdateRequestStatusDto
    {
        public int Status { get; set; } // 0=Pending, 1=Assigned, 2=Resolved
    }
}
