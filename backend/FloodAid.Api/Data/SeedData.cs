using FloodAid.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FloodAid.Api.Data
{
    /// <summary>
    /// Extension class for seeding initial data into the database.
    /// </summary>
    public static class SeedData
    {
        /// <summary>
        /// Applies any pending migrations and seeds initial admin user data.
        /// Should be called during application startup.
        /// </summary>
        public static async Task InitializeDatabaseAsync(this WebApplication app, IConfiguration configuration)
        {
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<FloodAidContext>();
                
                // Apply any pending migrations
                await context.Database.MigrateAsync();
                
                // Seed initial admin if database is empty
                await SeedInitialAdminAsync(context, configuration);
            }
        }

        /// <summary>
        /// Seeds the initial admin user from appsettings.json if no admins exist.
        /// </summary>
        private static async Task SeedInitialAdminAsync(FloodAidContext context, IConfiguration configuration)
        {
            // Check if admins already exist
            if (await context.Admins.AnyAsync())
            {
                return; // Database already seeded
            }

            var adminConfig = configuration.GetSection("AdminCredentials");
            
            // Validate that admin credentials are configured
            if (!adminConfig.Exists() || 
                string.IsNullOrEmpty(adminConfig["Email"]) ||
                string.IsNullOrEmpty(adminConfig["Username"]) ||
                string.IsNullOrEmpty(adminConfig["PasswordHash"]) ||
                string.IsNullOrEmpty(adminConfig["Name"]))
            {
                throw new InvalidOperationException(
                    "AdminCredentials must be configured in appsettings.json with Email, Username, PasswordHash, and Name properties.");
            }

            // Create the initial admin user
            var initialAdmin = new AdminUser
            {
                Email = adminConfig["Email"]!,
                Username = adminConfig["Username"]!,
                PasswordHash = adminConfig["PasswordHash"]!,
                Name = adminConfig["Name"]!,
                Role = "Administrator",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = null
            };

            context.Admins.Add(initialAdmin);
            await context.SaveChangesAsync();
        }
    }
}
