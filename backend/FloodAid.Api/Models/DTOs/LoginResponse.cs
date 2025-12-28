namespace FloodAid.Api.Models.DTOs
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public string? NextStep { get; set; } // "otp" or "authenticated"
        public string? Token { get; set; }
        public AdminUserDto? User { get; set; }
        public string? Message { get; set; }
    }

    public class AdminUserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string[] Permissions { get; set; } = new[] { "all" };
        public DateTime? LoginTime { get; set; }
    }
}
