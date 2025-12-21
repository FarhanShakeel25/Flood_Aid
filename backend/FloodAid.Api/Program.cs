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

            // Add services to the container.
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Add Email Service
            builder.Services.AddScoped<IEmailService, EmailService>();

            // Add CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend",
                    policy =>
                    {
                        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                              .AllowAnyHeader()
                              .AllowAnyMethod()
                              .AllowCredentials();
                    });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
                // Skip HTTPS redirect in development
            }
            else
            {
                // Use HTTPS redirect in production
                app.UseHttpsRedirection();
            }
            app.UseCors("AllowFrontend");

            app.UseAuthorization();

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
            app.Run();
        }
    }
}





