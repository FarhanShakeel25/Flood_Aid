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
    }
}
