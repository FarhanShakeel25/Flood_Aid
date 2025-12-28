using FloodAid.Api.Models;
using FloodAid.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

namespace FloodAid.Api
{
    static class Program
    {
        static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add CORS policy before builder.Build()
            var frontendUrl = builder.Configuration["Frontend:Url"] ?? "https://flood-aid-94zg.vercel.app";
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", x =>
                    x.WithOrigins(frontendUrl)
                     .AllowAnyHeader()
                     .AllowAnyMethod()
                     .AllowCredentials());
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
            });

            builder.Services.AddAuthorization();

            // Cache: use Redis if enabled, otherwise memory cache
            var useRedis = builder.Configuration.GetValue<bool>("Cache:UseRedis");
            if (useRedis)
            {
                builder.Services.AddStackExchangeRedisCache(options =>
                {
                    options.Configuration = builder.Configuration["Cache:Redis:ConnectionString"];
                    options.InstanceName = "FloodAid:";
                });
            }
            else
            {
                builder.Services.AddDistributedMemoryCache();
            }

            // Rate limiting for auth endpoints
            var authRateLimitSection = builder.Configuration.GetSection("RateLimiting:Auth");
            var authPermitLimit = authRateLimitSection.GetValue<int?>("PermitLimit") ?? 5;
            var authWindowMinutes = authRateLimitSection.GetValue<int?>("WindowMinutes") ?? 1;
            var authQueueLimit = authRateLimitSection.GetValue<int?>("QueueLimit") ?? 0;

            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = 429;
                options.AddPolicy("auth", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = authPermitLimit,
                            Window = TimeSpan.FromMinutes(authWindowMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = authQueueLimit
                        }));

                // Rate limiting for donation endpoints (public)
                var donationSection = builder.Configuration.GetSection("RateLimiting:Donation");
                var donationPermitLimit = donationSection.GetValue<int?>("PermitLimit") ?? 10;
                var donationWindowMinutes = donationSection.GetValue<int?>("WindowMinutes") ?? 1;
                var donationQueueLimit = donationSection.GetValue<int?>("QueueLimit") ?? 0;

                options.AddPolicy("donation", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = donationPermitLimit,
                            Window = TimeSpan.FromMinutes(donationWindowMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = donationQueueLimit
                        }));
            });

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
            app.UseCors("AllowFrontend");

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

            app.UseRateLimiter();
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

            app.Run();
        }
    }
}





