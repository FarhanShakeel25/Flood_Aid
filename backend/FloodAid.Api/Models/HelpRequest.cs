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

        /// <summary>
        /// Geographic scope: Province where help is needed
        /// </summary>
        public int? ProvinceId { get; set; }
        public Province? Province { get; set; }

        /// <summary>
        /// Geographic scope: City where help is needed
        /// </summary>
        public int? CityId { get; set; }
        public City? City { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Assignment status: Unassigned, Assigned, InProgress, Completed, Cancelled
        /// </summary>
        [Required]
        public AssignmentStatus AssignmentStatus { get; set; } = AssignmentStatus.Unassigned;

        /// <summary>
        /// FK to User (Volunteer) assigned to handle this request
        /// </summary>
        public int? AssignedToVolunteerId { get; set; }
        public User? AssignedToVolunteer { get; set; }

        /// <summary>
        /// Timestamp when assignment was made
        /// </summary>
        public DateTime? AssignedAt { get; set; }

        /// <summary>
        /// Priority level: Low, Medium, High, Critical
        /// </summary>
        [Required]
        public Priority Priority { get; set; } = Priority.Medium;

        /// <summary>
        /// Due date calculated based on priority (Critical: 1hr, High: 4hrs, Medium: 24hrs, Low: 7 days)
        /// </summary>
        public DateTime? DueDate { get; set; }

        /// <summary>
        /// Reason for unassignment when volunteer unassigns themselves
        /// </summary>
        public UnassignReason? UnassignReason { get; set; }

        /// <summary>
        /// Timestamp when volunteer unassigned themselves
        /// </summary>
        public DateTime? UnassignedAt { get; set; }
    }
}
