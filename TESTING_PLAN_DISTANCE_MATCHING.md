# Testing Plan for Distance-Based City Matching

## Test Scenarios

### Scenario 1: Name Match (Existing Behavior)
**City**: Lahore  
**Coordinates**: 31.5204, 74.3587  
**Expected**:
- OSM returns "Lahore"
- Normalized name matches DB city "Lahore"
- Log: "City resolved by name match: geocoded='Lahore' → 'Lahore' (Id=X)"
- Volunteers from Lahore appear in Assign dropdown

### Scenario 2: Distance-Based Fallback (New Feature)
**City**: Gujranwala  
**Coordinates**: 32.1525, 74.1934  
**Issue**: OSM returns "Gujranwala Tehsil" → normalized to "gujranwala"  
**Expected**:
- Name match succeeds after normalization
- If name match fails, distance fallback finds nearest city within 50km
- Log: "City resolved by distance: geocoded='Gujranwala Tehsil' → nearest 'Gujranwala' at X.Xkm (Id=Y)"
- Volunteers from Gujranwala appear in Assign dropdown

### Scenario 3: Rural Location (Distance Fallback)
**Location**: Coordinates between two cities  
**Coordinates**: 31.0, 73.0 (example between cities)  
**Expected**:
- OSM returns village/town name not in DB
- Distance fallback finds nearest city within 50km
- Log: "City resolved by distance: geocoded='VillageName' → nearest 'NearestCity' at X.Xkm (Id=Y)"
- Volunteers from nearest city appear in Assign dropdown

### Scenario 4: Remote Location (Province Fallback)
**Location**: Remote area >50km from any city  
**Coordinates**: 28.0, 63.0 (remote Balochistan)  
**Expected**:
- OSM returns location name not in DB
- No city found within 50km
- Province resolved correctly
- cityId remains null
- Log: "No city found within 50km. Nearest was 'CityName' at XX.Xkm. Proceeding with province-only."
- All volunteers in that province appear in Assign dropdown

### Scenario 5: Cities Without Coordinates (Graceful Degradation)
**City**: One of the ~28 cities that failed geocoding  
**Expected**:
- Name matching still works
- Distance matching skipped (no coordinates)
- Log: "No cities in province X have coordinates for distance matching. Proceeding with province-only."
- Province-wide volunteers appear

## Test Steps

1. **Apply Migration**:
   ```bash
   cd backend/FloodAid.Api
   dotnet ef database update --connection "production_connection_string"
   ```

2. **Verify Seeding**:
   - Start backend
   - Check logs for: "Seeded X provinces and Y cities (Z with coordinates)"
   - Expected: ~250/278 cities with coordinates

3. **Test Request Creation**:
   - Use victim form to create help request
   - Select location on map (Gujranwala)
   - Submit request
   - Check backend logs for resolution strategy used

4. **Test Volunteer Assignment**:
   - Login as admin
   - Navigate to Requests page
   - Click "Assign" on Gujranwala request
   - Verify dropdown shows Gujranwala volunteers (not empty)

5. **Check Database**:
   ```sql
   SELECT "Name", "ProvinceId", "Latitude", "Longitude" 
   FROM "Cities" 
   WHERE "Name" = 'Gujranwala';
   ```
   Expected: Latitude and Longitude populated

## Success Criteria
- ✅ All test scenarios pass
- ✅ Volunteer dropdown shows correct volunteers for all request types
- ✅ No "Unable to resolve city from coordinates" errors for valid locations
- ✅ Performance: City resolution < 200ms per request
- ✅ Logs show appropriate resolution strategy being used

## Rollback Criteria
- ❌ Resolution fails for previously working cities
- ❌ Performance degradation > 500ms
- ❌ Database errors from migration
- ❌ Incorrect volunteer assignments

## Monitoring Post-Deployment
Watch for these log patterns in first 24 hours:
- Count of "City resolved by name match" vs "City resolved by distance"
- Any "No city found within 50km" warnings (review if > 5%)
- Ratio of name matches to distance fallbacks (expect ~80/20)
