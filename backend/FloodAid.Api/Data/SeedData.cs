using FloodAid.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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
                var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
                var logger = loggerFactory.CreateLogger("SeedData");

                // Apply any pending migrations
                await context.Database.MigrateAsync();

                // Seed provinces and cities from CSV
                await SeedProvincesAndCitiesAsync(context, logger);

                // Seed initial admin if database is empty
                await SeedInitialAdminAsync(context, configuration);
            }
        }

        /// <summary>
        /// Seeds provinces and cities from pak_cities.csv
        /// </summary>
        public static async Task SeedProvincesAndCitiesAsync(FloodAidContext context, ILogger logger)
        {
            // Check if already seeded
            if (await context.Provinces.AnyAsync())
            {
                logger.LogInformation("Provinces already seeded, skipping");
                return;
            }

            // Try to use coordinated CSV first, fall back to basic CSV
            var coordCsvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "pak_cities_with_coords.csv");
            var basicCsvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "pak_cities.csv");
            
            string csvPath;
            bool hasCoordinates = false;
            
            if (File.Exists(coordCsvPath))
            {
                csvPath = coordCsvPath;
                hasCoordinates = true;
                logger.LogInformation("Using coordinated city data from {Path}", coordCsvPath);
            }
            else if (File.Exists(basicCsvPath))
            {
                csvPath = basicCsvPath;
                logger.LogWarning("pak_cities_with_coords.csv not found, using basic CSV without coordinates");
            }
            else
            {
                logger.LogWarning("No city CSV file found, skipping province/city seed");
                return;
            }

            var provinceDict = new Dictionary<string, Province>();
            var lines = await File.ReadAllLinesAsync(csvPath);

            // Skip header
            foreach (var line in lines.Skip(1))
            {
                var parts = line.Split(',');
                if (parts.Length < 2) continue;

                var cityName = parts[0].Trim();
                var provinceName = parts[1].Trim();
                
                double? latitude = null;
                double? longitude = null;
                
                // Parse coordinates if available
                if (hasCoordinates && parts.Length >= 4)
                {
                    if (double.TryParse(parts[2].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var lat))
                        latitude = lat;
                    if (double.TryParse(parts[3].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var lon))
                        longitude = lon;
                }

                // Get or create province
                if (!provinceDict.TryGetValue(provinceName, out var province))
                {
                    province = new Province { Name = provinceName };
                    provinceDict[provinceName] = province;
                    context.Provinces.Add(province);
                }

                // Add city with coordinates
                province.Cities.Add(new City 
                { 
                    Name = cityName, 
                    Province = province,
                    Latitude = latitude,
                    Longitude = longitude
                });
            }

            await context.SaveChangesAsync();
            
            var totalCities = provinceDict.Sum(p => p.Value.Cities.Count);
            var citiesWithCoords = provinceDict.Sum(p => p.Value.Cities.Count(c => c.Latitude.HasValue && c.Longitude.HasValue));
            
            logger.LogInformation("Seeded {ProvinceCount} provinces and {CityCount} cities ({CoordsCount} with coordinates)",
                provinceDict.Count, totalCities, citiesWithCoords);
        }

        /// <summary>
        /// Seeds or refreshes the initial admin user from appsettings.json.
        /// If an admin with the configured email already exists, it is updated to match config values.
        /// </summary>
        private static async Task SeedInitialAdminAsync(FloodAidContext context, IConfiguration configuration)
        {
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

            var email = adminConfig["Email"]!;
            var existingAdmin = await context.Admins.FirstOrDefaultAsync(a => a.Email == email);

            if (existingAdmin == null)
            {
                // Create the initial admin user
                var initialAdmin = new AdminUser
                {
                    Email = email,
                    Username = adminConfig["Username"]!,
                    PasswordHash = adminConfig["PasswordHash"]!,
                    Name = adminConfig["Name"]!,
                    Role = "SuperAdmin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = null
                };

                context.Admins.Add(initialAdmin);
            }
            else
            {
                // Keep the record in sync with appsettings
                existingAdmin.Username = adminConfig["Username"]!;
                existingAdmin.PasswordHash = adminConfig["PasswordHash"]!;
                existingAdmin.Name = adminConfig["Name"]!;
                existingAdmin.Role = "SuperAdmin";
                existingAdmin.IsActive = true;
            }

            await context.SaveChangesAsync();
        }
    }
}
