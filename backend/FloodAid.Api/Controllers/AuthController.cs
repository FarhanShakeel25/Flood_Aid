using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FloodAid.Api.Models;
using FloodAid.Api.Models.DTOs;
using FloodAid.Api.Services;
using BCrypt.Net;

namespace FloodAid.Api.Controllers
{
    [Authorize]
    [EnableRateLimiting("auth")]
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        
        // In-memory storage for OTPs (in production, use Redis or database with expiration)
        private static readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();
        private static readonly ConcurrentDictionary<string, (int FailCount, DateTimeOffset? LockoutUntil)> _authFailures = new();

        private const int LockoutThreshold = 5;
        private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

        public AuthController(IConfiguration configuration, ILogger<AuthController> logger, IEmailService emailService)
        {
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
        }

        /// <summary>
        /// Step 1: Verify admin credentials and send OTP
        /// </summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                // Get admin user from configuration (in production, fetch from database)
                var adminEmail = _configuration["AdminCredentials:Email"];
                var adminUsername = _configuration["AdminCredentials:Username"];
                var adminPasswordHash = _configuration["AdminCredentials:PasswordHash"];

                if (string.IsNullOrEmpty(adminEmail) || string.IsNullOrEmpty(adminPasswordHash))
                {
                    return StatusCode(500, new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Admin credentials not configured" 
                    });
                }

                if (IsLockedOut(adminEmail, out var remaining))
                {
                    return StatusCode(423, new LoginResponse
                    {
                        Success = false,
                        Message = $"Account locked. Try again in {remaining.TotalMinutes:F0} minutes"
                    });
                }

                // Validate identifier (email or username)
                bool isIdentifierValid = request.Identifier == adminEmail || request.Identifier == adminUsername;
                
                if (!isIdentifierValid)
                {
                    RecordFailure(adminEmail);
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                // Verify password using BCrypt (Work Factor 11 as per SRS)
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, adminPasswordHash);
                
                if (!isPasswordValid)
                {
                    RecordFailure(adminEmail);
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                RecordSuccess(adminEmail);

                // Generate OTP
                var otp = GenerateOTP();
                var expiry = DateTime.UtcNow.AddMinutes(5);
                
                // Store OTP (in production, use Redis with TTL)
                _otpStore[adminEmail] = (otp, expiry);

                // Send OTP via email
                var adminName = _configuration["AdminCredentials:Name"] ?? "Admin";
                await _emailService.SendOtpEmailAsync(adminEmail, adminName, otp, 5);
                
                _logger.LogInformation("OTP generated and sent to {Email}", adminEmail);

                return Ok(new LoginResponse
                {
                    Success = true,
                    NextStep = "otp",
                    Message = "OTP sent to your registered email"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new LoginResponse 
                { 
                    Success = false, 
                    Message = "An error occurred during login" 
                });
            }
        }

        /// <summary>
        /// Step 2: Verify OTP and generate JWT token
        /// </summary>
        [AllowAnonymous]
        [HttpPost("verify-otp")]
        public ActionResult<LoginResponse> VerifyOTP([FromBody] VerifyOtpRequest request)
        {
            try
            {
                if (IsLockedOut(request.Email, out var remaining))
                {
                    return StatusCode(423, new LoginResponse
                    {
                        Success = false,
                        Message = $"Account locked. Try again in {remaining.TotalMinutes:F0} minutes"
                    });
                }

                // Check if OTP exists and is not expired
                if (!_otpStore.ContainsKey(request.Email))
                {
                    RecordFailure(request.Email);
                    return BadRequest(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "No OTP found. Please login again" 
                    });
                }

                var (storedOtp, expiry) = _otpStore[request.Email];

                // Check expiry
                if (DateTime.UtcNow > expiry)
                {
                    _otpStore.Remove(request.Email);
                    RecordFailure(request.Email);
                    return BadRequest(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "OTP expired. Please login again" 
                    });
                }

                // Check master OTP for development
                var masterOtp = _configuration["AdminCredentials:MasterOTP"];
                bool isOtpValid = request.Otp == storedOtp || request.Otp == masterOtp;

                if (!isOtpValid)
                {
                    RecordFailure(request.Email);
                    return BadRequest(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid OTP" 
                    });
                }

                // Remove used OTP
                _otpStore.Remove(request.Email);
                RecordSuccess(request.Email);

                // Generate JWT token
                var token = GenerateJwtToken(request.Email);

                // Get admin user details
                var adminUser = new AdminUserDto
                {
                    Id = 1,
                    Name = _configuration["AdminCredentials:Name"] ?? "Admin",
                    Email = request.Email,
                    Username = _configuration["AdminCredentials:Username"] ?? "",
                    Role = "super_admin",
                    Permissions = new[] { "all" },
                    LoginTime = DateTime.UtcNow
                };

                return Ok(new LoginResponse
                {
                    Success = true,
                    NextStep = "authenticated",
                    Token = token,
                    User = adminUser,
                    Message = "Login successful"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during OTP verification");
                return StatusCode(500, new LoginResponse 
                { 
                    Success = false, 
                    Message = "An error occurred during verification" 
                });
            }
        }

        /// <summary>
        /// Utility: Generate 6-digit OTP
        /// </summary>
        private string GenerateOTP()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        /// <summary>
        /// Utility: Generate JWT token as per SRS requirements
        /// </summary>
        private string GenerateJwtToken(string email)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "1440"); // 24 hours default

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, "super_admin"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private bool IsLockedOut(string key, out TimeSpan remaining)
        {
            remaining = TimeSpan.Zero;
            if (_authFailures.TryGetValue(key, out var entry) && entry.LockoutUntil.HasValue)
            {
                var now = DateTimeOffset.UtcNow;
                if (entry.LockoutUntil > now)
                {
                    remaining = entry.LockoutUntil.Value - now;
                    return true;
                }

                _authFailures.TryRemove(key, out _); // lockout expired
            }
            return false;
        }

        private void RecordFailure(string key)
        {
            _authFailures.AddOrUpdate(key,
                _ => (1, (DateTimeOffset?)null),
                (_, existing) =>
                {
                    var count = existing.FailCount + 1;
                    var lockout = existing.LockoutUntil;
                    if (count >= LockoutThreshold)
                    {
                        lockout = DateTimeOffset.UtcNow.Add(LockoutDuration);
                        _logger.LogWarning("Account locked for {Key} after {Count} failed attempts", key, count);
                    }
                    return (count, lockout);
                });
        }

        private void RecordSuccess(string key)
        {
            _authFailures.TryRemove(key, out _);
        }

        /// <summary>
        /// Utility endpoint to hash a password (for setup only, remove in production)
        /// </summary>
        [AllowAnonymous]
        [HttpPost("hash-password")]
        public ActionResult<object> HashPassword([FromBody] string password)
        {
            if (string.IsNullOrEmpty(password))
            {
                return BadRequest("Password is required");
            }

            // BCrypt with Work Factor 11 as per SRS Section 3.3.2
            var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
            
            return Ok(new { PasswordHash = hash });
        }
    }
}
