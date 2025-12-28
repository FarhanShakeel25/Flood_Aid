namespace FloodAid.Api.Services
{
    public interface IEmailService
    {
        Task SendDonationConfirmationAsync(string toEmail, string donorName, decimal amount, string receiptId);
        Task SendOtpEmailAsync(string toEmail, string userName, string otp, int expiryMinutes);
        Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken);
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

        public async Task SendOtpEmailAsync(string toEmail, string userName, string otp, int expiryMinutes)
        {
            var brevoApiKey = _configuration["Email:BrevoApiKey"];
            var fromEmail = _configuration["Email:FromEmail"];
            var fromName = _configuration["Email:FromName"];
            
            // If API key is empty, log to console (development mode)
            if (string.IsNullOrWhiteSpace(brevoApiKey))
            {
                _logger.LogInformation(
                    "=== OTP EMAIL (Console Mode) ===" +
                    "\nTo: {ToEmail}" +
                    "\nUser: {UserName}" +
                    "\nOTP: {Otp}" +
                    "\nExpiry: {ExpiryMinutes} minutes" +
                    "\n=====================================",
                    toEmail, userName, otp, expiryMinutes
                );
                return;
            }

            // Production: Send via Brevo API
            try
            {
                var emailPayload = new
                {
                    sender = new { name = fromName ?? "Flood Aid", email = fromEmail ?? "noreply@floodaid.com" },
                    to = new[] { new { email = toEmail, name = userName } },
                    subject = "Your Flood Aid Login OTP",
                    htmlContent = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <div style='background-color: #0066cc; padding: 20px; text-align: center;'>
                                <h1 style='color: white; margin: 0;'>Flood Aid</h1>
                            </div>
                            <div style='padding: 30px; background-color: #f9f9f9;'>
                                <h2 style='color: #333;'>Your Login OTP</h2>
                                <p>Hello {userName},</p>
                                <p>Your One-Time Password (OTP) for logging into Flood Aid admin panel is:</p>
                                <div style='background-color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; border: 2px solid #0066cc;'>
                                    <h1 style='color: #0066cc; font-size: 36px; margin: 0; letter-spacing: 8px;'>{otp}</h1>
                                </div>
                                <p><strong>This OTP will expire in {expiryMinutes} minutes.</strong></p>
                                <p>If you didn't request this OTP, please ignore this email or contact support immediately.</p>
                                <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
                                <p style='color: #666; font-size: 12px;'>
                                    This is an automated email. Please do not reply.<br/>
                                    © {DateTime.UtcNow.Year} Flood Aid. All rights reserved.
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
                    _logger.LogInformation("OTP email sent successfully to {ToEmail}", toEmail);
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Brevo API error sending OTP: {StatusCode} - {Error}", response.StatusCode, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email to {ToEmail}", toEmail);
            }
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetToken)
        {
            var brevoApiKey = _configuration["Email:BrevoApiKey"];
            var fromEmail = _configuration["Email:FromEmail"];
            var fromName = _configuration["Email:FromName"];
            var frontendUrl = _configuration["Frontend:Url"] ?? "https://floodaid.vercel.app";
            
            // If API key is empty, log to console (development mode)
            if (string.IsNullOrWhiteSpace(brevoApiKey))
            {
                _logger.LogInformation(
                    "=== PASSWORD RESET EMAIL (Console Mode) ===" +
                    "\nTo: {ToEmail}" +
                    "\nUser: {UserName}" +
                    "\nReset Token: {ResetToken}" +
                    "\nReset Link: {FrontendUrl}/admin/reset-password?token={ResetToken}" +
                    "\n=====================================",
                    toEmail, userName, resetToken, frontendUrl, resetToken
                );
                return;
            }

            // Production: Send via Brevo API
            try
            {
                var resetLink = $"{frontendUrl}/admin/reset-password?token={resetToken}";
                
                var emailPayload = new
                {
                    sender = new { name = fromName ?? "Flood Aid", email = fromEmail ?? "noreply@floodaid.com" },
                    to = new[] { new { email = toEmail, name = userName } },
                    subject = "Reset Your Flood Aid Password",
                    htmlContent = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                            <div style='background-color: #0066cc; padding: 20px; text-align: center;'>
                                <h1 style='color: white; margin: 0;'>Flood Aid</h1>
                            </div>
                            <div style='padding: 30px; background-color: #f9f9f9;'>
                                <h2 style='color: #333;'>Password Reset Request</h2>
                                <p>Hello {userName},</p>
                                <p>We received a request to reset your password for your Flood Aid admin account.</p>
                                <p>Click the button below to reset your password:</p>
                                <div style='text-align: center; margin: 30px 0;'>
                                    <a href='{resetLink}' style='background-color: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'>
                                        Reset Password
                                    </a>
                                </div>
                                <p>Or copy and paste this link into your browser:</p>
                                <p style='word-break: break-all; background-color: white; padding: 10px; border-radius: 5px;'>{resetLink}</p>
                                <p><strong>This link will expire in 1 hour.</strong></p>
                                <p>If you didn't request a password reset, please ignore this email or contact support immediately.</p>
                                <hr style='margin: 30px 0; border: none; border-top: 1px solid #ddd;'>
                                <p style='color: #666; font-size: 12px;'>
                                    This is an automated email. Please do not reply.<br/>
                                    © {DateTime.UtcNow.Year} Flood Aid. All rights reserved.
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
                    _logger.LogInformation("Password reset email sent successfully to {ToEmail}", toEmail);
                }
                else
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Brevo API error sending password reset: {StatusCode} - {Error}", response.StatusCode, errorBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {ToEmail}", toEmail);
            }
        }
    }
}
