using System.ComponentModel.DataAnnotations;

namespace FloodAid.Api.Models.DTOs
{
    public class LoginRequest
    {
        [Required]
        public string Identifier { get; set; } = string.Empty; // Email or Username
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class VerifyOtpRequest
    {
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Otp { get; set; } = string.Empty;
    }
}
