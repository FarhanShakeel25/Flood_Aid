using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Distributed;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
        private readonly TimeSpan _accessTokenExpiry;
        private readonly TimeSpan _refreshTokenLifetime;
        private readonly TimeSpan _resetTokenExpiry;
        private readonly TimeSpan _passwordCacheDuration;

        private const string OtpCachePrefix = "otp:";
        private const string AuthFailCachePrefix = "authfail:";
        private const string RefreshCachePrefix = "refresh:";
        private const string ResetCachePrefix = "pwreset:";
        private const string AdminPasswordCachePrefix = "adminpwd:";

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
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var accessMinutes = authSettings.GetValue<int?>("AccessTokenMinutes") ?? int.Parse(jwtSettings["ExpiryMinutes"] ?? "30");
            _accessTokenExpiry = TimeSpan.FromMinutes(accessMinutes);
            _refreshTokenLifetime = TimeSpan.FromDays(authSettings.GetValue<int?>("RefreshTokenDays") ?? 7);
            _resetTokenExpiry = TimeSpan.FromMinutes(authSettings.GetValue<int?>("ResetTokenMinutes") ?? 60);
            _passwordCacheDuration = TimeSpan.FromDays(authSettings.GetValue<int?>("PasswordCacheDays") ?? 30);
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
                var adminPasswordHash = await GetAdminPasswordHashAsync(adminEmail!);

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

                // Validate OTP
                bool isOtpValid = request.Otp == otpEntry.Otp;

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

                var adminUser = BuildAdminUser(request.Email);

                var tokens = await IssueTokensAsync(request.Email);

                return Ok(new LoginResponse
                {
                    Success = true,
                    NextStep = "authenticated",
                    Token = tokens.AccessToken,
                    RefreshToken = tokens.RefreshToken,
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
        /// Refresh access token using a valid refresh token
        /// </summary>
        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return BadRequest(new LoginResponse { Success = false, Message = "Refresh token is required" });
            }

            var refreshEntry = await GetRefreshTokenAsync(request.RefreshToken);
            if (refreshEntry is null)
            {
                return Unauthorized(new LoginResponse { Success = false, Message = "Invalid refresh token" });
            }

            await RemoveRefreshTokenAsync(request.RefreshToken); // rotate token

            var adminUser = BuildAdminUser(refreshEntry.Email);
            var tokens = await IssueTokensAsync(refreshEntry.Email);

            return Ok(new LoginResponse
            {
                Success = true,
                NextStep = "authenticated",
                Token = tokens.AccessToken,
                RefreshToken = tokens.RefreshToken,
                User = adminUser,
                Message = "Token refreshed"
            });
        }

        /// <summary>
        /// Logout and revoke provided refresh token
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized();
            }

            if (!string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                var entry = await GetRefreshTokenAsync(request.RefreshToken);
                if (entry is not null && string.Equals(entry.Email, email, StringComparison.OrdinalIgnoreCase))
                {
                    await RemoveRefreshTokenAsync(request.RefreshToken);
                }
            }

            return Ok(new { Success = true, Message = "Logged out" });
        }

        /// <summary>
        /// Request a password reset link
        /// </summary>
        [AllowAnonymous]
        [HttpPost("reset/request")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequest request)
        {
            var adminEmail = _configuration["AdminCredentials:Email"];
            var adminName = _configuration["AdminCredentials:Name"] ?? "Admin";

            if (string.IsNullOrWhiteSpace(request.Email) || !string.Equals(request.Email, adminEmail, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { Success = false, Message = "Account not found" });
            }

            var token = GenerateSecureToken();
            var expiry = DateTimeOffset.UtcNow.Add(_resetTokenExpiry);

            await SetResetTokenAsync(token, adminEmail!, expiry);
            await _emailService.SendPasswordResetEmailAsync(adminEmail!, adminName, token, (int)_resetTokenExpiry.TotalMinutes);

            return Ok(new { Success = true, Message = "Password reset email sent" });
        }

        /// <summary>
        /// Verify password reset token validity
        /// </summary>
        [AllowAnonymous]
        [HttpPost("reset/verify")]
        public async Task<IActionResult> VerifyPasswordReset([FromBody] VerifyResetTokenRequest request)
        {
            var tokenEntry = await GetResetTokenAsync(request.Token);
            if (tokenEntry is null)
            {
                return BadRequest(new { Success = false, Message = "Invalid or expired token" });
            }

            if (DateTimeOffset.UtcNow > tokenEntry.Expiry)
            {
                await RemoveResetTokenAsync(request.Token);
                return BadRequest(new { Success = false, Message = "Token expired" });
            }

            return Ok(new { Success = true, Message = "Token valid" });
        }

        /// <summary>
        /// Confirm password reset and update admin password hash in cache
        /// </summary>
        [AllowAnonymous]
        [HttpPost("reset/confirm")]
        public async Task<ActionResult<LoginResponse>> ConfirmPasswordReset([FromBody] ConfirmResetRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            {
                return BadRequest(new LoginResponse { Success = false, Message = "Password must be at least 8 characters" });
            }

            var tokenEntry = await GetResetTokenAsync(request.Token);
            if (tokenEntry is null)
            {
                return BadRequest(new LoginResponse { Success = false, Message = "Invalid or expired token" });
            }

            if (DateTimeOffset.UtcNow > tokenEntry.Expiry)
            {
                await RemoveResetTokenAsync(request.Token);
                return BadRequest(new LoginResponse { Success = false, Message = "Token expired" });
            }

            var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 11);
            await SetAdminPasswordHashAsync(tokenEntry.Email, newHash);
            await RemoveResetTokenAsync(request.Token);
            await RecordSuccessAsync(tokenEntry.Email); // clear lockout state after reset

            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Password reset successful. You can login with your new password."
            });
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
                expires: DateTime.UtcNow.Add(_accessTokenExpiry),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private AdminUserDto BuildAdminUser(string email)
        {
            return new AdminUserDto
            {
                Id = 1,
                Name = _configuration["AdminCredentials:Name"] ?? "Admin",
                Email = email,
                Username = _configuration["AdminCredentials:Username"] ?? string.Empty,
                Role = "super_admin",
                Permissions = new[] { "all" },
                LoginTime = DateTime.UtcNow
            };
        }

        private async Task<(string AccessToken, string RefreshToken)> IssueTokensAsync(string email)
        {
            var accessToken = GenerateJwtToken(email);
            var refreshToken = GenerateSecureToken();
            var entry = new RefreshTokenEntry
            {
                Email = email,
                Expiry = DateTimeOffset.UtcNow.Add(_refreshTokenLifetime)
            };

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = entry.Expiry
            };

            var payload = JsonSerializer.Serialize(entry, _jsonOptions);
            await _cache.SetStringAsync($"{RefreshCachePrefix}{refreshToken}", payload, options);

            return (accessToken, refreshToken);
        }

        private string GenerateSecureToken(int byteLength = 32)
        {
            Span<byte> buffer = stackalloc byte[byteLength];
            RandomNumberGenerator.Fill(buffer);
            return Convert.ToBase64String(buffer)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private async Task<RefreshTokenEntry?> GetRefreshTokenAsync(string token)
        {
            var json = await _cache.GetStringAsync($"{RefreshCachePrefix}{token}");
            if (string.IsNullOrEmpty(json))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<RefreshTokenEntry>(json, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize refresh token entry");
                await RemoveRefreshTokenAsync(token);
                return null;
            }
        }

        private Task RemoveRefreshTokenAsync(string token)
        {
            return _cache.RemoveAsync($"{RefreshCachePrefix}{token}");
        }

        private Task SetResetTokenAsync(string token, string email, DateTimeOffset expiry)
        {
            var entry = new ResetTokenEntry { Email = email, Expiry = expiry };
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = expiry
            };

            var payload = JsonSerializer.Serialize(entry, _jsonOptions);
            return _cache.SetStringAsync($"{ResetCachePrefix}{token}", payload, options);
        }

        private async Task<ResetTokenEntry?> GetResetTokenAsync(string token)
        {
            var json = await _cache.GetStringAsync($"{ResetCachePrefix}{token}");
            if (string.IsNullOrEmpty(json))
            {
                return null;
            }

            try
            {
                return JsonSerializer.Deserialize<ResetTokenEntry>(json, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize reset token entry");
                await RemoveResetTokenAsync(token);
                return null;
            }
        }

        private Task RemoveResetTokenAsync(string token)
        {
            return _cache.RemoveAsync($"{ResetCachePrefix}{token}");
        }

        private async Task<string> GetAdminPasswordHashAsync(string email)
        {
            var cached = await _cache.GetStringAsync($"{AdminPasswordCachePrefix}{email}");
            if (!string.IsNullOrEmpty(cached))
            {
                return cached;
            }

            return _configuration["AdminCredentials:PasswordHash"] ?? string.Empty;
        }

        private Task SetAdminPasswordHashAsync(string email, string passwordHash)
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = _passwordCacheDuration
            };

            return _cache.SetStringAsync($"{AdminPasswordCachePrefix}{email}", passwordHash, options);
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

        private class RefreshTokenEntry
        {
            public string Email { get; set; } = string.Empty;
            public DateTimeOffset Expiry { get; set; }
        }

        private class ResetTokenEntry
        {
            public string Email { get; set; } = string.Empty;
            public DateTimeOffset Expiry { get; set; }
        }

        /// <summary>
        /// Utility endpoint to hash a password (Development only)
        /// </summary>
        [AllowAnonymous]
        [HttpPost("hash-password")]
        public ActionResult<object> HashPassword([FromBody] string password)
        {
            var env = _configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT");
            if (!string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound();
            }

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
