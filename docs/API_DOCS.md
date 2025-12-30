# Flood Aid - API Documentation

## Overview

This document provides complete reference for the Flood Aid REST API. The API supports donation management, authentication, and administrative functions.

**Base URL**: `https://floodaid-api.onrender.com`  
**Version**: 1.0  
**Authentication**: JWT Bearer Token (for admin endpoints)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Donation Endpoints](#donation-endpoints)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Health Check](#health-check)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Data Models](#data-models)

---

## Authentication

### JWT Token Format

Protected endpoints require JWT bearer token in Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Structure

- **Issuer**: FloodAid.Api
- **Audience**: FloodAid.Frontend
- **Algorithm**: HS256
- **Expiry**: 1440 minutes (24 hours) default, configurable per token type
- **Claims**: 
  - `sub` (Subject): Admin ID
  - `email` (Email): Admin email
  - `role` (Role): Admin role
  - `permissions` (Permissions): Array of allowed actions

---

## Donation Endpoints

### 1. Create Cash Donation Session

Creates a Stripe Checkout Session for cash donations.

**Endpoint**: `POST /api/donation/create-session`

**Authentication**: Not required

**Request Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "amount": 5000.00
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| name | string | Yes | Donor's full name (max 100 chars) |
| email | string | Yes | Valid email address for confirmation |
| amount | decimal | Yes | Donation amount in PKR (min: 100, max: 999,999) |

**Response (200 OK)**:
```json
{
  "sessionId": "cs_test_51QYLx6AjHhIH8pK1G1aB2cD3eF4gH5iJ",
  "url": "https://checkout.stripe.com/c/pay/cs_test_51QYLx6AjHhIH8pK1G1aB2cD3eF4gH5iJ"
}
```

**Response Fields**:

| Field | Type | Description |
| --- | --- | --- |
| sessionId | string | Unique Stripe Checkout Session ID |
| url | string | URL to redirect user for payment |

**Response (400 Bad Request)**:
```json
{
  "error": "Invalid donation amount. Must be between 100 and 999,999 PKR."
}
```

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to create payment session"
}
```

**Example Request** (cURL):
```bash
curl -X POST https://floodaid-api.onrender.com/api/donation/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "amount": 5000
  }'
```

**Flow**:
1. User submits donation form on frontend
2. Frontend calls this endpoint with donation details
3. Backend creates Stripe Checkout Session
4. Backend queues confirmation email (non-blocking)
5. Backend returns session URL to frontend
6. Frontend redirects user to Stripe checkout
7. User completes payment on Stripe
8. Stripe redirects to success URL with `session_id` parameter

**Notes**:
- Amount is in PKR (Pakistani Rupees)
- Internally converted to paisa (×100) for Stripe
- Email confirmation sent asynchronously (fire-and-forget)
- Success URL: `https://flood-aid-94zg.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `https://flood-aid-94zg.vercel.app/cancel`

---

### 2. Get Session Details

Retrieves Stripe Checkout Session payment information. Used by the success page to confirm payment amount.

**Endpoint**: `GET /api/donation/session/{id}`

**Authentication**: Not required

**Path Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | Yes | Stripe Checkout Session ID (cs_...) |

**Response (200 OK)**:
```json
{
  "id": "cs_test_51QYLx6AjHhIH8pK1G1aB2cD3eF4gH5iJ",
  "amount": 5000.00,
  "currency": "pkr",
  "paymentStatus": "paid",
  "email": "john@example.com"
}
```

**Response Fields**:

| Field | Type | Description |
| --- | --- | --- |
| id | string | Stripe session ID |
| amount | decimal | Total amount paid in PKR |
| currency | string | Currency code ("pkr") |
| paymentStatus | string | Status: "paid", "unpaid", "no_payment_required" |
| email | string | Customer email from session |

**Response (404 Not Found)**:
```json
{
  "error": "Session not found"
}
```

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to retrieve session"
}
```

**Example Request** (JavaScript/Fetch):
```javascript
fetch('https://floodaid-api.onrender.com/api/donation/session/cs_test_...')
  .then(res => res.json())
  .then(data => {
    console.log(`Payment received: ${data.amount} ${data.currency}`);
    console.log(`Status: ${data.paymentStatus}`);
  });
