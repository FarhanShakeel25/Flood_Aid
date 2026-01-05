using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FloodAid.Api.Models;
using FloodAid.Api.Models.DTOs;
using FloodAid.Api.Services;
using FloodAid.Api.Data;
using BCrypt.Net;

namespace FloodAid.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        private readonly FloodAidContext _context;
        
        // In-memory storage for OTPs (in production, use Redis or database with expiration)
        private static readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();

        public AuthController(IConfiguration configuration, ILogger<AuthController> logger, IEmailService emailService, FloodAidContext context)
        {
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
            _context = context;
        }

        /// <summary>
        /// Step 1: Verify admin credentials and send OTP
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                // Get admin user from database
                var adminUser = await _context.Admins.FirstOrDefaultAsync(a => 
                    a.Email == request.Identifier || a.Username == request.Identifier);

                if (adminUser == null)
                {
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                // Check if admin is active
                if (!adminUser.IsActive)
                {
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Admin account is inactive" 
                    });
                }

                // Verify password using BCrypt (Work Factor 11 as per SRS)
                _logger.LogInformation("Attempting password verification for {Email}", adminUser.Email);
                _logger.LogInformation("Stored hash: {Hash}", adminUser.PasswordHash);
                _logger.LogInformation("Provided password length: {Length}", request.Password?.Length ?? 0);
                
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, adminUser.PasswordHash);
                
                _logger.LogInformation("Password verification result: {Result}", isPasswordValid);
                
                if (!isPasswordValid)
                {
                    return Unauthorized(new LoginResponse 
                    { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                // Use master OTP for dev/testing and skip email dispatch
                var otp = _configuration["AdminCredentials:MasterOTP"];
                if (string.IsNullOrWhiteSpace(otp))
                {
                    otp = GenerateOTP();
                }

                var expiry = DateTime.UtcNow.AddMinutes(5);

                // Store OTP (in production, use Redis with TTL)
                _otpStore[adminUser.Email] = (otp, expiry);

                _logger.LogInformation("OTP email suppressed for {Email}. Use master OTP configured in AdminCredentials:MasterOTP.", adminUser.Email);

                return Ok(new LoginResponse
                {
                    Success = true,
                    NextStep = "otp",
                    Message = "Use master OTP to continue (email sending disabled in dev)"
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
        public async Task<ActionResult<LoginResponse>> VerifyOTP([FromBody] VerifyOtpRequest request)
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
                var token = await GenerateJwtToken(request.Email);

                // Get admin user details from database
                var adminUser = await _context.Admins.FirstOrDefaultAsync(a => a.Email == request.Email);
                
                var adminDto = new AdminUserDto
                {
                    Id = adminUser?.Id ?? 1,
                    Name = adminUser?.Name ?? _configuration["AdminCredentials:Name"] ?? "Admin",
                    Email = request.Email,
                    Username = adminUser?.Username ?? _configuration["AdminCredentials:Username"] ?? "",
                    Role = adminUser?.Role ?? "SuperAdmin",
                    Permissions = new[] { "all" },
                    LoginTime = DateTime.UtcNow
                };

                return Ok(new LoginResponse
                {
                    Success = true,
                    NextStep = "authenticated",
                    Token = token,
                    User = adminDto,
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
        /// Utility: Generate JWT token as per SRS requirements with role and scope claims
        /// </summary>
        private async Task<string> GenerateJwtToken(string email)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];
            var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "1440"); // 24 hours default

            // Fetch admin user details from database
            var adminUser = await _context.Admins.FirstOrDefaultAsync(a => a.Email == email);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, adminUser?.Role ?? "SuperAdmin"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
            };

            // Add scope claims if admin has province assignment
            if (adminUser?.ProvinceId.HasValue == true)
            {
                claims.Add(new Claim("provinceId", adminUser.ProvinceId.Value.ToString()));
            }

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

        /// <summary>
        /// Send OTP via email using Brevo service
        /// </summary>
        private async Task SendOtpEmailAsync(string adminEmail, string otp)
        {
            try
            {
                var brevoApiKey = _configuration["Email:BrevoApiKey"];
                var fromEmail = _configuration["Email:FromEmail"];
                var fromName = _configuration["Email:FromName"];

                _logger.LogInformation("Sending OTP email to {Email}", adminEmail);

                // If API key is empty, log to console (development mode)
                if (string.IsNullOrWhiteSpace(brevoApiKey))
                {
                    _logger.LogInformation(
                        "=== OTP EMAIL (Console Mode) ===" +
                        "\nTo: {ToEmail}" +
                        "\nOTP: {OTP}" +
                        "\nExpires in: 5 minutes" +
                        "\n==================================",
                        adminEmail, otp
                    );
                    return;
                }

                // Production: Send via Brevo API
                using (var httpClient = new HttpClient())
                {
                    var emailPayload = new
                    {
                        sender = new { name = fromName ?? "Flood Aid", email = fromEmail ?? "noreply@floodaid.com" },
                        to = new[] { new { email = adminEmail } },
                        subject = "Flood Aid Admin Login - OTP Code",
                        htmlContent = $@"
                            <html>
                            <body style='font-family: Arial, sans-serif;'>
                                <h2>Flood Aid Admin Login</h2>
                                <p>Your One-Time Password (OTP) for admin login is:</p>
                                <h1 style='color: #e74c3c; letter-spacing: 5px; font-size: 32px;'>{otp}</h1>
                                <p>This OTP will expire in <strong>5 minutes</strong>.</p>
                                <p>If you did not request this OTP, please ignore this email.</p>
                                <br/>
                                <p>Best regards,<br/>Flood Aid Security Team</p>
                            </body>
                            </html>
                        "
                    };

                    var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
                    {
                        Content = new StringContent(
                            System.Text.Json.JsonSerializer.Serialize(emailPayload),
                            System.Text.Encoding.UTF8,
                            "application/json"
                        )
                    };
                    request.Headers.Add("api-key", brevoApiKey);
                    request.Headers.Add("accept", "application/json");

                    var response = await httpClient.SendAsync(request);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("OTP email sent successfully to {Email}", adminEmail);
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogError("Failed to send OTP email: {StatusCode} {Error}", response.StatusCode, errorContent);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending OTP email to {Email}", adminEmail);
                // Don't throw - log only, as email failure shouldn't block login flow
            }
        }
    }
}
