using FloodAid.Api.Models;
using FloodAid.Api.Services;
using System.Text.Json.Serialization;

namespace FloodAid.Api
{
    static class Program
    {
        static void Main(string[] args)
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





