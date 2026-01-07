using System.ComponentModel.DataAnnotations;

namespace FloodAid.Api.Models
{
    public enum InvitationStatus
    {
        Pending = 0,
        Accepted = 1,
        Expired = 2,
        Revoked = 3
    }

    public class Invitation
    {
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Token { get; set; } = string.Empty;
        
        /// <summary>
        /// Role being invited for: 0=Volunteer, 1=Donor, 3=ProvinceAdmin, 4=SuperAdmin
        /// </summary>
        [Required]
        public int Role { get; set; }
        
        /// <summary>
        /// Province scope for ProvinceAdmin invites
        /// </summary>
        public int? ProvinceId { get; set; }
        public Province? Province { get; set; }
        
        /// <summary>
        /// City scope for Volunteer invites
        /// </summary>
        public int? CityId { get; set; }
        public City? City { get; set; }
        
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime ExpiresAt { get; set; }
        
        public DateTime? AcceptedAt { get; set; }
        
        public DateTime? RevokedAt { get; set; }
        
        /// <summary>
        /// Admin who created the invitation
        /// </summary>
        public int CreatedByAdminId { get; set; }
        
        public string? InviterName { get; set; }
    }
}
