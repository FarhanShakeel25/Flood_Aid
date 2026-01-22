using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

// Script to geocode all cities in pak_cities.csv
// Run with: dotnet script geocode_cities.csx

var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("User-Agent", "FloodAid/1.0 (support@floodaid.local)");

var inputFile = "Data/pak_cities.csv";
var outputFile = "Data/pak_cities_with_coords.csv";

Console.WriteLine($"Reading cities from {inputFile}...");
var lines = File.ReadAllLines(inputFile).Skip(1).ToList(); // Skip header

var results = new List<(string city, string province, double? lat, double? lon)>();
var total = lines.Count;
var processed = 0;

Console.WriteLine($"Geocoding {total} cities...\n");

foreach (var line in lines)
{
    var parts = line.Split(',');
    if (parts.Length < 2) continue;
    
    var city = parts[0].Trim();
    var province = parts[1].Trim();
    
    processed++;
    Console.Write($"[{processed}/{total}] {city}, {province}... ");
    
    try
    {
        // Geocode city
        var query = $"{city}, {province}, Pakistan";
        var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query)}&format=json&limit=1";
        
        var response = await httpClient.GetAsync(url);
        var json = await response.Content.ReadAsStringAsync();
        
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        
        if (root.GetArrayLength() > 0)
        {
            var first = root[0];
            var lat = first.GetProperty("lat").GetString();
            var lon = first.GetProperty("lon").GetString();
            
            if (double.TryParse(lat, out var latVal) && double.TryParse(lon, out var lonVal))
            {
                results.Add((city, province, latVal, lonVal));
                Console.WriteLine($"✓ ({latVal:F4}, {lonVal:F4})");
            }
            else
            {
                results.Add((city, province, null, null));
                Console.WriteLine("✗ Invalid coordinates");
            }
        }
        else
        {
            results.Add((city, province, null, null));
            Console.WriteLine("✗ Not found");
        }
        
        // Rate limiting: Nominatim allows 1 request per second
        await Task.Delay(1100);
    }
    catch (Exception ex)
    {
        results.Add((city, province, null, null));
        Console.WriteLine($"✗ Error: {ex.Message}");
        await Task.Delay(2000); // Extra delay on error
    }
}

Console.WriteLine($"\n\nWriting results to {outputFile}...");
using (var writer = new StreamWriter(outputFile))
{
    writer.WriteLine("city,province,latitude,longitude");
    foreach (var (city, province, lat, lon) in results)
    {
        var latStr = lat.HasValue ? lat.Value.ToString("F6") : "";
        var lonStr = lon.HasValue ? lon.Value.ToString("F6") : "";
        writer.WriteLine($"{city},{province},{latStr},{lonStr}");
    }
}

var geocoded = results.Count(r => r.lat.HasValue);
Console.WriteLine($"\n✅ Complete! Geocoded {geocoded}/{total} cities");
Console.WriteLine($"Results saved to: {outputFile}");
