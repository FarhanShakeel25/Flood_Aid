using Microsoft.AspNetCore.Mvc;
using Stripe.Checkout;
using Stripe;
using FloodAid.Api.Models;
using FloodAid.Api.Enums;
using FloodAid.Api.DTOs;

namespace FloodAid.Api.Controllers
{
    [Route("api/donations")]
    [ApiController]
    public class DonationsController : ControllerBase
    {
        private static List<Donation> Donations = new List<Donation>();

        // --- NEW: Main donation creation endpoint ---
        [HttpPost("create")]
        public IActionResult CreateDonation([FromBody] CreateDonationRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest(new { success = false, message = "Email is required" });

                if (string.IsNullOrWhiteSpace(request.DonorAccountNumber))
                    return BadRequest(new { success = false, message = "Account number is required" });

                // Create donation object
                var donation = new Donation(
                    donorName: request.DonorName ?? "Anonymous",
                    accountNumber: request.DonorAccountNumber,
                    email: request.Email,
                    type: request.DonationType,
                    amount: request.DonationType == DonationType.Cash ? request.DonationAmount : null,
                    quantity: request.DonationType == DonationType.OtherSupplies ? request.Quantity : null,
                    contact: request.Contact,
                    itemName: request.ItemName,
                    itemCondition: request.ItemCondition,
                    description: request.Description,
                    isRecurring: request.IsRecurring
                );

                // Handle Cash donations with Stripe
                if (request.DonationType == DonationType.Cash)
                {
                    var sessionOptions = new SessionCreateOptions
                    {
                        PaymentMethodTypes = new List<string> { "card" },
                        Mode = request.IsRecurring ? "subscription" : "payment",
                        LineItems = new List<SessionLineItemOptions>
                        {
                            new SessionLineItemOptions
                            {
                                PriceData = new SessionLineItemPriceDataOptions
                                {
                                    UnitAmount = (long)(request.DonationAmount!.Value * 100), // Convert to cents/paise
                                    Currency = "inr", // Indian Rupees
                                    ProductData = new SessionLineItemPriceDataProductDataOptions
                                    {
                                        Name = "FloodAid Donation",
                                        Description = request.IsRecurring ? "Monthly Recurring Donation" : "One-time Donation"
                                    },
                                    Recurring = request.IsRecurring ? new SessionLineItemPriceDataRecurringOptions
                                    {
                                        Interval = "month"
                                    } : null
                                },
                                Quantity = 1
                            }
                        },
                        SuccessUrl = "https://flood-aid-94zg.vercel.app/donate/success?session_id={CHECKOUT_SESSION_ID}",
                        CancelUrl = "https://flood-aid-94zg.vercel.app/donate/cancel",
                        CustomerEmail = request.Email,
                        Metadata = new Dictionary<string, string>
                        {
                            { "DonorName", request.DonorName ?? "Anonymous" },
                            { "AccountNumber", request.DonorAccountNumber },
                            { "Contact", request.Contact ?? "" },
                            { "IsRecurring", request.IsRecurring.ToString() }
                        }
                    };

                    var service = new SessionService();
                    var session = service.Create(sessionOptions);

                    // Store session ID in donation
                    donation.SetStripeSessionId(session.Id);

                    // Save donation with Pending status (will be approved via webhook)
                    Donations.Add(donation);

                    return Ok(new
                    {
                        success = true,
                        url = session.Url,
                        sessionId = session.Id,
                        donationId = donation.DonorAccountNumber
                    });
                }

                // Handle Goods donations (no Stripe needed)
                Donations.Add(donation);

                return Ok(new
                {
                    success = true,
                    message = "Goods donation registered successfully. Our team will contact you for pickup details.",
                    receiptId = $"GD-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                    donationId = donation.DonorAccountNumber
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (StripeException ex)
            {
                return StatusCode(500, new { success = false, message = $"Payment gateway error: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred processing your donation" });
            }
        }

        // --- Stripe Webhook (UPDATED) ---
        [HttpPost("webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var signature = Request.Headers["Stripe-Signature"];

            try
            {
                // Replace with your actual webhook secret from Stripe Dashboard
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    signature,
                    "whsec_YOUR_WEBHOOK_SECRET" // TODO: Move to appsettings.json
                );

                // Replace the usage of 'Events' with the correct Stripe event type string constants
                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;

                    if (session?.Metadata != null && session.Metadata.ContainsKey("AccountNumber"))
                    {
                        var accountNumber = session.Metadata["AccountNumber"];
                        var donation = Donations.FirstOrDefault(d => d.DonorAccountNumber == accountNumber);

                        if (donation != null)
                        {
                            donation.Approve();
                            Console.WriteLine($"✅ Donation {accountNumber} approved via Stripe webhook");
                            
                            // TODO: Send confirmation email here
                        }
                    }
                }
                else if (stripeEvent.Type == "checkout.session.expired")
                {
                    var session = stripeEvent.Data.Object as Session;
                    var accountNumber = session?.Metadata?["AccountNumber"];
                    var donation = Donations.FirstOrDefault(d => d.DonorAccountNumber == accountNumber);

                    if (donation != null)
                    {
                        donation.Reject();
                        Console.WriteLine($"❌ Donation {accountNumber} rejected - session expired");
                    }
                }

                return Ok();
            }
            catch (StripeException ex)
            {
                Console.WriteLine($"Stripe webhook error: {ex.Message}");
                return BadRequest($"Webhook error: {ex.Message}");
            }
        }

        // --- Get all donations ---
        [HttpGet]
        public IActionResult GetAllDonations()
        {
            return Ok(Donations);
        }

        // --- Get donation by account number ---
        [HttpGet("{accountNumber}")]
        public IActionResult GetDonation(string accountNumber)
        {
            var donation = Donations.FirstOrDefault(d => d.DonorAccountNumber == accountNumber);
            if (donation == null)
                return NotFound(new { message = "Donation not found" });

            return Ok(donation);
        }

        // --- Get donation statistics ---
        [HttpGet("statistics")]
        public IActionResult GetStatistics()
        {
            var stats = new
            {
                TotalDonations = Donations.Count,
                TotalCashDonations = Donations.Count(d => d.DonationType == DonationType.Cash),
                TotalGoodsDonations = Donations.Count(d => d.DonationType == DonationType.OtherSupplies),
                TotalAmount = Donations.Where(d => d.DonationType == DonationType.Cash).Sum(d => d.DonationAmount),
                PendingCount = Donations.Count(d => d.Status == DonationStatus.Pending),
                ApprovedCount = Donations.Count(d => d.Status == DonationStatus.Approved),
                RejectedCount = Donations.Count(d => d.Status == DonationStatus.Rejected),
                DistributedCount = Donations.Count(d => d.Status == DonationStatus.Distributed)
            };

            return Ok(stats);
        }

        // --- REMOVED: Old stripe-create-session endpoint (now integrated into /create) ---
    }
}
