using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Sockets;
using FloodAid.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/email")]
    public class DiagnosticsController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<DiagnosticsController> _logger;
        private readonly FloodAidContext _context;

        public DiagnosticsController(IConfiguration configuration, ILogger<DiagnosticsController> logger, FloodAidContext context)
        {
            _configuration = configuration;
            _logger = logger;
            _context = context;
        }

        [HttpGet("diagnose")]
        public async Task<IActionResult> Diagnose()
        {
            var smtpHost = _configuration["Email:SmtpHost"] ?? string.Empty;
            var smtpPortStr = _configuration["Email:SmtpPort"] ?? "587";
            var smtpUser = _configuration["Email:SmtpUser"] ?? string.Empty;
            var fromEmail = _configuration["Email:FromEmail"] ?? string.Empty;

            int smtpPort = 587;
            int.TryParse(smtpPortStr, out smtpPort);

            var result = new Dictionary<string, object?>
            {
                ["host"] = smtpHost,
                ["port"] = smtpPort,
                ["fromEmail"] = string.IsNullOrWhiteSpace(fromEmail) ? null : fromEmail,
                ["smtpUserSet"] = !string.IsNullOrWhiteSpace(smtpUser),
                ["enableSsl"] = true,
                ["dnsResolvable"] = null,
                ["connectMs"] = null,
                ["error"] = null
            };

            if (string.IsNullOrWhiteSpace(smtpHost))
            {
                result["error"] = "Email:SmtpHost is not configured";
                return Ok(result);
            }

            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();

                IPAddress[] addresses = await Dns.GetHostAddressesAsync(smtpHost);
                result["dnsResolvable"] = addresses.Length > 0;

                using var client = new TcpClient();
                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await client.ConnectAsync(smtpHost, smtpPort, cts.Token);

                sw.Stop();
                result["connectMs"] = sw.ElapsedMilliseconds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SMTP diagnostics failed for {Host}:{Port}", smtpHost, smtpPort);
                result["error"] = ex.Message;
            }

            return Ok(result);
        }

        [HttpGet("admin-check")]
        public async Task<IActionResult> CheckAdmin([FromQuery] string? email = null)
        {
            try
            {
                var configEmail = _configuration["AdminCredentials:Email"];
                var searchEmail = email ?? configEmail ?? "24cs.se.secb@gmail.com";

                var admin = await _context.Admins
                    .Where(a => a.Email == searchEmail)
                    .Select(a => new
                    {
                        a.Id,
                        a.Email,
                        a.Username,
                        a.Role,
                        a.IsActive,
                        a.ProvinceId,
                        ProvinceName = a.Province != null ? a.Province.Name : null,
                        PasswordHashPrefix = a.PasswordHash.Substring(0, Math.Min(20, a.PasswordHash.Length)),
                        a.CreatedAt,
                        a.LastLoginAt
                    })
                    .FirstOrDefaultAsync();

                var result = new
                {
                    searchEmail,
                    configEmail,
                    found = admin != null,
                    admin,
                    totalAdmins = await _context.Admins.CountAsync()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("reset-admin-password")]
        public async Task<IActionResult> ResetAdminPassword([FromQuery] string email, [FromQuery] string password)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                {
                    return BadRequest(new { error = "Email and password are required" });
                }

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);
                if (admin == null)
                {
                    return NotFound(new { error = $"Admin with email {email} not found" });
                }

                // Generate new hash
                var newHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
                var oldHashPrefix = admin.PasswordHash.Substring(0, Math.Min(20, admin.PasswordHash.Length));

                // Update admin
                admin.PasswordHash = newHash;
                admin.Role = "SuperAdmin";
                admin.IsActive = true;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Password updated successfully",
                    email = admin.Email,
                    oldHashPrefix,
                    newHashPrefix = newHash.Substring(0, 20),
                    role = admin.Role
                });
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("province-scope-check")]
        public async Task<IActionResult> CheckProvinceScope()
        {
            try
            {
                var provinces = await _context.Provinces
                    .Select(p => new { p.Id, p.Name })
                    .ToListAsync();

                var admins = await _context.Admins
                    .Select(a => new
                    {
                        a.Id,
                        a.Email,
                        a.Role,
                        a.ProvinceId,
                        ProvinceName = a.Province != null ? a.Province.Name : null
                    })
                    .ToListAsync();

                var helpRequestStats = await _context.HelpRequests
                    .GroupBy(h => h.ProvinceId)
                    .Select(g => new
                    {
                        ProvinceId = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var requestsWithoutProvince = await _context.HelpRequests
                    .Where(h => h.ProvinceId == null)
                    .CountAsync();

                return Ok(new
                {
                    provinces,
                    admins,
                    helpRequestStats,
                    requestsWithoutProvince,
                    totalRequests = await _context.HelpRequests.CountAsync()
                });
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("test-scope")]
        public async Task<IActionResult> TestScope([FromQuery] string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new { error = "Email parameter is required" });
                }

                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);
                if (admin == null)
                {
                    return NotFound(new { error = $"Admin with email {email} not found" });
                }

                // Simulate the scoping logic
                var allRequests = await _context.HelpRequests.Select(r => new
                {
                    r.Id,
                    r.ProvinceId,
                    r.RequestorName,
                    r.Status
                }).ToListAsync();

                var scopedRequests = admin.Role == "ProvinceAdmin"
                    ? allRequests.Where(r => r.ProvinceId == admin.ProvinceId).ToList()
                    : allRequests;

                return Ok(new
                {
                    admin = new
                    {
                        admin.Email,
                        admin.Role,
                        admin.ProvinceId,
                        ProvinceName = (await _context.Provinces.FindAsync(admin.ProvinceId))?.Name
                    },
                    allRequestsCount = allRequests.Count,
                    scopedRequestsCount = scopedRequests.Count(),
                    allRequests,
                    scopedRequests
                });
            }
            catch (Exception ex)
            {
                return Ok(new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}
