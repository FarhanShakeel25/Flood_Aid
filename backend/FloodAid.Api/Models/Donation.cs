using System;
using System.ComponentModel.DataAnnotations;
using FloodAid.Api.Enums;

namespace FloodAid.Api.Models
{
    public class Donation
    {
        public Donation(
            DonationType type,
            string? donorName = null, 
            string? email = null,
            string? accountNumber = null,
            decimal? amount = null, 
            int? quantity = null,
            string? contact = null,
            string? itemName = null,
            string? itemCondition = null,
            string? description = null,
            bool isRecurring = false)
        {
            DonorName = donorName;
            DonorAccountNumber = accountNumber;
            DonorEmailAddress = email;
            DonationType = type;
            DonationDate = DateTime.Now;
            Status = DonationStatus.Pending;
            Contact = contact;
            IsRecurring = isRecurring;

            // Validate based on type
            switch (type)
            {
                case DonationType.Cash:
                    if (amount == null || amount <= 0)
                        throw new ArgumentException("Cash donation must have a valid amount.");
                    DonationAmount = amount.Value;
                    Quantity = null;
                    ItemName = null;
                    ItemCondition = null;
                    Description = null;
                    break;

                case DonationType.OtherSupplies:
                    if (quantity == null || quantity <= 0)
                        throw new ArgumentException($"{type} donation must have a valid quantity.");
                    if (string.IsNullOrWhiteSpace(itemName))
                        throw new ArgumentException("Item name is required for goods donations.");
                    
                    Quantity = quantity.Value;
                    ItemName = itemName;
                    ItemCondition = itemCondition ?? "good";
                    Description = description;
                    DonationAmount = 0;
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(type), "Unsupported donation type.");
            }
        }

        // Properties
        [Required] public decimal DonationAmount { get; private set; }
        [Required] public int? Quantity { get; private set; }
        public string? DonorName { get; private set; }
        public string? DonorAccountNumber { get; private set; }
        public string? DonorEmailAddress { get; private set; }
        [Required] public DonationType DonationType { get; private set; }
        [Required] public DateTime DonationDate { get; private set; }
        [Required] public DonationStatus Status { get; private set; }

        // New properties for goods donations
        public string? Contact { get; private set; }
        public string? ItemName { get; private set; }
        public string? ItemCondition { get; private set; }
        public string? Description { get; private set; }
        public bool IsRecurring { get; private set; }
        public string? StripeSessionId { get; private set; }

        // Method to set Stripe session ID after creation
        public void SetStripeSessionId(string sessionId)
        {
            StripeSessionId = sessionId;
        }

        // Status Methods
        public void Approve()
        {
            if (Status != DonationStatus.Pending)
                throw new InvalidOperationException("Only pending donations can be approved.");
            Status = DonationStatus.Approved;
        }

        public void Reject()
        {
            if (Status != DonationStatus.Pending)
                throw new InvalidOperationException("Only pending donations can be rejected.");
            Status = DonationStatus.Rejected;
        }

        public void MarkAsDistributed()
        {
            if (Status != DonationStatus.Approved)
                throw new InvalidOperationException("Only approved donations can be distributed.");
            Status = DonationStatus.Distributed;
        }
    }
}
