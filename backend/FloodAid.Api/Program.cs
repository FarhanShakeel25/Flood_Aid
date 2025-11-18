var builder = WebApplication.CreateBuilder(args);

// Add CORS policy before builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", x =>
        x.AllowAnyOrigin()
         .AllowAnyHeader()
         .AllowAnyMethod());
});

// Add services to the container.
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply CORS after builder.Build(), before endpoints
app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

// Existing weatherforecast endpoint
app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

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

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
