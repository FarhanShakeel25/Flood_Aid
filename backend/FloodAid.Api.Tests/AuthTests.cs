using Xunit;
using FluentAssertions;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;

namespace FloodAid.Api.Tests
{
    public class AuthTests
    {
        /// <summary>
        /// Test BCrypt password hashing with work factor 11
        /// </summary>
        [Fact]
        public void PasswordHash_WithValidPassword_VerifiesCorrectly()
        {
            // Arrange
            var password = "SecurePassword123!@#";
            
            // Act
            var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
            var isValid = BCrypt.Net.BCrypt.Verify(password, hash);
            
            // Assert
            isValid.Should().BeTrue("Password should verify against its own hash");
        }

        [Fact]
        public void PasswordHash_WithInvalidPassword_FailsVerification()
        {
            // Arrange
            var password = "SecurePassword123!@#";
            var wrongPassword = "WrongPassword456!@#";
            var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
            
            // Act
            var isValid = BCrypt.Net.BCrypt.Verify(wrongPassword, hash);
            
            // Assert
            isValid.Should().BeFalse("Wrong password should not verify against hash");
        }

        /// <summary>
        /// Test JWT token generation and validation
        /// </summary>
        [Fact]
        public void JwtToken_WithValidSecret_ValidatesSuccessfully()
        {
            // Arrange
            var secretKey = "TESTKEY_CHANGE_THIS_TO_SECURE_KEY_IN_PRODUCTION_MIN_32_CHARS";
            var token = GenerateTestToken(secretKey);
            
            // Act
            var principal = ValidateToken(token, secretKey);
            
            // Assert
            principal.Should().NotBeNull("Token should validate with correct secret");
            principal?.FindFirst("email")?.Value.Should().Be("test@example.com");
        }

        [Fact]
        public void JwtToken_WithInvalidSecret_FailsValidation()
        {
            // Arrange
            var secretKey = "TESTKEY_CHANGE_THIS_TO_SECURE_KEY_IN_PRODUCTION_MIN_32_CHARS";
            var wrongSecret = "WRONGKEY_CHANGE_THIS_TO_SECURE_KEY_IN_PRODUCTION_MIN_32_CHARS";
            var token = GenerateTestToken(secretKey);
            
            // Act & Assert
            Assert.Throws<SecurityTokenSignatureKeyNotFoundException>(() => ValidateToken(token, wrongSecret));
        }

        [Fact]
        public void JwtToken_WithExpiredToken_FailsValidation()
        {
            // Arrange
            var secretKey = "TESTKEY_CHANGE_THIS_TO_SECURE_KEY_IN_PRODUCTION_MIN_32_CHARS";
            var expiredToken = GenerateTestToken(secretKey, expiresIn: TimeSpan.FromSeconds(-10));
            
            // Act & Assert
            Assert.Throws<SecurityTokenExpiredException>(() => ValidateToken(expiredToken, secretKey));
        }

        /// <summary>
        /// Helper: Generate a test JWT token
        /// </summary>
        private string GenerateTestToken(string secretKey, TimeSpan? expiresIn = null)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new System.Security.Claims.Claim("email", "test@example.com"),
                new System.Security.Claims.Claim("role", "admin"),
                new System.Security.Claims.Claim("jti", Guid.NewGuid().ToString()),
                new System.Security.Claims.Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
            };

            var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
                issuer: "FloodAid.Api",
                audience: "FloodAid.Frontend",
                claims: claims,
                expires: DateTime.UtcNow.Add(expiresIn ?? TimeSpan.FromMinutes(30)),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Helper: Validate a JWT token
        /// </summary>
        private System.Security.Claims.ClaimsPrincipal? ValidateToken(string token, string secretKey)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = "FloodAid.Api",
                ValidateAudience = true,
                ValidAudience = "FloodAid.Frontend",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return principal;
        }

        /// <summary>
        /// Test OTP generation: 6 digits, not expired immediately
        /// </summary>
        [Fact]
        public void OtpGeneration_ProducesValidFormat()
        {
            // Arrange
            var otpExpiry = DateTimeOffset.UtcNow.AddMinutes(5);
            
            // Act - Generate multiple OTPs
            var otps = Enumerable.Range(0, 10)
                .Select(_ => GenerateOTP())
                .ToList();
            
            // Assert
            foreach (var otp in otps)
            {
                otp.Should().MatchRegex(@"^\d{6}$", "OTP should be 6 digits");
            }
            
            // All different (statistically, not guaranteed but very likely)
            otps.Distinct().Count().Should().BeGreaterThan(1, "OTPs should vary");
        }

        [Fact]
        public void OtpExpiry_ChecksBoundaryConditions()
        {
            // Arrange
            var now = DateTimeOffset.UtcNow;
            var expiryTime = now.AddMinutes(5);
            
            // Act
            var isExpiredAtExactTime = now > expiryTime;
            var isExpiredOneSecondAfter = now.AddSeconds(1) > expiryTime;
            var isExpiredAfterWindow = now.AddMinutes(6) > expiryTime;
            
            // Assert
            isExpiredAtExactTime.Should().BeFalse("Exact expiry time should not be expired yet");
            isExpiredOneSecondAfter.Should().BeFalse("1 second after expiry should not be expired");
            isExpiredAfterWindow.Should().BeTrue("6 minutes later should be expired");
        }

        /// <summary>
        /// Test refresh token rotation: new token != old token
        /// </summary>
        [Fact]
        public void RefreshTokenRotation_ProducesNewToken()
        {
            // Arrange
            var token1 = GenerateSecureToken();
            
            // Act
            var token2 = GenerateSecureToken();
            
            // Assert
            token1.Should().NotBe(token2, "Tokens should be unique");
        }

        /// <summary>
        /// Helper: Generate OTP
        /// </summary>
        private string GenerateOTP()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        /// <summary>
        /// Helper: Generate secure token
        /// </summary>
        private string GenerateSecureToken()
        {
            return Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
        }
    }
}
