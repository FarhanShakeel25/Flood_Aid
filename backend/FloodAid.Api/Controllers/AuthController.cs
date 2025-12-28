using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Distributed;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
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
        private readonly IDistributedCache _cache;
        private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);
        private readonly int _lockoutThreshold;
        private readonly TimeSpan _lockoutDuration;
        private readonly TimeSpan _otpExpiry;

        private const string OtpCachePrefix = "otp:";
        private const string AuthFailCachePrefix = "authfail:";

        public AuthController(IConfiguration configuration, ILogger<AuthController> logger, IEmailService emailService, IDistributedCache cache)
        {
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
            _cache = cache;

            var authSettings = _configuration.GetSection("AuthSettings");
            _lockoutThreshold = authSettings.GetValue<int?>("LockoutThreshold") ?? 5;
            _lockoutDuration = TimeSpan.FromMinutes(authSettings.GetValue<int?>("LockoutDurationMinutes") ?? 15);
            _otpExpiry = TimeSpan.FromMinutes(authSettings.GetValue<int?>("OtpExpiryMinutes") ?? 5);
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

                var lockout = await IsLockedOutAsync(adminEmail);
                if (lockout.IsLockedOut)
                {
                    return StatusCode(423, new LoginResponse
                    {
                        Success = false,
                        Message = $"Account locked. Try again in {lockout.Remaining.TotalMinutes:F0} minutes"
                    });
                }

                // Validate identifier (email or username)
                bool isIdentifierValid = request.Identifier == adminEmail || request.Identifier == adminUsername;
                
                if (!isIdentifierValid)
                {
                    await RecordFailureAsync(adminEmail);
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
                    await RecordFailureAsync(adminEmail);
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                await RecordSuccessAsync(adminEmail);

                // Generate OTP
                var otp = GenerateOTP();
                var expiry = DateTimeOffset.UtcNow.Add(_otpExpiry);

                await SetOtpAsync(adminEmail, otp, expiry);

                // Send OTP via email
                var adminName = _configuration["AdminCredentials:Name"] ?? "Admin";
                await _emailService.SendOtpEmailAsync(adminEmail, adminName, otp, (int)_otpExpiry.TotalMinutes);
                
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
        public async Task<ActionResult<LoginResponse>> VerifyOTP([FromBody] VerifyOtpRequest request)
        {
            try
            {
                var lockout = await IsLockedOutAsync(request.Email);
                if (lockout.IsLockedOut)
                {
                    return StatusCode(423, new LoginResponse
                    {
                        Success = false,
                        Message = $"Account locked. Try again in {lockout.Remaining.TotalMinutes:F0} minutes"
                    });
                }

                var otpEntry = await GetOtpAsync(request.Email);
                if (otpEntry is null)
                {
                    await RecordFailureAsync(request.Email);
                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = "No OTP found. Please login again"
                    });
                }

                if (DateTimeOffset.UtcNow > otpEntry.Expiry)
                {
                    await RemoveOtpAsync(request.Email);
                    await RecordFailureAsync(request.Email);
                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = "OTP expired. Please login again"
                    });
                }

                // Check master OTP for development
                var masterOtp = _configuration["AdminCredentials:MasterOTP"];
                bool isOtpValid = request.Otp == otpEntry.Otp || request.Otp == masterOtp;

                if (!isOtpValid)
                {
                    await RecordFailureAsync(request.Email);
                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = "Invalid OTP"
                    });
                }

                // Remove used OTP
                await RemoveOtpAsync(request.Email);
                await RecordSuccessAsync(request.Email);

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

        private async Task<(bool IsLockedOut, TimeSpan Remaining)> IsLockedOutAsync(string key)
        {
            var remaining = TimeSpan.Zero;
            var state = await GetFailureStateAsync(key);
            if (state?.LockoutUntil is null)
            {
                return (false, remaining);
            }

            var now = DateTimeOffset.UtcNow;
            if (state.LockoutUntil > now)
            {
                remaining = state.LockoutUntil.Value - now;
                return (true, remaining);
            }

            await RecordSuccessAsync(key); // lockout expired
            return (false, remaining);
        }

        private async Task RecordFailureAsync(string key)
        {
            var now = DateTimeOffset.UtcNow;
            var state = await GetFailureStateAsync(key) ?? new AuthFailureState();
            state.FailCount += 1;

            if (state.FailCount >= _lockoutThreshold)
            {
                state.LockoutUntil = now.Add(_lockoutDuration);
                _logger.LogWarning("Account locked for {Key} after {Count} failed attempts", key, state.FailCount);
            }

            var ttl = state.LockoutUntil.HasValue
                ? state.LockoutUntil.Value - now
                : _lockoutDuration;

            if (ttl <= TimeSpan.Zero)
            {
                ttl = _lockoutDuration;
            }

            await SetFailureStateAsync(key, state, ttl);
        }

        private Task RecordSuccessAsync(string key)
        {
            return _cache.RemoveAsync($"{AuthFailCachePrefix}{key}");
        }

        private async Task<OtpEntry?> GetOtpAsync(string email)
        {
            var json = await _cache.GetStringAsync($"{OtpCachePrefix}{email}");
            if (string.IsNullOrEmpty(json))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<OtpEntry>(json, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize OTP cache entry for {Email}", email);
                await _cache.RemoveAsync($"{OtpCachePrefix}{email}");
                return null;
            }
        }

        private Task SetOtpAsync(string email, string otp, DateTimeOffset expiry)
        {
            var entry = new OtpEntry { Otp = otp, Expiry = expiry };
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = expiry
            };

            var payload = JsonSerializer.Serialize(entry, _jsonOptions);
            return _cache.SetStringAsync($"{OtpCachePrefix}{email}", payload, options);
        }

        private Task RemoveOtpAsync(string email)
        {
            return _cache.RemoveAsync($"{OtpCachePrefix}{email}");
        }

        private async Task<AuthFailureState?> GetFailureStateAsync(string key)
        {
            var json = await _cache.GetStringAsync($"{AuthFailCachePrefix}{key}");
            if (string.IsNullOrEmpty(json))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<AuthFailureState>(json, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize auth failure state for {Key}", key);
                await _cache.RemoveAsync($"{AuthFailCachePrefix}{key}");
                return null;
            }
        }

        private Task SetFailureStateAsync(string key, AuthFailureState state, TimeSpan ttl)
        {
            var payload = JsonSerializer.Serialize(state, _jsonOptions);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            };

            return _cache.SetStringAsync($"{AuthFailCachePrefix}{key}", payload, options);
        }

        private class OtpEntry
        {
            public string Otp { get; set; } = string.Empty;
            public DateTimeOffset Expiry { get; set; }
        }

        private class AuthFailureState
        {
            public int FailCount { get; set; }
            public DateTimeOffset? LockoutUntil { get; set; }
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
