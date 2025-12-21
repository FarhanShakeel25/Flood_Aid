namespace FloodAid.Api.Services
{
    public interface IEmailService
    {
        Task SendDonationConfirmationAsync(string toEmail, string donorName, decimal amount, string receiptId);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task SendDonationConfirmationAsync(string toEmail, string donorName, decimal amount, string receiptId)
        {
            var brevoApiKey = _configuration["Email:BrevoApiKey"];
            var fromEmail = _configuration["Email:FromEmail"];
            var fromName = _configuration["Email:FromName"];
            
            _logger.LogInformation("EmailService called: apiKey={ApiKeySet}, from={From}", 
                !string.IsNullOrWhiteSpace(brevoApiKey) ? "SET" : "NULL", fromEmail ?? "NULL");
            
            // If API key is empty, log to console (development mode)
            if (string.IsNullOrWhiteSpace(brevoApiKey))
            {
                _logger.LogInformation(
                    "=== EMAIL CONFIRMATION (Console Mode) ===" +
                    "\nTo: {ToEmail}" +
                    "\nDonor: {DonorName}" +
                    "\nAmount: PKR {Amount:N2}" +
                    "\nReceipt ID: {ReceiptId}" +
                    "\n=====================================",
                    toEmail, donorName, amount, receiptId
                );
                return;
            }

            // Production: Send via Brevo API (works over HTTPS, not blocked by Render)
            try
            {
                var emailPayload = new
                {
                    sender = new { name = fromName ?? "Flood Aid", email = fromEmail ?? "noreply@floodaid.com" },
                    to = new[] { new { email = toEmail, name = donorName } },
                    subject = "Thank you for your donation - Flood Aid",
                    htmlContent = $@"
                        <html>
                        <body>
                            <h2>Thank you for your generous donation!</h2>
                            <p>Dear {donorName},</p>
                            <p>We have received your donation of <strong>PKR {amount:N2}</strong>.</p>
                            <p>Receipt ID: <strong>{receiptId}</strong></p>
                            <p>Your contribution will help flood victims rebuild their lives.</p>
                            <br/>
                            <p>Best regards,<br/>Flood Aid Team</p>
                        </body>
                        </html>
                    "
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
                {
                    Content = JsonContent.Create(emailPayload)
                };
                request.Headers.Add("api-key", brevoApiKey);
                request.Headers.Add("accept", "application/json");

                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {ToEmail} via Brevo API", toEmail);
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Brevo API error: {StatusCode} - {Error}", response.StatusCode, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
            }
        }
    }
}
