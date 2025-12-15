using System.ComponentModel.DataAnnotations;
using FloodAid.Api.Enums;

namespace FloodAid.Api.Models
{
    
    
    public class Donation
    {
        public Donation(DonationType type, string accountnumber)
        {
            DonationType = type;
            DonorAccountNumber = accountnumber;
            DonationDate = DateTime.Now;
            Status = DonationStatus.Pending;
        }

        public decimal? DonationAmount { get; set; }
        public int? Quantity { get; set; }
        public string? DonorName { get; set; }

        [Required]
        public string DonorAccountNumber { get; set; }

        [Required]
        public DonationType DonationType { get; private set; }
        
        [Required]
        public DateTime DonationDate{ get; private set; }

        [Required]
        public DonationStatus Status { get; private set; }

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
