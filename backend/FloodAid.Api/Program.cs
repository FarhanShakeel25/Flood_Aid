using FloodAid.Api.Models;
using Stripe;

var builder = WebApplication.CreateBuilder(args);

// Configure Stripe (require configuration or environment variable; no hardcoded fallback)
var stripeSecretKey = builder.Configuration["Stripe:SecretKey"];
if (string.IsNullOrWhiteSpace(stripeSecretKey))
{
    throw new InvalidOperationException(
        "Stripe secret key is not configured. Set 'Stripe:SecretKey' in configuration or environment variables.");
}
StripeConfiguration.ApiKey = stripeSecretKey;

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", x =>
        x.AllowAnyOrigin()
         .AllowAnyHeader()
         .AllowAnyMethod());
});

// Add services
builder.Services.AddOpenApi();
builder.Services.AddControllers();

var app = builder.Build();

// Apply CORS
app.UseCors("AllowAll");

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Map controllers
app.MapControllers();


// Keep dummy endpoint if needed for testing
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





