using System.Net;
using System.Net.Mail;

namespace FloodAid.Api.Services
{
    public interface IEmailService
    {
        Task SendDonationConfirmationAsync(string email, string? donorName, decimal amount, string donationType, string receiptId);
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

        public async Task SendDonationConfirmationAsync(string email, string? donorName, decimal amount, string donationType, string receiptId)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("Email:Smtp");
                var smtpHost = smtpSettings["Host"];

                // Development mode: Log email to console instead of sending
                if (string.IsNullOrWhiteSpace(smtpHost))
                {
                    var emailBody = BuildEmailBody(donorName, amount, donationType, receiptId);
                    _logger.LogInformation("========== EMAIL SENT (Development Mode) ==========");
                    _logger.LogInformation($"To: {email}");
                    _logger.LogInformation($"Subject: Flood Aid Donation Confirmation");
                    _logger.LogInformation($"Body Preview: {emailBody.Substring(0, Math.Min(200, emailBody.Length))}...");
                    _logger.LogInformation("================================================");
                    await Task.Delay(100);
                    return;
                }

                // Production: Send via SMTP
                var smtpPort = int.Parse(smtpSettings["Port"] ?? "587");
                var smtpUsername = smtpSettings["Username"];
                var smtpPassword = smtpSettings["Password"];
                var senderEmail = smtpSettings["SenderEmail"] ?? "noreply@floodaid.com";

                using (var smtpClient = new SmtpClient(smtpHost, smtpPort))
                {
                    smtpClient.EnableSsl = true;
                    smtpClient.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
                    smtpClient.Timeout = 10000;

                    var subject = "Flood Aid Donation Confirmation";
                    var body = BuildEmailBody(donorName, amount, donationType, receiptId);

                    using (var mailMessage = new MailMessage(senderEmail, email))
                    {
                        mailMessage.Subject = subject;
                        mailMessage.Body = body;
                        mailMessage.IsBodyHtml = true;

                        await smtpClient.SendMailAsync(mailMessage);
                        _logger.LogInformation($"Confirmation email sent to {email} for donation {receiptId}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending confirmation email to {email}: {ex.Message}");
                // Don't throw; email failure shouldn't break donation flow
            }
        }

        private string BuildEmailBody(string? donorName, decimal amount, string donationType, string receiptId)
        {
            var displayName = string.IsNullOrWhiteSpace(donorName) ? "Valued Donor" : donorName;
            
            return $@"
                <html>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <div style='max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;'>
                        <h2 style='color: #2c3e50; margin-top: 0;'>Thank You for Your Donation!</h2>
                        
                        <p>Dear {displayName},</p>
                        
                        <p>We deeply appreciate your generous contribution to the Flood Aid Relief effort. Your donation will make a direct impact on affected communities.</p>
                        
                        <div style='background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #27ae60;'>
                            <h3 style='margin-top: 0; color: #27ae60;'>Donation Details</h3>
                            <p><strong>Receipt ID:</strong> {receiptId}</p>
                            <p><strong>Donation Type:</strong> {(donationType == "Cash" ? "Monetary Donation" : "Supplies Donation")}</p>
                            <p><strong>Amount:</strong> PKR {amount:N0}</p>
                            <p><strong>Date:</strong> {DateTime.UtcNow:MMMM dd, yyyy}</p>
                        </div>
                        
                        <p>Your donation is eligible for tax deductions under Section 80G. Please keep this receipt for your records.</p>
                        
                        <h3>Impact of Your Donation</h3>
                        <ul>
                            <li>PKR 500 feeds a family for 3 days</li>
                            <li>PKR 1,000 provides emergency medical supplies</li>
                            <li>PKR 5,000 supports temporary shelter</li>
                        </ul>
                        
                        <p>If you have any questions, please contact us at <strong>support@floodaid.com</strong></p>
                        
                        <hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;' />
                        
                        <p style='font-size: 12px; color: #666; text-align: center;'>
                            Flood Aid Relief Foundation<br/>
                            © 2025 All rights reserved.
                        </p>
                    </div>
                </body>
                </html>
            ";
        }
    }
}
