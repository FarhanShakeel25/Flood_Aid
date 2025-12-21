using Microsoft.AspNetCore.Mvc;
using FloodAid.Api.Models;
using FloodAid.Api.Services;
using Stripe;
using Stripe.Checkout;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/donation")]
    public class DonationController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly ILogger<DonationController> _logger;

        public DonationController(
            IConfiguration configuration,
            IEmailService emailService,
            ILogger<DonationController> logger)
        {
            _configuration = configuration;
            _emailService = emailService;
            _logger = logger;

            // Configure Stripe
            StripeConfiguration.ApiKey = _configuration["Stripe:ApiKey"];
        }

        [HttpPost("create-session")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CashDonationRequest request)
        {
            try
            {
                var options = new SessionCreateOptions
                {
                    PaymentMethodTypes = new List<string> { "card" },
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            PriceData = new SessionLineItemPriceDataOptions
                            {
                                Currency = "pkr",
                                ProductData = new SessionLineItemPriceDataProductDataOptions
                                {
                                    Name = "Flood Aid Donation",
                                    Description = $"Thank you for your generous donation!",
                                },
                                UnitAmount = (long)(request.Amount * 100), // Convert to paisa
                            },
                            Quantity = 1,
                        },
                    },
                    Mode = "payment",
                    SuccessUrl = $"{Request.Scheme}://{Request.Host}/success?session_id={{CHECKOUT_SESSION_ID}}",
                    CancelUrl = $"{Request.Scheme}://{Request.Host}/cancel",
                    CustomerEmail = request.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        { "donor_name", request.Name },
                        { "donor_email", request.Email }
                    }
                };

                var service = new SessionService();
                Session session = await service.CreateAsync(options);

                // Send email confirmation
                await _emailService.SendDonationConfirmationAsync(
                    request.Email,
                    request.Name,
                    request.Amount,
                    session.Id
                );

                return Ok(new { sessionId = session.Id, url = session.Url });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating checkout session");
                return StatusCode(500, new { error = "Failed to create payment session" });
            }
        }

        [HttpPost("create-supplies")]
        public async Task<IActionResult> CreateSuppliesDonation([FromBody] SuppliesDonationRequest request)
        {
            try
            {
                var donation = new Donation(Enums.DonationType.OtherSupplies, Guid.NewGuid().ToString())
                {
                    DonorName = request.Name,
                    DonorEmail = request.Email,
                    SuppliesDescription = request.Description
                };

                // Send email confirmation
                await _emailService.SendDonationConfirmationAsync(
                    request.Email,
                    request.Name,
                    0,
                    donation.ReceiptId
                );

                return Ok(new { id = donation.ReceiptId, receiptId = donation.ReceiptId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating supplies donation");
                return StatusCode(500, new { error = "Failed to create supplies donation" });
            }
        }
    }

    public class CashDonationRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class SuppliesDonationRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
