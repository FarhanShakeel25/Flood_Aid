namespace FloodAid.Api.Services
{
    public interface IEmailService
    {
        Task SendDonationConfirmationAsync(string toEmail, string donorName, decimal amount, string receiptId);
        Task SendInvitationEmailAsync(string toEmail, string token, string role, string? scopeInfo);
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

        public async Task SendInvitationEmailAsync(string toEmail, string token, string role, string? scopeInfo)
        {
            var brevoApiKey = _configuration["Email:BrevoApiKey"];
            var fromEmail = _configuration["Email:FromEmail"];
            var fromName = _configuration["Email:FromName"];
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            
            var acceptUrl = $"{frontendUrl}/accept-invitation?token={token}";
            
            _logger.LogInformation("Sending invitation email to {ToEmail} for role {Role}", toEmail, role);
            
            // If API key is empty, log to console (development mode)
            if (string.IsNullOrWhiteSpace(brevoApiKey))
            {
                _logger.LogInformation(
                    "=== INVITATION EMAIL (Console Mode) ===" +
                    "\nTo: {ToEmail}" +
                    "\nRole: {Role}" +
                    "\nScope: {Scope}" +
                    "\nAccept URL: {Url}" +
                    "\n=====================================",
                    toEmail, role, scopeInfo ?? "All regions", acceptUrl
                );
                return;
            }

            // Production: Send via Brevo API
            try
            {
                var emailPayload = new
                {
                    sender = new { name = fromName ?? "Flood Aid Admin", email = fromEmail ?? "noreply@floodaid.com" },
                    to = new[] { new { email = toEmail } },
                    subject = $"You're invited to join Flood Aid as {role}",
                    htmlContent = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                                <h2 style='color: #2563eb;'>Welcome to Flood Aid!</h2>
                                <p>You have been invited to join the Flood Aid platform as a <strong>{role}</strong>.</p>
                                {(!string.IsNullOrWhiteSpace(scopeInfo) ? $"<p><strong>Your assigned area:</strong> {scopeInfo}</p>" : "")}
                                <p>Click the button below to accept your invitation and complete your registration:</p>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <a href='{acceptUrl}' 
                                       style='background-color: #2563eb; color: white; padding: 12px 30px; 
                                              text-decoration: none; border-radius: 5px; display: inline-block;'>
                                        Accept Invitation
                                    </a>
                                </div>
                                <p style='color: #666; font-size: 14px;'>
                                    If the button doesn't work, copy and paste this link into your browser:<br/>
                                    <a href='{acceptUrl}'>{acceptUrl}</a>
                                </p>
                                <p style='color: #666; font-size: 14px;'>
                                    This invitation will expire in 7 days.
                                </p>
                                <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'/>
                                <p style='color: #999; font-size: 12px;'>
                                    If you didn't expect this invitation, please ignore this email.
                                </p>
                            </div>
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
                    _logger.LogInformation("Invitation email sent successfully to {ToEmail} via Brevo API", toEmail);
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Brevo API error: {StatusCode} - {Error}", response.StatusCode, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send invitation email to {ToEmail}", toEmail);
            }
        }    }
}