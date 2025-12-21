using FloodAid.Api.Enums;

namespace FloodAid.Api.DTOs
{
    public class CreateDonationRequest
    {
        // Common fields
        public DonationType DonationType { get; set; } // 0 = Cash, 1 = OtherSupplies
        public string DonorAccountNumber { get; set; } = null!;
        public string? DonorName { get; set; }
        public string Email { get; set; } = null!;
        public string? Contact { get; set; }
        
        // Cash donation fields
        public decimal? DonationAmount { get; set; }
        public bool IsRecurring { get; set; }
        
        // Goods donation fields
        public int? Quantity { get; set; }
        public string? ItemName { get; set; }
        public string? ItemCondition { get; set; }
        public string? Description { get; set; }
    }
}