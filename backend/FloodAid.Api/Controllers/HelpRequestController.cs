using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FloodAid.Api.Data;
using FloodAid.Api.Models;
using FloodAid.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using System.Security.Claims;
using System.Text.Json;

namespace FloodAid.Api.Controllers
{
    [ApiController]
    [Route("api/helpRequest")]
    [EnableCors("AllowAll")]
    public class HelpRequestController : ControllerBase
    {
        private readonly FloodAidContext _context;
        private readonly ILogger<HelpRequestController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public HelpRequestController(FloodAidContext context, ILogger<HelpRequestController> logger, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Submit a new help request (Victim Module)
        /// </summary>
        [HttpPost]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<HelpRequest>> CreateHelpRequest([FromBody] CreateHelpRequestDto dto)
        {
            try
            {
                // Validate phone number
                if (string.IsNullOrWhiteSpace(dto.RequestorPhoneNumber))
                {
                    return BadRequest(new { message = "Phone number is required" });
                }

                // Validate coordinates
                if (dto.Latitude == 0 || dto.Longitude == 0)
                {
                    return BadRequest(new { message = "Location coordinates are required" });
                }

                // Validate request type
                if (!Enum.IsDefined(typeof(RequestType), dto.RequestType))
                {
                    return BadRequest(new { message = "Invalid request type" });
                }

                int? provinceId = dto.ProvinceId;
                int? cityId = dto.CityId;
                
                if (!provinceId.HasValue || !cityId.HasValue)
                {
                    var geoResult = await ResolveProvinceAndCityAsync(dto.Latitude, dto.Longitude);
                    if (!provinceId.HasValue)
                        provinceId = geoResult.ProvinceId;
                    if (!cityId.HasValue)
                        cityId = geoResult.CityId;
                }

                // Enforce province requirement (critical for scoping)
                if (!provinceId.HasValue)
                {
                    _logger.LogWarning(
                        "Unable to resolve province from coordinates lat={Lat}, lon={Lon}. Rejecting request creation.",
                        dto.Latitude,
                        dto.Longitude
                    );
                    return BadRequest(new { message = "Unable to resolve province from coordinates" });
                }

                // City is optional but log a warning if missing
                if (!cityId.HasValue)
                {
                    _logger.LogWarning(
                        "City could not be resolved for coordinates lat={Lat}, lon={Lon}, but province {ProvinceId} was resolved. Request will be created with province-level scoping only.",
                        dto.Latitude,
                        dto.Longitude,
                        provinceId
                    );
                }

                var helpRequest = new HelpRequest
                {
                    RequestorName = dto.RequestorName ?? "Anonymous",
                    RequestorPhoneNumber = dto.RequestorPhoneNumber,
                    RequestorEmail = dto.RequestorEmail,
                    RequestType = (RequestType)dto.RequestType,
                    Status = RequestStatus.Pending,
                    RequestDescription = dto.RequestDescription,
                    Latitude = dto.Latitude,
                    Longitude = dto.Longitude,
                    ProvinceId = provinceId,
                    CityId = cityId,
                    Priority = dto.Priority.HasValue && Enum.IsDefined(typeof(Priority), dto.Priority.Value) 
                        ? (Priority)dto.Priority.Value 
                        : Priority.Medium,
                    DueDate = CalculateDueDate((Priority)(dto.Priority ?? (int)Priority.Medium)),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.HelpRequests.Add(helpRequest);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ New help request created: ID={helpRequest.Id}, Phone={helpRequest.RequestorPhoneNumber}, Type={helpRequest.RequestType}");

                return CreatedAtAction(nameof(GetHelpRequest), new { id = helpRequest.Id }, helpRequest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating help request");
                return StatusCode(500, new { message = "Error creating help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Resolve both province and city from latitude/longitude via Nominatim reverse geocoding.
        /// Returns both ProvinceId and CityId for proper volunteer scoping.
        /// </summary>
        private async Task<(int? ProvinceId, int? CityId)> ResolveProvinceAndCityAsync(double latitude, double longitude)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("User-Agent", "FloodAid/1.0 (support@floodaid.local)");

                var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}&zoom=10&addressdetails=1";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Reverse geocode failed with status {Status}", response.StatusCode);
                    return (null, null);
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("address", out var address))
                {
                    return (null, null);
                }

                // Extract state/province with multiple fallbacks because OSM varies keys
                string? state = null;
                if (address.TryGetProperty("state", out var stateProp))
                {
                    state = stateProp.GetString();
                }
                else if (address.TryGetProperty("region", out var regionProp))
                {
                    state = regionProp.GetString();
                }
                else if (address.TryGetProperty("state_district", out var stateDistrictProp))
                {
                    state = stateDistrictProp.GetString();
                }
                else if (address.TryGetProperty("county", out var countyProp))
                {
                    state = countyProp.GetString();
                }

                if (string.IsNullOrWhiteSpace(state))
                {
                    _logger.LogWarning("Reverse geocode missing province. Address payload: {Address}", address.ToString());
                    return (null, null);
                }

                // Normalize province name
                state = state.Trim();
                var normalized = state.ToLowerInvariant();
                string canonical = normalized switch
                {
                    var s when s.Contains("punjab") => "Punjab",
                    var s when s.Contains("sindh") => "Sindh",
                    var s when s.Contains("khyber") || s.Contains("kpk") || s.Contains("pakhtunkhwa") => "Khyber Pakhtunkhwa",
                    var s when s.Contains("baloch") => "Balochistan",
                    var s when s.Contains("gilgit") => "Gilgit-Baltistan",
                    var s when s.Contains("kashmir") || s.Contains("azad") => "Azad Kashmir",
                    var s when s.Contains("islamabad") => "Islamabad Capital Territory",
                    _ => state
                };

                var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Name.ToLower() == canonical.ToLower());
                int? provinceId = province?.Id;

                // Extract city/town
                string? city = null;
                if (address.TryGetProperty("city", out var cityProp))
                {
                    city = cityProp.GetString();
                }
                else if (address.TryGetProperty("town", out var townProp))
                {
                    city = townProp.GetString();
                }
                else if (address.TryGetProperty("village", out var villageProp))
                {
                    city = villageProp.GetString();
                }

                int? cityId = null;
                if (!string.IsNullOrWhiteSpace(city) && provinceId.HasValue)
                {
                    // Strategy 1: Try normalized name matching first
                    var normalizedGeoCity = NormalizeCityName(city);
                    var provinceCities = await _context.Cities
                        .Where(c => c.ProvinceId == provinceId.Value)
                        .ToListAsync();

                    var matchedCity = provinceCities
                        .FirstOrDefault(c => NormalizeCityName(c.Name)
                            .Equals(normalizedGeoCity, StringComparison.OrdinalIgnoreCase));

                    if (matchedCity != null)
                    {
                        cityId = matchedCity.Id;
                        _logger.LogInformation(
                            "City resolved by name match: geocoded='{GeoCity}' → '{MatchedCity}' (Id={CityId})",
                            city, matchedCity.Name, matchedCity.Id
                        );
                    }
                    else
                    {
                        // Strategy 2: Find nearest city with coordinates within 50km
                        var citiesWithCoords = provinceCities
                            .Where(c => c.Latitude.HasValue && c.Longitude.HasValue)
                            .ToList();

                        if (citiesWithCoords.Any())
                        {
                            var nearestCity = citiesWithCoords
                                .Select(c => new
                                {
                                    City = c,
                                    Distance = CalculateDistance(latitude, longitude, c.Latitude!.Value, c.Longitude!.Value)
                                })
                                .OrderBy(x => x.Distance)
                                .FirstOrDefault();

                            if (nearestCity != null && nearestCity.Distance <= 50)
                            {
                                cityId = nearestCity.City.Id;
                                _logger.LogInformation(
                                    "City resolved by distance: geocoded='{GeoCity}' → nearest '{NearestCity}' at {Distance:F1}km (Id={CityId})",
                                    city, nearestCity.City.Name, nearestCity.Distance, nearestCity.City.Id
                                );
                            }
                            else
                            {
                                _logger.LogWarning(
                                    "No city found within 50km. Nearest was '{NearestCity}' at {Distance:F1}km. Proceeding with province-only.",
                                    nearestCity?.City.Name, nearestCity?.Distance
                                );
                            }
                        }
                        else
                        {
                            _logger.LogWarning(
                                "No cities in province {Province} have coordinates for distance matching. Proceeding with province-only.",
                                province?.Name
                            );
                        }
                    }
                }

                _logger.LogInformation($"Geocoded lat {latitude}, lon {longitude} => Province: {canonical} ({provinceId}), City: {city} ({cityId})");
                return (provinceId, cityId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Reverse geocode failed for lat {Lat}, lon {Lon}", latitude, longitude);
                return (null, null);
            }
        }

        /// <summary>
        /// Normalize city names: trim, lowercase, and remove common suffixes
        /// like 'Tehsil', 'District', 'Division'.
        /// </summary>
        private static string NormalizeCityName(string name)
        {
            var n = (name ?? string.Empty).Trim();
            // Replace non-breaking space with regular space
            n = n.Replace('\u00A0', ' ').Trim();
            var lower = n.ToLowerInvariant();

            string[] suffixes = new[] { " tehsil", " district", " division" };
            foreach (var s in suffixes)
            {
                if (lower.EndsWith(s))
                {
                    lower = lower.Substring(0, lower.Length - s.Length).TrimEnd();
                    break;
                }
            }

            return lower;
        }

        /// <summary>
        /// Calculate distance between two points using Haversine formula.
        /// Returns distance in kilometers.
        /// </summary>
        private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371; // Earth's radius in kilometers
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private static double ToRadians(double degrees) => degrees * Math.PI / 180;

        /// <summary>
        /// Resolve province id from latitude/longitude via Nominatim reverse geocoding.
        /// </summary>
        private async Task<int?> ResolveProvinceIdAsync(double latitude, double longitude)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("User-Agent", "FloodAid/1.0 (support@floodaid.local)");

                var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}&zoom=5&addressdetails=1";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Reverse geocode failed with status {Status}", response.StatusCode);
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (!doc.RootElement.TryGetProperty("address", out var address))
                {
                    return null;
                }

