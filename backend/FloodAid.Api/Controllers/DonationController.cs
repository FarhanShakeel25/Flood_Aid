using FloodAid.Api.Enums;
using FloodAid.Api.Models;
using FloodAid.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonationController : ControllerBase
    {
        private static readonly List<Donation> _donations = new();
        private readonly string _frontendBaseUrl;
        private readonly IEmailService _emailService;

        public DonationController(IConfiguration configuration, IEmailService emailService)
        {
            var apiKey = configuration["Stripe:ApiKey"];
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                StripeConfiguration.ApiKey = apiKey;
            }
            _emailService = emailService;
            _frontendBaseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
                                 ?? "http://localhost:5173";
        }

        [HttpPost("create-session")]
        public IActionResult CreateStripeSession([FromBody] DonationDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { message = "Invalid payload" });
                }

                if (dto.DonationType != DonationType.Cash)
                {
                    return BadRequest(new { message = "This endpoint is only for cash donations" });
                }

                if (dto.Amount == null || dto.Amount <= 0)
                {
                    return BadRequest(new { message = "Amount must be greater than 0" });
                }

                var accountNumber = GenerateAccountNumber();
                var donation = new Donation(DonationType.Cash, accountNumber)
                {
                    DonationAmount = dto.Amount,
                    DonorName = dto.DonorName
                };

                _donations.Add(donation);

                // Create a real Stripe Checkout Session (test mode using your test secret)
                var amount = (long)Math.Round(dto.Amount.Value * 100m); // smallest currency unit (paisas for PKR)
                var currency = "pkr"; // Pakistani Rupees
                var options = new SessionCreateOptions
                {
                    Mode = "payment",
                    SuccessUrl = $"{_frontendBaseUrl}/?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
                    CancelUrl = $"{_frontendBaseUrl}/?payment=cancelled",
                    LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            Quantity = 1,
                            PriceData = new SessionLineItemPriceDataOptions
                            {
                                Currency = currency,
                                UnitAmount = amount,
                                ProductData = new SessionLineItemPriceDataProductDataOptions
                                {
                                    Name = "Flood Relief Donation"
                                }
                            }
                        }
                    }
                };

                var service = new SessionService();
                var session = service.Create(options);

                // Send confirmation email asynchronously (don't wait for it)
                _ = _emailService.SendDonationConfirmationAsync(
                    dto.Email,
                    dto.DonorName,
                    dto.Amount.Value,
                    "Cash",
                    session.Id
                );

                return Ok(new { sessionId = session.Id, url = session.Url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPost("create-supplies")]
        public IActionResult CreateSuppliesDonation([FromBody] DonationDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { message = "Invalid payload" });
                }

                if (dto.DonationType != DonationType.OtherSupplies)
                {
                    return BadRequest(new { message = "This endpoint is only for supplies donations" });
                }

                if (dto.Quantity == null || dto.Quantity <= 0)
                {
                    return BadRequest(new { message = "Quantity must be greater than 0" });
                }

                // We don't have dedicated fields for supplies in the current model; store minimal record
                var accountNumber = GenerateAccountNumber();
                var donation = new Donation(DonationType.OtherSupplies, accountNumber)
                {
                    Quantity = dto.Quantity,
                    DonorName = dto.DonorName
                };

                _donations.Add(donation);

                var id = Guid.NewGuid().ToString();
                var receiptId = $"RCP-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

                // Send confirmation email for supplies donation
                _ = _emailService.SendDonationConfirmationAsync(
                    dto.Email,
                    dto.DonorName,
                    0m, // No amount for supplies
                    "Supplies",
                    receiptId
                );

                return Ok(new { message = "Donation created successfully", id, receiptId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpGet("all")]
        public IActionResult GetAll() => Ok(_donations);

        private static string GenerateAccountNumber() => $"ACC{DateTime.UtcNow:yyyyMMdd}{Random.Shared.Next(1000, 9999)}";
    }

    public class DonationDto
    {
        public DonationType DonationType { get; set; }
        public string? DonorName { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
        public decimal? Amount { get; set; }
        public string? SupplyDetails { get; set; }
        public int? Quantity { get; set; }
        public string? Description { get; set; }
    }
}
