# Flood Aid - Testing Guide

## Prerequisites
- Backend running: `dotnet run` at **localhost:5273**
- Frontend running: `npm run dev` at **localhost:5174**
- PostgreSQL Docker container running: `postgres-floodaid`
- Database: `floodaid` with tables created

## Quick Start Tests

### 1. Test Help Request Submission (User Feature)

**Browser Test:**
1. Go to http://localhost:5174
2. Click "Request Help" button
3. Fill out the form:
   - Name: Any name
   - Phone: 03001234567
   - Email: test@example.com
   - Request Type: Select one (Food, Medical, Rescue)
   - Description: "Testing help request"
   - Click locate button or drag map marker to set location
4. Click "Submit Request"
5. Should see success message for 5.5 seconds, then redirect to home

**Expected Result:** ✅ Form submits, success page appears, request saved to database

**Curl Test (No Browser):**
```bash
curl -X POST http://localhost:5273/api/helpRequest \
  -H "Content-Type: application/json" \
  -d '{
    "requestorName":"Test User",
    "requestorPhoneNumber":"03001234567",
    "requestorEmail":"test@example.com",
    "requestType":0,
    "requestDescription":"Testing help request",
    "latitude":30.3753,
    "longitude":69.3451
  }'
```

**Expected Response:** 
```json
{
  "id": 1,
  "requestorName": "Test User",
  "status": "Pending",
  "createdAt": "2025-12-31T...",
  ...
}
```

---

### 2. Test Admin Dashboard - Requests Page

**Browser Test:**
1. Go to http://localhost:5174/admin/requests
2. **Verify data loads:**
   - Should see table with submitted help requests
   - Columns: ID, Type, Location, Priority, Reported By, Status, Actions

3. **Test search functionality:**
   - Type a request ID in search box → Table filters
   - Type a name → Filters by reporter
   - Type a phone number → Filters by phone

4. **Test status filter:**
   - Click filter icon (funnel button)
   - Select "Pending" → Shows only pending requests
   - Select "InProgress" → Shows only in-progress requests

5. **Test status update:**
   - Find a "Pending" request
   - Click the yellow circle icon (Mark In Progress)
   - Confirm the popup
   - Status should change to "InProgress" immediately
   - Go to "In Progress" filter → See updated request

6. **Test request cancellation:**
   - Click red X icon on any request
   - Confirm the popup
   - Request moves to "Cancelled" status

**Expected Behavior:** ✅ Data loads from API, filtering works, status updates reflect immediately

---

### 3. Test Donations Module

**Browser Test:**
1. Go to http://localhost:5174/donations
2. Fill out donation form:
   - Donation Type: Select one
   - Item Description: "Test supplies"
   - Quantity: 5
   - Click "Donate Now"
3. Stripe payment modal appears
4. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
5. Complete payment
6. Should see success confirmation

**Expected Result:** ✅ Payment processed, donation record saved

---

### 4. Test API Endpoints Directly

**List all help requests:**
```bash
curl http://localhost:5273/api/helpRequest
```

**Filter by status:**
```bash
curl "http://localhost:5273/api/helpRequest?status=Pending"
```

**Get single request:**
```bash
curl http://localhost:5273/api/helpRequest/1
```

**Update request status:**
```bash
curl -X PUT http://localhost:5273/api/helpRequest/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"InProgress"}'
```

**Health check:**
```bash
curl http://localhost:5273/api/diagnostics/health
```

---

### 5. Test Admin Authentication

**Browser Test:**
1. Go to http://localhost:5174/admin/login
2. Try login with credentials:
   - Email: admin@floodaid.com
   - Password: Try common passwords or check config

**Or via curl:**
```bash
curl -X POST http://localhost:5273/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@floodaid.com","password":"your_password"}'
```

---

## Database Verification

**Check PostgreSQL directly:**
```bash
docker exec -it postgres-floodaid psql -U postgres -d floodaid -c "SELECT * FROM \"HelpRequests\";"
```

**Count requests by status:**
```bash
docker exec -it postgres-floodaid psql -U postgres -d floodaid -c "SELECT status, COUNT(*) FROM \"HelpRequests\" GROUP BY status;"
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| API returns 500 error | Check backend terminal for exception, verify DbContext is registered |
| Admin page shows "Loading" forever | Backend may be down, check http://localhost:5273/api/diagnostics/health |
| Form submission fails silently | Open browser DevTools (F12) → Network tab, check API response |
| Map doesn't show location | Ensure browser location permissions are enabled |
| Stripe payment fails | Use test card credentials, check Stripe API keys in config |

---

## Test Checklist

- [ ] Help request form submits successfully
- [ ] Admin sees request in dashboard (Real API data, not mock)
- [ ] Admin can filter requests by status
- [ ] Admin can update request status
- [ ] Status changes reflect immediately
- [ ] Search filters work correctly
- [ ] Donation form opens and accepts payments
- [ ] API health check passes
- [ ] Database contains submitted data

---

## Performance/Load Testing

**Simulate multiple requests:**
```bash
for i in {1..10}; do
  curl -X POST http://localhost:5273/api/helpRequest \
    -H "Content-Type: application/json" \
    -d "{
      \"requestorName\":\"Test User $i\",
      \"requestorPhoneNumber\":\"030012345$i\",
      \"requestorEmail\":\"test$i@example.com\",
      \"requestType\":$((RANDOM % 3)),
      \"requestDescription\":\"Load test request $i\",
      \"latitude\":$((30 + RANDOM % 2)),
      \"longitude\":$((69 + RANDOM % 2))
    }"
  echo "Request $i submitted"
done
```

Then visit admin dashboard to verify all requests loaded.
