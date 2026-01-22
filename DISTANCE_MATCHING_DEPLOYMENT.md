# Distance-Based City Matching - Deployment Guide

## Overview
This implementation adds proper distance-based city matching for help requests, ensuring volunteers are correctly matched to requests even when OSM returns city names that don't exactly match our database (e.g., "Gujranwala Tehsil" vs "Gujranwala").

## Changes Made

### 1. Schema Changes
- **File**: `backend/FloodAid.Api/Models/City.cs`
- **Change**: Added `Latitude` and `Longitude` (nullable double) properties to City model
- **Migration**: `AddCityCoordinates` migration created

### 2. Geocoding Tool
- **Location**: `backend/CityGeocoder/`
- **Purpose**: Standalone C# console app that geocodes all 278 Pakistan cities via Nominatim API
- **Output**: `pak_cities_with_coords.csv` with latitude,longitude columns
- **Rate Limiting**: 1.1 second delay between requests (respects Nominatim usage policy)

### 3. Seed Data Enhancement
- **File**: `backend/FloodAid.Api/Data/SeedData.cs`
- **Change**: Updated `SeedProvincesAndCitiesAsync()` to:
  - Prioritize `pak_cities_with_coords.csv` if available
  - Fall back to `pak_cities.csv` if coordinates not available
  - Populate City.Latitude and City.Longitude when seeding
  - Log statistics about cities with/without coordinates

### 4. City Resolution Logic
- **File**: `backend/FloodAid.Api/Controllers/HelpRequestController.cs`
- **Method**: `ResolveProvinceAndCityAsync()`
- **Strategy**:
  1. **Normalized Name Match** (existing): Compare normalized city names (removes "Tehsil", "District" suffixes)
  2. **Distance-Based Fallback** (new): If name match fails, find nearest city with coordinates within 50km
  3. **Province-Only Fallback**: If no city within 50km, proceed with province-only scoping

## Deployment Steps

### Step 1: Run Geocoder (One-Time)
```bash
cd backend/CityGeocoder
dotnet run
```
- Takes ~5-6 minutes to complete
- Generates `backend/FloodAid.Api/Data/pak_cities_with_coords.csv`
- Shows success rate (e.g., "Geocoded 250/278 cities")

### Step 2: Apply Migration to Production
```bash
cd backend/FloodAid.Api
dotnet ef database update --connection "YOUR_PRODUCTION_CONNECTION_STRING"
```
Or let the migration run automatically on next deployment (via `InitializeDatabaseAsync` in Program.cs).

### Step 3: Deploy to Production
1. Ensure `pak_cities_with_coords.csv` is included in deployment
2. Deploy backend normally
3. On first run, `SeedData` will populate city coordinates automatically

### Step 4: Verify
1. Create a help request from a city with known name mismatch (e.g., Gujranwala)
2. Check logs for distance-based matching:
   - `"City resolved by name match: ..."`  (strategy 1 success)
   - `"City resolved by distance: ..."`     (strategy 2 success)
   - `"No city found within 50km"`          (fallback to province)
3. Verify volunteers appear in Assign dropdown

## Rollback Plan
If issues occur:
1. Distance matching is additive - old name matching still works
2. Cities without coordinates fall back to province-only scoping (existing behavior)
3. To fully rollback:
   ```bash
   dotnet ef migrations remove --context FloodAidContext
   ```

## Expected Outcomes
- ✅ Help requests resolve to correct cities even with OSM name variations
- ✅ Volunteer assignment dropdown shows correctly filtered volunteers
- ✅ No more "Unable to resolve city from coordinates" errors for valid locations
- ✅ Better user experience for city-based scoping

## Monitoring
Watch for these log patterns:
- `"City resolved by distance: ... at XX.Xkm"` - Strategy 2 working
- `"No city found within 50km. Nearest was '...' at XX.Xkm"` - May need distance threshold adjustment
- `"No cities in province ... have coordinates"` - May need to manually geocode missing cities

## Performance Notes
- Haversine distance calculation: O(n) per request where n = cities in province
- Typical province has 20-40 cities, negligible performance impact
- In-memory calculation, no additional DB queries
- Caching not needed due to fast computation
