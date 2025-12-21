namespace FloodAid.Api.DTOs
{
    public class CashDonationRequest
    {
        public string DonorName { get; set; } = null!;
        public string DonorEmail { get; set; } = null!;
        public decimal Amount { get; set; }
        public bool Recurring { get; set; }
    }
}
