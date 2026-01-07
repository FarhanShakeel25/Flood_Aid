using FloodAid.Api.Models;
using FloodAid.Api.Services;
using FloodAid.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Npgsql;

namespace FloodAid.Api
{
    static class Program
    {
        static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add CORS policy before builder.Build()
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", x =>
                    x.AllowAnyOrigin()
                     .AllowAnyHeader()
                     .AllowAnyMethod());
            });

            // Configure JWT Authentication as per SRS Section 3.3.2
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
                    ClockSkew = TimeSpan.Zero
                };
                // Handle authentication challenge and forbidden responses with JSON
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        return context.Response.WriteAsJsonAsync(new { message = "Unauthorized: Missing or invalid token" });
                    },
                    OnForbidden = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        return context.Response.WriteAsJsonAsync(new { message = "Forbidden: Insufficient permissions" });
                    }
                };
            });

            builder.Services.AddAuthorization();

            // Register Database Context
            builder.Services.AddDbContext<FloodAidContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Add controllers
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });

            // Register HttpClientFactory for EmailService
            builder.Services.AddHttpClient();

            // Register EmailService
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Add services to the container.
            builder.Services.AddOpenApi();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Apply CORS after builder.Build(), before endpoints
            app.UseCors("AllowAll");

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Disable HTTPS redirect in development
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            // Add Authentication & Authorization middleware
            app.UseAuthentication();
            app.UseAuthorization();

            // Map controllers
            app.MapControllers();


            List<Donation> Donations = new();
            var donation1 = new Donation(Enums.DonationType.Cash, "PK7666tgww")
            {
                DonationAmount = 2000,
                DonorName = "Ali"
            };
            Donations.Add(donation1);

            app.MapGet("/api/donations",() =>
            {
                return Donations;
            });


            // Dummy endpoint for frontend testing
            app.MapGet("/api/dummy", () =>
            {
                var donors = new[]
                {
                    new { id = 1, name = "Ali", bloodGroup = "A+", city = "Lahore" },
                    new { id = 2, name = "Sara", bloodGroup = "B+", city = "Karachi" },
                    new { id = 3, name = "Omar", bloodGroup = "O-", city = "Islamabad" }
                };

                return donors;
            });


            // Health check endpoint for Render monitoring
            app.MapGet("/health", () => new { status = "ok", timestamp = DateTime.UtcNow })
                .WithName("HealthCheck")
                .WithOpenApi();

            // Initialize database, seed provinces/cities, and admin (safe for existing DB)
            await app.InitializeDatabaseAsync(app.Configuration);

            app.Run();
        }

        static async Task InitializeDatabaseAsync(this WebApplication app, IConfiguration configuration)
        {
            using var scope = app.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<FloodAidContext>();
            var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("DatabaseInit");
            
            // Run migrations, but skip if schema already exists to avoid baseline conflicts
            try
            {
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied");
            }
            catch (Exception ex)
            {
                var pgEx = ex as PostgresException ?? ex.InnerException as PostgresException;
                if (pgEx != null && pgEx.SqlState == "42P07") // relation already exists
                {
                    logger.LogWarning("Existing schema detected; skipping initial baseline migration.");
                }
                else
                {
                    throw;
                }
            }
            
            // Seed provinces and cities from CSV
            await SeedData.SeedProvincesAndCitiesAsync(context, loggerFactory.CreateLogger("DatabaseInit"));
            
            // Create or update admin from configuration (no deletion; safe updates only)
            var adminConfig = configuration.GetSection("AdminCredentials");
            if (adminConfig.Exists() &&
                !string.IsNullOrWhiteSpace(adminConfig["Email"]) &&
                !string.IsNullOrWhiteSpace(adminConfig["Username"]) &&
                !string.IsNullOrWhiteSpace(adminConfig["PasswordHash"]) &&
                !string.IsNullOrWhiteSpace(adminConfig["Name"]))
            {
                var email = adminConfig["Email"]!;
                var existingAdmin = await context.Admins.FirstOrDefaultAsync(a => a.Email == email);

                if (existingAdmin == null)
                {
                    var newAdmin = new AdminUser
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
                    context.Admins.Add(newAdmin);
                }
                else
                {
                    existingAdmin.Username = adminConfig["Username"]!;
                    existingAdmin.PasswordHash = adminConfig["PasswordHash"]!;
                    existingAdmin.Name = adminConfig["Name"]!;
                    existingAdmin.Role = "SuperAdmin";
                    existingAdmin.IsActive = true;
                }
                await context.SaveChangesAsync();
                logger.LogInformation("Admin user created/updated successfully");
            }
            else
            {
                logger.LogWarning("AdminCredentials not fully configured; skipping admin sync.");
            }
        }
    }
}





