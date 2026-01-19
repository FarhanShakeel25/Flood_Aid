using System.ComponentModel.DataAnnotations;

namespace FloodAid.Api.Models
{
    public class UnassignmentAudit
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int HelpRequestId { get; set; }
        public HelpRequest? HelpRequest { get; set; }

        public int? ActorUserId { get; set; }
        public User? ActorUser { get; set; }

        [Required]
        public string ActorRole { get; set; } = string.Empty;

        [Required]
        public string ActorEmail { get; set; } = string.Empty;

        public string? Reason { get; set; }
        public string? EvidenceUrl { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
