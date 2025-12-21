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

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendDonationConfirmationAsync(string toEmail, string donorName, decimal amount, string receiptId)
        {
            var smtpHost = _configuration["Email:SmtpHost"];
            
            // If SmtpHost is empty, log to console (development mode)
            if (string.IsNullOrWhiteSpace(smtpHost))
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

            // Production: Send actual email via SMTP
            try
            {
                using var client = new System.Net.Mail.SmtpClient(smtpHost)
                {
                    Port = int.Parse(_configuration["Email:SmtpPort"] ?? "587"),
                    Credentials = new System.Net.NetworkCredential(
                        _configuration["Email:SmtpUser"],
                        _configuration["Email:SmtpPassword"]
                    ),
                    EnableSsl = true,
                    Timeout = 5000, // Fail fast to avoid blocking donation flow
                };

                var mailMessage = new System.Net.Mail.MailMessage
                {
                    From = new System.Net.Mail.MailAddress(
                        _configuration["Email:FromEmail"] ?? "noreply@floodaid.com",
                        _configuration["Email:FromName"] ?? "Flood Aid"
                    ),
                    Subject = "Thank you for your donation - Flood Aid",
                    Body = $@"
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
                    ",
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
            }
        }
    }
}
