using System.ComponentModel.DataAnnotations;
using FloodAid.Api.Enums;

namespace FloodAid.Api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        /// <summary>
        /// Role: 0=Volunteer, 1=Donor, 2=Volunteer+Donor
        /// </summary>
        [Required]
        public int Role { get; set; }

        /// <summary>
        /// Status: 0=Pending, 1=Approved, 2=Rejected
        /// </summary>
        [Required]
        public int Status { get; set; } = 0; // Default: Pending

        public string? ReasonForRejection { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? ApprovedAt { get; set; }

        /// <summary>
        /// For volunteers: track if verified by admin
        /// </summary>
        public string? VerificationNotes { get; set; }
    }

    /// <summary>
    /// DTOs for User Management
    /// </summary>
    public class CreateUserDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        /// <summary>
        /// 0=Volunteer, 1=Donor, 2=Both
        /// </summary>
        [Required]
        public int Role { get; set; }
    }

    public class UpdateUserStatusDto
    {
        /// <summary>
        /// 0=Pending, 1=Approved, 2=Rejected
        /// </summary>
        [Required]
        public int Status { get; set; }

        public string? ReasonForRejection { get; set; }

        public string? VerificationNotes { get; set; }
    }

    public class UserResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int Role { get; set; }
        public int Status { get; set; }
        public string? ReasonForRejection { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? VerificationNotes { get; set; }
    }
}
