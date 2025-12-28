using System.ComponentModel.DataAnnotations;
using FloodAid.Api.Enums;

namespace FloodAid.Api.Models
{
    
    
    public class Donation
    {
        // Parameterless constructor for EF Core
        public Donation()
        {
        }

        public Donation(DonationType type, string accountnumber)
        {
            DonationType = type;
            DonorAccountNumber = accountnumber;
            DonationDate = DateTime.Now;
            Status = DonationStatus.Pending;
            ReceiptId = Guid.NewGuid().ToString();
        }

        [Key]
        public int Id { get; set; }
        public string ReceiptId { get; set; }
        public decimal? DonationAmount { get; set; }
        public int? Quantity { get; set; }
        public string? DonorName { get; set; }
        public string? DonorEmail { get; set; }
        public string? SuppliesDescription { get; set; }

        [Required]
        public string DonorAccountNumber { get; set; } = string.Empty;

        [Required]
        public DonationType DonationType { get; set; }
        
        [Required]
        public DateTime DonationDate { get; set; }

        [Required]
        public DonationStatus Status { get; set; }

        public void Approved()
        {
            Status = DonationStatus.Approved;
        }
        public void Rejected()
        {
            Status = DonationStatus.Rejected;
        }
        public void Distributed()
        {
            Status = DonationStatus.Distributed;
        }
    }
}