```

**Notes**:
- Called from the success page (via `session_id` URL parameter)
- Returns actual amount paid by user
- Payment status indicates if payment was successful

---

### 3. Create In-Kind (Supplies) Donation

Records a supplies/items donation without payment processing.

**Endpoint**: `POST /api/donation/create-supplies`

**Authentication**: Not required

**Request Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "description": "10 blankets, 5 kg rice, medical supplies"
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| name | string | Yes | Donor's full name (max 100 chars) |
| email | string | Yes | Valid email address for confirmation |
| description | string | Yes | Detailed description of items (max 500 chars) |

**Response (200 OK)**:
```json
{
  "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "receiptId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6"
}
```

**Response Fields**:

| Field | Type | Description |
| --- | --- | --- |
| id | string | Unique donation receipt ID (GUID) |
| receiptId | string | Same as id, for confirmation |

**Response (400 Bad Request)**:
```json
{
  "error": "Description is required and must not be empty."
}
```

**Response (500 Internal Server Error)**:
```json
{
  "error": "Failed to create supplies donation"
}
```

**Example Request** (JavaScript):
```javascript
const donationData = {
  name: "Jane Smith",
  email: "jane@example.com",
  description: "10 blankets, 5 kg rice, medical supplies"
};

fetch('https://floodaid-api.onrender.com/api/donation/create-supplies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(donationData)
})
.then(res => res.json())
.then(data => console.log(`Receipt ID: ${data.receiptId}`));
```

**Notes**:
- No payment processing required
- Receipt ID auto-generated (GUID format)
- Email confirmation sent asynchronously
- Admin review required for approval
- Stored in database for admin dashboard review

---

## Authentication Endpoints

### 1. Login (Step 1: Verify Credentials)

Initiates admin login and sends OTP via email.

**Endpoint**: `POST /api/auth/login`

**Authentication**: Not required

**Rate Limit**: 5 attempts per minute

**Request Headers**:
```http
Content-Type: application/json
```

**Request Body**:
```json
{
  "identifier": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| identifier | string | Yes | Email or username of admin |
| password | string | Yes | Admin password (plain text) |

**Response (200 OK - OTP Sent)**:
```json
{
  "success": true,
  "nextStep": "otp",
  "message": "OTP sent to registered email. Valid for 5 minutes."
}
```

**Response (200 OK - Already Authenticated)**:
```json
{
  "success": true,
  "nextStep": "authenticated",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "username": "admin",
    "role": "super_admin",
    "permissions": ["all"],
    "loginTime": "2025-12-31T10:30:00Z"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Response (423 Locked)**:
```json
{
  "success": false,
  "message": "Account locked. Try again in 15 minutes"
}
```

**Notes**:
- Credentials verified against bcrypt-hashed passwords
- OTP sent if credentials valid
- Account locked after 5 failed attempts for 15 minutes
- Different response if user already has valid session

---

### 2. Verify OTP (Step 2: Complete Login)

Verifies OTP and returns JWT token.

**Endpoint**: `POST /api/auth/verify-otp`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| email | string | Yes | Admin email (must match login email) |
| otp | string | Yes | 6-digit OTP sent via email |

**Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "username": "admin",
    "role": "super_admin",
    "permissions": ["all"],
    "loginTime": "2025-12-31T10:30:00Z"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**Response (410 Gone)**:
```json
{
  "success": false,
  "message": "OTP expired. Request a new one."
}
```

**Notes**:
- OTP valid for 5 minutes
- Token includes permissions and admin info
- Token used for subsequent authenticated requests

---

## Health Check

### Service Health Status

Returns service health and availability status.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-31T10:30:00Z"
}
```

**Usage**: Used by Render health checks and monitoring systems.

---

## Error Handling

### Standard Error Response Format

All errors return consistent JSON format:

```json
{
  "error": "Descriptive error message",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-12-31T10:30:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | Scenario |
| --- | --- | --- |
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found (e.g., session ID invalid) |
| 410 | Gone | Expired resource (e.g., OTP expired) |
| 423 | Locked | Account locked due to failed attempts |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected backend error |
| 503 | Service Unavailable | External service down (Stripe, email) |

### Common Error Codes

| Code | Description | Resolution |
| --- | --- | --- |
| INVALID_AMOUNT | Donation amount outside allowed range | Use amount between 100-999,999 PKR |
| SESSION_NOT_FOUND | Stripe session ID doesn't exist | Verify session ID from checkout response |
| EMAIL_FAILED | Email service temporarily unavailable | Retry after a few minutes |
| INVALID_CREDENTIALS | Wrong email/username or password | Verify credentials and try again |
| ACCOUNT_LOCKED | Too many failed login attempts | Wait 15 minutes before retrying |
| OTP_EXPIRED | OTP valid time exceeded | Request new OTP |
| STRIPE_ERROR | Payment gateway error | Check Stripe status page |

---

## Rate Limiting

Rate limits protect the API from abuse and ensure fair usage.

### Limits by Endpoint

| Endpoint | Limit | Window |
| --- | --- | --- |
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/donation/*` | 10 requests | 1 minute |
| Other endpoints | 100 requests | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1672548600
```

### Response When Limit Exceeded

**HTTP 429 Too Many Requests**:
```json
{
  "error": "Rate limit exceeded. Please retry after some time.",
  "retryAfter": 45
}
```

---

## Data Models

### Request Models

#### CashDonationRequest
```typescript
{
  name: string;        // Max 100 chars
  email: string;       // Valid email
  amount: decimal;     // 100-999,999 PKR
}
```

#### SuppliesDonationRequest
```typescript
{
  name: string;           // Max 100 chars
  email: string;          // Valid email
  description: string;    // Max 500 chars
}
```

#### LoginRequest
```typescript
{
  identifier: string;    // Email or username
  password: string;      // Plain text password
}
```

#### VerifyOtpRequest
```typescript
{
  email: string;         // Must match login email
  otp: string;           // 6-digit code
}
```

### Response Models

#### SessionDetail
```typescript
{
  id: string;             // Stripe session ID
  amount: decimal;        // Amount in PKR
  currency: string;       // "pkr"
  paymentStatus: string;  // "paid" | "unpaid" | "no_payment_required"
  email: string;          // Customer email
}
```

#### LoginResponse
```typescript
{
  success: boolean;
  nextStep?: string;      // "otp" | "authenticated"
  token?: string;         // JWT token
  user?: {
    id: number;
    name: string;
    email: string;
    username: string;
    role: string;         // "super_admin" | "admin" | "moderator"
    permissions: string[];
    loginTime?: string;   // ISO 8601 timestamp
  };
  message?: string;
}
```

#### DonationReceipt
```typescript
{
  id: string;             // GUID receipt ID
  receiptId: string;      // Same as id
}
```

### Enums

#### DonationType
```csharp
public enum DonationType
{
    CashDonation = 0,
    FoodSupplies = 1,
    MedicalSupplies = 2,
    ClothingSupplies = 3,
    OtherSupplies = 4
}
```

#### DonationStatus
```csharp
public enum DonationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3
}
```

---

## Example Workflows

### Complete Cash Donation Flow

```
1. POST /api/donation/create-session
   Request: { name, email, amount }
   Response: { sessionId, url }
   
