#!/bin/bash

# Test script for volunteer filtering fix
cd /c/Users/farha/source/repos/Flood_Aid/backend/FloodAid.Api

echo "Starting API server..."
ASPNETCORE_ENVIRONMENT=Development dotnet bin/Debug/net9.0/FloodAid.Api.dll --urls "http://localhost:5273" &
API_PID=$!

echo "Waiting for API to start..."
sleep 10

echo ""
echo "=== Testing Help Request Creation with Gujranwala Coordinates ==="
echo ""
RESPONSE=$(curl -s -X POST http://localhost:5273/api/helpRequest \
  -H "Content-Type: application/json" \
  -d '{"requestorPhoneNumber":"03001234567","requestType":1,"requestDescription":"Food needed - TEST for Gujranwala volunteers","latitude":32.24357,"longitude":74.14770}')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Extract the ID and CityId from response
REQUEST_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
CITY_ID=$(echo "$RESPONSE" | grep -o '"cityId":[0-9]*' | head -1 | cut -d':' -f2)

echo ""
echo "Created Request ID: $REQUEST_ID"
echo "Resolved CityId: $CITY_ID"
echo ""

if [ ! -z "$CITY_ID" ] && [ "$CITY_ID" != "null" ]; then
    echo "✅ SUCCESS: CityId was resolved (not null)"
    echo ""
    echo "=== Fetching volunteers for CityId=$CITY_ID ==="
    echo ""
    
    # Note: This would require admin auth token in production
    # For now just show the constructed URL
    echo "URL to fetch volunteers: http://localhost:5273/api/users?role=0&pageSize=100&cityId=$CITY_ID"
else
    echo "❌ FAIL: CityId is null or missing"
fi

echo ""
echo "Stopping API server..."
kill $API_PID 2>/dev/null
wait $API_PID 2>/dev/null

echo "Test complete."
