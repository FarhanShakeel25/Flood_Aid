using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FloodAid.Api.Models;
using FloodAid.Api.Models.DTOs;
using BCrypt.Net;

namespace FloodAid.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        
        // In-memory storage for OTPs (in production, use Redis or database with expiration)
        private static readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();

        public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Step 1: Verify admin credentials and send OTP
        /// </summary>
        [HttpPost("login")]
        public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
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

                // Validate identifier (email or username)
                bool isIdentifierValid = request.Identifier == adminEmail || request.Identifier == adminUsername;
                
                if (!isIdentifierValid)
                {
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
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                // Generate OTP
                var otp = GenerateOTP();
                var expiry = DateTime.UtcNow.AddMinutes(5);
                
                // Store OTP (in production, use Redis with TTL)
                _otpStore[adminEmail] = (otp, expiry);

                // TODO: Send OTP via email service
                _logger.LogInformation($"OTP generated for {adminEmail}: {otp} (expires at {expiry})");

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
        [HttpPost("verify-otp")]
        public ActionResult<LoginResponse> VerifyOTP([FromBody] VerifyOtpRequest request)
        {
            try
            {
                // Check if OTP exists and is not expired
                if (!_otpStore.ContainsKey(request.Email))
                {
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
                    return BadRequest(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid OTP" 
                    });
                }

                // Remove used OTP
                _otpStore.Remove(request.Email);

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

        /// <summary>
        /// Utility endpoint to hash a password (for setup only, remove in production)
        /// </summary>
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