                string? state = null;
                if (address.TryGetProperty("state", out var stateProp))
                {
                    state = stateProp.GetString();
                }
                else if (address.TryGetProperty("region", out var regionProp))
                {
                    state = regionProp.GetString();
                }

                if (string.IsNullOrWhiteSpace(state))
                {
                    return null;
                }

                // Normalize common province names/aliases
                state = state.Trim();
                var normalized = state.ToLowerInvariant();
                string canonical = normalized switch
                {
                    var s when s.Contains("punjab") => "Punjab",
                    var s when s.Contains("sindh") => "Sindh",
                    var s when s.Contains("khyber") || s.Contains("kpk") || s.Contains("pakhtunkhwa") => "Khyber Pakhtunkhwa",
                    var s when s.Contains("baloch") => "Balochistan",
                    var s when s.Contains("gilgit") => "Gilgit-Baltistan",
                    var s when s.Contains("kashmir") || s.Contains("azad") => "Azad Kashmir",
                    var s when s.Contains("islamabad") => "Islamabad Capital Territory",
                    _ => state
                };

                var province = await _context.Provinces.FirstOrDefaultAsync(p => p.Name.ToLower() == canonical.ToLower());
                return province?.Id;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Reverse geocode failed for lat {Lat}, lon {Lon}", latitude, longitude);
                return null;
            }
        }

        /// <summary>
        /// Calculate due date based on priority level
        /// Critical: 1 hour
        /// High: 4 hours
        /// Medium: 24 hours (1 day)
        /// Low: 7 days
        /// </summary>
        private DateTime CalculateDueDate(Priority priority)
        {
            var now = DateTime.UtcNow;
            return priority switch
            {
                Priority.Critical => now.AddHours(1),
                Priority.High => now.AddHours(4),
                Priority.Medium => now.AddHours(24),
                Priority.Low => now.AddDays(7),
                _ => now.AddHours(24) // Default to Medium (24 hours)
            };
        }

        /// <summary>
        /// Get all help requests (Admin Module) with pagination & filters
        /// Scope: SuperAdmin sees all, ProvinceAdmin sees their province only, Volunteer sees their city only
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,ProvinceAdmin")]
        public async Task<ActionResult<object>> GetAllHelpRequests(
            [FromQuery] int? requestType = null,
            [FromQuery] RequestStatus? status = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (requestType.HasValue && !Enum.IsDefined(typeof(RequestType), requestType.Value))
                {
                    return BadRequest(new { message = "Invalid request type" });
                }

                var safePage = Math.Max(1, page);
                var safePageSize = Math.Clamp(pageSize, 1, 100);

                DateTime? normalizedStart = null;
                DateTime? normalizedEnd = null;

                if (startDate.HasValue)
                {
                    normalizedStart = startDate.Value.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc)
                        : startDate.Value.ToUniversalTime();
                }

                if (endDate.HasValue)
                {
                    normalizedEnd = endDate.Value.Kind == DateTimeKind.Unspecified
                        ? DateTime.SpecifyKind(endDate.Value, DateTimeKind.Utc)
                        : endDate.Value.ToUniversalTime();
                }

                // Apply role-based scoping for admin users BEFORE building query
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                int? scopedProvinceId = null;
                string? adminRole = null;
                
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null)
                    {
                        adminRole = admin.Role;
                        if (admin.Role == "ProvinceAdmin")
                        {
                            scopedProvinceId = admin.ProvinceId;
                            _logger.LogInformation("ProvinceAdmin {Email} scoped to ProvinceId={ProvinceId}", adminEmail, scopedProvinceId);
                        }
                    }
                }

                var query = _context.HelpRequests.AsNoTracking().AsQueryable();

                // Apply province scope filter
                if (scopedProvinceId.HasValue)
                {
                    query = query.Where(h => h.ProvinceId == scopedProvinceId.Value);
                    _logger.LogInformation("Applied province filter: ProvinceId={ProvinceId}", scopedProvinceId.Value);
                }

                if (requestType.HasValue)
                {
                    query = query.Where(r => (int)r.RequestType == requestType.Value);
                }

                if (status.HasValue)
                {
                    query = query.Where(r => r.Status == status.Value);
                }

                if (normalizedStart.HasValue)
                {
                    query = query.Where(r => r.CreatedAt >= normalizedStart.Value);
                }

                if (normalizedEnd.HasValue)
                {
                    query = query.Where(r => r.CreatedAt <= normalizedEnd.Value);
                }

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var term = searchTerm.Trim().ToLower();
                    query = query.Where(r =>
                        (r.RequestorName != null && r.RequestorName.ToLower().Contains(term)) ||
                        (r.RequestorPhoneNumber != null && r.RequestorPhoneNumber.Contains(term)) ||
                        (r.RequestorEmail != null && r.RequestorEmail.ToLower().Contains(term))
                    );
                }

                var totalCount = await query.CountAsync();

                var requests = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((safePage - 1) * safePageSize)
                    .Take(safePageSize)
                    .ToListAsync();

                return Ok(new
                {
                    data = requests,
                    totalCount,
                    pageNumber = safePage,
                    pageSize = safePageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving help requests: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving help requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific help request by ID
        /// </summary>
        [HttpGet("{id}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<HelpRequest>> GetHelpRequest(int id)
        {
            try
            {
                var request = await _context.HelpRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                return Ok(request);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving help request {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Update help request status (Admin/Volunteer Module)
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "SuperAdmin,ProvinceAdmin")]
        public async Task<ActionResult<HelpRequest>> UpdateRequestStatus(int id, [FromBody] UpdateRequestStatusDto dto)
        {
            try
            {
                var request = await _context.HelpRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                // Apply scoping - ProvinceAdmin can only update requests in their province
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null && admin.Role == "ProvinceAdmin")
                    {
                        if (request.ProvinceId != admin.ProvinceId)
                        {
                            _logger.LogWarning("ProvinceAdmin {Email} attempted to update request {RequestId} outside their province", adminEmail, id);
                            return Forbid();
                        }
                    }
                }

                // Validate status
                if (!Enum.IsDefined(typeof(RequestStatus), dto.Status))
                {
                    return BadRequest(new { message = "Invalid request status" });
                }

                request.Status = (RequestStatus)dto.Status;
                request.UpdatedAt = DateTime.UtcNow;

                _context.HelpRequests.Update(request);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Help request {id} status updated to: {dto.Status}");

                return Ok(request);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error updating request {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error updating help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Get requests by type (Food, Medical, Rescue)
        /// </summary>
        [HttpGet("type/{requestType}")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<IEnumerable<HelpRequest>>> GetRequestsByType(int requestType)
        {
            try
            {
                if (!Enum.IsDefined(typeof(RequestType), requestType))
                {
                    return BadRequest(new { message = "Invalid request type" });
                }

                var requests = await _context.HelpRequests
                    .Where(r => r.RequestType == (RequestType)requestType)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving requests by type: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get pending requests (for volunteers) - Returns Pending and InProgress requests
        /// </summary>
        [HttpGet("status/pending")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<ActionResult<IEnumerable<HelpRequest>>> GetPendingRequests()
        {
            try
            {
                // Return requests that are Pending or InProgress (volunteers can see all available work)
                var requests = await _context.HelpRequests
                    .Where(r => r.Status == RequestStatus.Pending || r.Status == RequestStatus.InProgress)
                    .OrderByDescending(r => r.Priority)
                    .ThenByDescending(r => r.CreatedAt)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving pending requests: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving pending requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get aggregate counts for dashboard cards
        /// Scope: SuperAdmin sees all, ProvinceAdmin sees their province only
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "SuperAdmin,ProvinceAdmin")]
        public async Task<ActionResult<object>> GetHelpRequestStats()
        {
            try
            {
                var query = _context.HelpRequests.AsNoTracking();

                // Apply province scope for ProvinceAdmin
                var adminEmail = User.FindFirstValue(ClaimTypes.Email);
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == adminEmail);
                    if (admin != null && admin.Role == "ProvinceAdmin")
                    {
                        query = query.Where(h => h.ProvinceId == admin.ProvinceId);
                        _logger.LogInformation("Stats scoped to ProvinceId={ProvinceId} for {Email}", admin.ProvinceId, adminEmail);
                    }
                }

                var total = await query.CountAsync();
                var pending = await query.CountAsync(r => r.Status == RequestStatus.Pending);
                var inProgress = await query.CountAsync(r => r.Status == RequestStatus.InProgress);
                var fulfilled = await query.CountAsync(r => r.Status == RequestStatus.Fulfilled);
                var cancelled = await query.CountAsync(r => r.Status == RequestStatus.Cancelled);
                var onHold = await query.CountAsync(r => r.Status == RequestStatus.OnHold);

                return Ok(new
                {
                    total,
                    pending,
                    inProgress,
                    fulfilled,
                    cancelled,
                    onHold
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error retrieving help request stats: {ex.Message}");
                return StatusCode(500, new { message = "Error retrieving help request stats", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a help request (SuperAdmin any, ProvinceAdmin scoped to province, Volunteer scoped to city)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteHelpRequest(int id)
        {
            try
            {
                var request = await _context.HelpRequests.FindAsync(id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                var requesterEmail = User.FindFirstValue(ClaimTypes.Email);

                // Try admin identity first (SuperAdmin or ProvinceAdmin)
                AdminUser? admin = null;
                if (!string.IsNullOrWhiteSpace(requesterEmail))
                {
                    admin = await _context.Admins.FirstOrDefaultAsync(a => a.Email == requesterEmail);
                }

                if (admin != null)
                {
                    if (admin.Role == "ProvinceAdmin" && request.ProvinceId != admin.ProvinceId)
                    {
                        _logger.LogWarning("ProvinceAdmin {Email} attempted to delete request {RequestId} outside their province", requesterEmail, id);
                        return Forbid();
                    }
                }
                else
                {
                    // Fallback to volunteer scope (city-scoped user)
                    User? volunteer = null;
                    if (!string.IsNullOrWhiteSpace(requesterEmail))
                    {
                        volunteer = await _context.Users.FirstOrDefaultAsync(u => u.Email == requesterEmail);
                    }

                    var volunteerRole = (UserRole?)volunteer?.Role;
                    var isVolunteer = volunteerRole == UserRole.Volunteer || volunteerRole == UserRole.Both;

                    if (!isVolunteer)
                    {
                        _logger.LogWarning("Unauthorized delete attempt for request {RequestId} by {Email}", id, requesterEmail ?? "unknown");
                        return Forbid();
                    }

                    // City-scoped validation for volunteers
                    if (request.CityId.HasValue)
                    {
                        if (volunteer?.CityId != request.CityId)
                        {
                            _logger.LogWarning("Volunteer {Email} attempted to delete request {RequestId} outside their city", requesterEmail, id);
                            return Forbid();
                        }
                    }
                    else if (request.ProvinceId.HasValue)
                    {
                        if (volunteer?.ProvinceId != request.ProvinceId)
                        {
                            _logger.LogWarning("Volunteer {Email} attempted to delete request {RequestId} outside their province", requesterEmail, id);
                            return Forbid();
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Volunteer {Email} attempted to delete request {RequestId} with no scope information", requesterEmail, id);
                        return Forbid();
                    }
                }

                _context.HelpRequests.Remove(request);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Help request {RequestId} deleted by {Email}", id, requesterEmail ?? "unknown");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error deleting request {RequestId}: {Error}", id, ex.Message);
                return StatusCode(500, new { message = "Error deleting help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Assign a help request to a volunteer
        /// Admins can assign within their province; volunteers can self-assign within their city.
        /// Also sets request status to InProgress on assignment.
        /// </summary>
        [HttpPost("{id}/assign")]
        [Authorize]
        public async Task<ActionResult> AssignHelpRequest(int id, [FromBody] AssignHelpRequestDto dto)
        {
            try
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int? currentUserId = null;
                if (int.TryParse(userIdClaim, out var parsedId))
                {
                    currentUserId = parsedId;
                }

                _logger.LogInformation($"AssignHelpRequest called - Email: {userEmail}, Role: {userRole}, UserId: {currentUserId}, TargetVolunteerId: {dto.VolunteerId}, RequestId: {id}");

                // Allow volunteers to self-assign, but only admins can assign to others
                bool isSelfAssignment = userRole == "Volunteer" && currentUserId.HasValue && currentUserId.Value == dto.VolunteerId;
                bool isAdmin = userRole == "SuperAdmin" || userRole == "ProvinceAdmin";

                if (!isSelfAssignment && !isAdmin)
                {
                    return Forbid("Volunteers can only assign requests to themselves. Only admins can assign to others.");
                }

                var request = await _context.HelpRequests.FirstOrDefaultAsync(r => r.Id == id);
                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                // Verify volunteer exists
                var volunteer = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.VolunteerId);
                if (volunteer == null)
                {
                    return BadRequest(new { message = "Volunteer not found" });
                }

                // ProvinceAdmin scoping: only within their province and city
                if (userRole == "ProvinceAdmin")
                {
                    var provinceClaim = User.FindFirst("provinceId")?.Value; // claim name uses lower-case
                    var adminProvinceId = !string.IsNullOrEmpty(provinceClaim) ? int.Parse(provinceClaim) : 0;

                    if (adminProvinceId == 0)
                    {
                        _logger.LogWarning("ProvinceAdmin {Email} has no provinceId claim", userEmail);
                        return Forbid("Province scope missing in token");
                    }

                    // Verify request is in admin's province
                    if (request.ProvinceId != adminProvinceId)
                    {
                        return Forbid("ProvinceAdmins can only assign requests in their province");
                    }
                    
                    // Verify volunteer is in admin's province
                    if (volunteer.ProvinceId != adminProvinceId)
                    {
                        return BadRequest(new { message = "Volunteer is not in your province" });
                    }
                    
                    // Verify volunteer is in the SAME city as the request (critical fix)
                    if (request.CityId.HasValue && volunteer.CityId != request.CityId)
                    {
                        return BadRequest(new { message = "Volunteer must be from the same city as the request" });
                    }
                }
                else if (userRole == "Volunteer" && isSelfAssignment)
                {
                    // Verify volunteer is assigning request from their own city
                    if (request.CityId != volunteer.CityId)
                    {
                        return BadRequest(new { message = "You can only assign requests from your city" });
                    }
                }
                else if (userRole == "SuperAdmin")
                {
                    // SuperAdmin must assign volunteers from the SAME city as request
                    if (request.CityId.HasValue && volunteer.CityId != request.CityId)
                    {
                        return BadRequest(new { message = "Volunteer must be from the same city as the request" });
                    }
                }

                // Perform assignment and set request status to InProgress
                request.AssignedToVolunteerId = dto.VolunteerId;
                request.AssignmentStatus = AssignmentStatus.Assigned;
                request.Status = RequestStatus.InProgress;
                request.AssignedAt = DateTime.UtcNow;
                request.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Help request {RequestId} assigned to volunteer {VolunteerId} by {Email} (Role: {Role})", id, dto.VolunteerId, userEmail, userRole);

                return Ok(new { message = "Help request assigned successfully", assignmentStatus = "Assigned" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error assigning request {RequestId}: {Error}", id, ex.Message);
                return StatusCode(500, new { message = "Error assigning help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Unassign a help request from volunteer (Admins within scope or self-unassign by assigned volunteer)
        /// If unassigned and not fulfilled/cancelled, revert status to Pending.
        /// Supports optional proof/evidence via reason/evidenceUrl in DTO.
        /// </summary>
        [HttpPost("{id}/unassign")]
        [Authorize]
        public async Task<ActionResult> UnassignHelpRequest(int id, [FromBody] UnassignHelpRequestDto dto)
        {
            try
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id_parse) ? id_parse : 0;

                var request = await _context.HelpRequests.FirstOrDefaultAsync(r => r.Id == id);
                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                var isAdmin = userRole == "SuperAdmin" || userRole == "ProvinceAdmin";
                var isAssignedVolunteer = request.AssignedToVolunteerId == userId;
                if (!isAdmin && !isAssignedVolunteer)
                {
                    return Forbid("You cannot unassign this request");
                }

                // ProvinceAdmin scoping: only within their province
                if (userRole == "ProvinceAdmin")
                {
                    var provinceClaim = User.FindFirst("provinceId")?.Value;
                    var adminProvinceId = !string.IsNullOrEmpty(provinceClaim) ? int.Parse(provinceClaim) : 0;
                    if (adminProvinceId == 0 || request.ProvinceId != adminProvinceId)
                    {
                        return Forbid("ProvinceAdmins can only unassign requests in their province");
                    }
                }

                // Record audit for unassignment/withdraw
                var audit = new UnassignmentAudit
                {
                    HelpRequestId = id,
                    ActorUserId = isAssignedVolunteer ? userId : null,
                    ActorRole = userRole ?? string.Empty,
                    ActorEmail = userEmail ?? string.Empty,
                    Reason = dto.Reason,
                    EvidenceUrl = dto.EvidenceUrl,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UnassignmentAudits.Add(audit);

                // Perform unassignment
                request.AssignedToVolunteerId = null;
                request.AssignmentStatus = AssignmentStatus.Unassigned;
                request.AssignedAt = null;

                // If not fulfilled or cancelled, revert to Pending
                if (request.Status == RequestStatus.InProgress || request.Status == RequestStatus.Pending)
                {
                    request.Status = RequestStatus.Pending;
                }

                request.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Help request {RequestId} unassigned by {Email} (Reason: {Reason}, Evidence: {Evidence})", id, userEmail, dto.Reason ?? "None", dto.EvidenceUrl ?? "None");

                return Ok(new { message = "Help request unassigned successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error unassigning request {RequestId}: {Error}", id, ex.Message);
                return StatusCode(500, new { message = "Error unassigning help request", error = ex.Message });
            }
        }

        /// <summary>
        /// Update assignment status (InProgress, Completed, Cancelled by assigned volunteer)
        /// </summary>
        [HttpPut("{id}/assignment-status")]
        [Authorize]
        public async Task<ActionResult> UpdateAssignmentStatus(int id, [FromBody] UpdateAssignmentStatusDto dto)
        {
            try
            {
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                var userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id_parse) ? id_parse : 0;

                var request = await _context.HelpRequests
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (request == null)
                {
                    return NotFound(new { message = "Help request not found" });
                }

                // Only assigned volunteer can update status
                if (request.AssignedToVolunteerId != userId)
                {
                    return Forbid("Only the assigned volunteer can update status");
                }

                // Validate status transition
                if (!Enum.IsDefined(typeof(AssignmentStatus), dto.Status))
                {
                    return BadRequest(new { message = "Invalid assignment status" });
                }

                request.AssignmentStatus = (AssignmentStatus)dto.Status;
                request.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Help request {RequestId} status updated to {Status} by volunteer {Email}", id, request.AssignmentStatus, userEmail);

                return Ok(new { message = "Assignment status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError("❌ Error updating assignment status {RequestId}: {Error}", id, ex.Message);
                return StatusCode(500, new { message = "Error updating assignment status", error = ex.Message });
            }
        }
    }

    /// <summary>
    /// DTO for assigning a help request
    /// </summary>
    public class AssignHelpRequestDto
    {
        public required int VolunteerId { get; set; }
    }

    /// <summary>
    /// DTO for unassigning a help request
    /// </summary>
    public class UnassignHelpRequestDto
    {
        public string? Reason { get; set; }
        public string? EvidenceUrl { get; set; }
    }

    /// <summary>
    /// DTO for updating assignment status
    /// </summary>
    public class UpdateAssignmentStatusDto
    {
        public int Status { get; set; } // AssignmentStatus enum value
    }

    /// <summary>
    /// DTO for creating a help request
    /// </summary>
    public class CreateHelpRequestDto
    {
        public string? RequestorName { get; set; }
        public required string RequestorPhoneNumber { get; set; }
        public string? RequestorEmail { get; set; }
        public int RequestType { get; set; } // Matches RequestType enum: 0=MedicalSuppliesRequired, 1=FoodRequired, 2=EvacuationRequired, 3=ClothesRequired, 4=EmergencyCase
        public required string RequestDescription { get; set; }
        public required double Latitude { get; set; }
        public required double Longitude { get; set; }
        public int? ProvinceId { get; set; } // optional client-provided province
        public int? CityId { get; set; } // optional client-provided city
        public int? Priority { get; set; } // 0=Low, 1=Medium (default), 2=High, 3=Critical
    }

    /// <summary>
    /// DTO for updating request status
    /// </summary>
    public class UpdateRequestStatusDto
    {
        public int Status { get; set; } // 0=Pending, 1=Assigned, 2=Resolved
    }
}