2. User visits Stripe checkout URL
   (Completes payment on Stripe servers)
   
3. GET /api/donation/session/{sessionId}
   Response: { id, amount, paymentStatus, ... }
   
4. Display success page with receipt
```

### Complete In-Kind Donation Flow

```
1. POST /api/donation/create-supplies
   Request: { name, email, description }
   Response: { id, receiptId }
   
2. Show success page with receipt ID
   
3. Admin reviews in dashboard (future feature)
   
4. Admin approves/rejects donation
   
5. Donor receives status email
```

### Admin Login Flow

```
1. POST /api/auth/login
   Request: { identifier, password }
   Response: { success, nextStep: "otp" }
   (OTP sent to email)
   
2. POST /api/auth/verify-otp
   Request: { email, otp }
   Response: { token, user, ... }
   
3. Use token in Authorization header:
   Authorization: Bearer {token}
   
4. Access protected endpoints
```

---

## Best Practices

### Client Implementation

1. **Error Handling**: Always check response status and error object
2. **Retry Logic**: Retry 5xx errors with exponential backoff
3. **Token Management**: Store JWT securely (HttpOnly cookie preferred)
4. **Validation**: Validate input before sending to API
5. **Rate Limits**: Implement client-side rate limit handling

### Security

1. **HTTPS**: Always use HTTPS in production
2. **Secrets**: Never expose API keys or secrets in frontend code
3. **Token Expiry**: Implement token refresh mechanism
4. **CORS**: Whitelist only trusted domains
5. **Validation**: Validate all inputs server-side

### Performance

1. **Caching**: Cache session details to reduce API calls
2. **Batch Requests**: Combine related requests when possible
3. **Compression**: Use gzip compression for responses
4. **Monitoring**: Log API usage and errors

---

## API Testing

### Test Card Numbers (Stripe Test Mode)

| Card | Number | CVC | Date |
| --- | --- | --- | --- |
| Visa | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| Visa (decline) | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| MasterCard | 5555 5555 5555 4444 | Any 3 digits | Any future date |

### Test Environments

- **Frontend**: http://localhost:5173 (development)
- **Backend**: http://localhost:5273 (development)
- **API**: https://floodaid-api.onrender.com (production)

### Test with cURL

```bash
# Create cash donation
curl -X POST http://localhost:5273/api/donation/create-session \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","amount":5000}'

# Create supplies donation
curl -X POST http://localhost:5273/api/donation/create-supplies \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","description":"Test supplies"}'

# Check health
curl http://localhost:5273/health
```

---

**API Version**: 1.0  
**Last Updated**: December 31, 2025  
**Maintainer**: Flood Aid Development Team
