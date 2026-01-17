using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FloodAid.Api.Data;
using FloodAid.Api.Enums;
using System.Security.Claims;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/metrics")]
    [Authorize(Roles = "SuperAdmin,ProvinceAdmin")]
    public class MetricsController : ControllerBase
    {
        private readonly FloodAidContext _context;
        private readonly ILogger<MetricsController> _logger;

        public MetricsController(FloodAidContext context, ILogger<MetricsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get dashboard metrics: priority breakdown, status breakdown, completion rate, avg response time
        /// Scoped: SuperAdmin sees all, ProvinceAdmin sees their province only
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardMetricsDto>> GetDashboardMetrics()
        {
            try
            {
                // Get current admin and determine scope
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                int? scopedProvinceId = null;
                string? adminRole = null;

                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null)
                    {
                        adminRole = admin.Role;
                        if (admin.Role == "ProvinceAdmin")
                        {
                            scopedProvinceId = admin.ProvinceId;
                            _logger.LogInformation("MetricsController: ProvinceAdmin {Email} scoped to ProvinceId={ProvinceId}", adminEmail, scopedProvinceId);
                        }
                    }
                }

                // Build query with scope
                var query = _context.HelpRequests.AsNoTracking().AsQueryable();

                if (scopedProvinceId.HasValue)
                {
                    query = query.Where(h => h.ProvinceId == scopedProvinceId.Value);
                    _logger.LogInformation("MetricsController: Applied province filter for ProvinceId={ProvinceId}", scopedProvinceId.Value);
                }

                var totalCount = await query.CountAsync();
                _logger.LogInformation("MetricsController: Query returned {Count} requests after scoping", totalCount);

                // 1. Total requests by priority
                var byPriority = await query
                    .GroupBy(r => r.Priority)
                    .Select(g => new { Priority = g.Key, Count = g.Count() })
                    .ToListAsync();

                var priorityBreakdown = new
                {
                    Low = byPriority.FirstOrDefault(p => p.Priority == Priority.Low)?.Count ?? 0,
                    Medium = byPriority.FirstOrDefault(p => p.Priority == Priority.Medium)?.Count ?? 0,
                    High = byPriority.FirstOrDefault(p => p.Priority == Priority.High)?.Count ?? 0,
                    Critical = byPriority.FirstOrDefault(p => p.Priority == Priority.Critical)?.Count ?? 0
                };

                // 2. Requests by status
                var byStatus = await query
                    .GroupBy(r => r.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                var statusBreakdown = new
                {
                    Pending = byStatus.FirstOrDefault(s => s.Status == RequestStatus.Pending)?.Count ?? 0,
                    InProgress = byStatus.FirstOrDefault(s => s.Status == RequestStatus.InProgress)?.Count ?? 0,
                    Fulfilled = byStatus.FirstOrDefault(s => s.Status == RequestStatus.Fulfilled)?.Count ?? 0,
                    Cancelled = byStatus.FirstOrDefault(s => s.Status == RequestStatus.Cancelled)?.Count ?? 0,
                    OnHold = byStatus.FirstOrDefault(s => s.Status == RequestStatus.OnHold)?.Count ?? 0
                };

                // 3. Completion rate (Fulfilled / Total)
                var totalRequests = await query.CountAsync();
                var fulfilledRequests = await query.CountAsync(r => r.Status == RequestStatus.Fulfilled);
                var completionRate = totalRequests > 0 ? Math.Round((double)fulfilledRequests / totalRequests * 100, 2) : 0;

                // 4. Average response time (from CreatedAt to UpdatedAt or status change)
                var completedRequests = await query
                    .Where(r => r.Status == RequestStatus.Fulfilled)
                    .Select(r => new
                    {
                        CreatedAt = r.CreatedAt,
                        UpdatedAt = r.UpdatedAt,
                        AssignedAt = r.AssignedAt
                    })
                    .ToListAsync();

                double avgResponseTimeHours = 0;
                if (completedRequests.Count > 0)
                {
                    var responseTimes = completedRequests
                        .Select(r => (r.UpdatedAt - r.CreatedAt).TotalHours)
                        .ToList();
                    avgResponseTimeHours = Math.Round(responseTimes.Average(), 2);
                }

                // 5. Average assignment time (from created to assigned)
                var assignedRequests = await query
                    .Where(r => r.AssignedAt.HasValue)
                    .Select(r => new
                    {
                        CreatedAt = r.CreatedAt,
                        AssignedAt = r.AssignedAt
                    })
                    .ToListAsync();

                double avgAssignmentTimeHours = 0;
                if (assignedRequests.Count > 0)
                {
                    var assignmentTimes = assignedRequests
                        .Select(r => (r.AssignedAt!.Value - r.CreatedAt).TotalHours)
                        .ToList();
                    avgAssignmentTimeHours = Math.Round(assignmentTimes.Average(), 2);
                }

                var metrics = new DashboardMetricsDto
                {
                    TotalRequests = totalRequests,
                    FulfilledRequests = fulfilledRequests,
                    CompletionRate = completionRate,
                    PriorityBreakdown = priorityBreakdown,
                    StatusBreakdown = statusBreakdown,
                    AverageResponseTimeHours = avgResponseTimeHours,
                    AverageAssignmentTimeHours = avgAssignmentTimeHours
                };

                _logger.LogInformation("✅ Dashboard metrics retrieved for {Email}: Total={Total}, Fulfilled={Fulfilled}, CompletionRate={Rate}%", 
                    adminEmail, totalRequests, fulfilledRequests, completionRate);

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving dashboard metrics: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving dashboard metrics", error = ex.Message });
            }
        }

        /// <summary>
        /// Get detailed metrics for requests by assignment status
        /// </summary>
        [HttpGet("assignment-status")]
        public async Task<ActionResult<object>> GetAssignmentStatusMetrics()
        {
            try
            {
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                int? scopedProvinceId = null;

                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null && admin.Role == "ProvinceAdmin")
                    {
                        scopedProvinceId = admin.ProvinceId;
                    }
                }

                var query = _context.HelpRequests.AsNoTracking().AsQueryable();

                if (scopedProvinceId.HasValue)
                {
                    query = query.Where(h => h.ProvinceId == scopedProvinceId.Value);
                }

                var assignmentMetrics = await query
                    .GroupBy(r => r.AssignmentStatus)
                    .Select(g => new
                    {
                        Status = g.Key.ToString(),
                        Count = g.Count(),
                        Percentage = (double)g.Count() / query.Count() * 100
                    })
                    .ToListAsync();

                return Ok(new
                {
                    data = assignmentMetrics,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving assignment status metrics: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving metrics", error = ex.Message });
            }
        }
    }

    /// <summary>
    /// DTO for dashboard metrics response
    /// </summary>
    public class DashboardMetricsDto
    {
        public int TotalRequests { get; set; }
        public int FulfilledRequests { get; set; }
        public double CompletionRate { get; set; }
        public object? PriorityBreakdown { get; set; } // { Low: x, Medium: y, High: z, Critical: w }
        public object? StatusBreakdown { get; set; } // { Pending: x, InProgress: y, Fulfilled: z, Cancelled: w, OnHold: v }
        public double AverageResponseTimeHours { get; set; }
        public double AverageAssignmentTimeHours { get; set; }
    }
}
