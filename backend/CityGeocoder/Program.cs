using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace GeocodeHelper
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("User-Agent", "FloodAid/1.0 (support@floodaid.local)");

            var inputFile = "../FloodAid.Api/Data/pak_cities.csv";
            var outputFile = "../FloodAid.Api/Data/pak_cities_with_coords.csv";

            Console.WriteLine($"Reading cities from {inputFile}...");
            var lines = File.ReadAllLines(inputFile).Skip(1).ToList();

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
                    var query = $"{city}, {province}, Pakistan";
                    var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query)}&format=json&limit=1";
                    
                    var response = await httpClient.GetAsync(url);
                    response.EnsureSuccessStatusCode();
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
                    
                    await Task.Delay(1100);
                }
                catch (Exception ex)
                {
                    results.Add((city, province, null, null));
                    Console.WriteLine($"✗ Error: {ex.Message}");
                    
                    // If HTTP error, wait longer and save progress
                    if (ex is HttpRequestException)
                    {
                        Console.WriteLine($"HTTP error - saving progress and waiting 5 seconds...");
                        await SaveResults(outputFile, results);
                        await Task.Delay(5000);
                    }
                    else
                    {
                        await Task.Delay(2000);
                    }
                }
            }

            static async Task SaveResults(string outputFile, List<(string city, string province, double? lat, double? lon)> results)
            {
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
            }

            Console.WriteLine($"\n\nWriting results to {outputFile}...");
            await SaveResults(outputFile, results);

            var geocoded = results.Count(r => r.lat.HasValue);
            Console.WriteLine($"\n✅ Complete! Geocoded {geocoded}/{total} cities");
            Console.WriteLine($"Results saved to: {outputFile}");
        }

        static async Task SaveResults(string outputFile, List<(string city, string province, double? lat, double? lon)> results)
        {
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
        }
    }
}
