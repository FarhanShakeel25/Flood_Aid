using System.ComponentModel.DataAnnotations;
using FloodAid.Api.Enums;

namespace FloodAid.Api.Models
{
    public class HelpRequest
    {
        [Key]
        public int Id { get; set; }

        public string? RequestorName { get; set; }
        public string? RequestorPhoneNumber { get; set; }
        public string? RequestorEmail { get; set; }

        [Required]        
        public RequestType RequestType { get; set; }

        [Required]
        public RequestStatus Status { get; set; }

        [Required]
        public required string RequestDescription { get; set; }

        [Required]
        public required double Longitude { get; set; }

        [Required]
        public required double Latitude { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
