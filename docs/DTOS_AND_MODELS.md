# Flood Aid - DTOs and Request/Response Models

## Overview

This document describes all Data Transfer Objects (DTOs) and request/response models used by the Flood Aid API. DTOs are lightweight objects used to transfer data between frontend and backend.

---

## Table of Contents

1. [Donation DTOs](#donation-dtos)
2. [Authentication DTOs](#authentication-dtos)
3. [Admin User DTOs](#admin-user-dtos)
4. [Error DTOs](#error-dtos)
5. [Common Patterns](#common-patterns)

---

## Donation DTOs

### CashDonationRequest

**Used by**: `POST /api/donation/create-session`

**Purpose**: Request to create a Stripe checkout session for cash donation

**Properties**:

| Property | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| name | string | Yes | Max 100 chars | Donor's full name |
| email | string | Yes | Valid email | Contact email for confirmation |
| amount | decimal | Yes | > 0 | Donation amount in PKR |

**Example**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "amount": 5000.00
}
```

**Validation Rules**:
- `name`: Not empty, max 100 characters
- `email`: Valid email format
- `amount`: Minimum 100 PKR, maximum 999,999 PKR

**Server Processing**:
1. Validates amount range
2. Creates Stripe Checkout Session
3. Queues email confirmation (non-blocking)
4. Returns session URL

---

### SuppliesDonationRequest

**Used by**: `POST /api/donation/create-supplies`

**Purpose**: Request to record in-kind (supplies) donation

**Properties**:

| Property | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| name | string | Yes | Max 100 chars | Donor's full name |
| email | string | Yes | Valid email | Contact email for confirmation |
| description | string | Yes | Max 500 chars | Detailed list of items |

**Example**:
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "description": "10 blankets, 5 kg rice, medical first aid kit, 3 sleeping bags"
}
```

**Validation Rules**:
- `name`: Not empty, max 100 characters
- `email`: Valid email format
- `description`: Not empty, max 500 characters

**Server Processing**:
1. Validates input fields
2. Creates Donation record with status=Pending
3. Generates unique ReceiptId (GUID)
4. Queues email confirmation
5. Returns receipt ID

---

### DonationResponse / DonationReceipt

**Used by**: Response from both donation endpoints

**Purpose**: Confirmation of donation creation

**Properties**:

| Property | Type | Description |
| --- | --- | --- |
| id | string | Unique donation receipt ID (GUID) |
| receiptId | string | Same as id, for clarity |
| sessionId | string | Stripe session ID (cash donations only) |
| url | string | Stripe checkout URL (cash donations only) |

**Cash Donation Response**:
```json
{
  "sessionId": "cs_test_51QYLx6AjHhIH8pK1G1aB2cD3eF4gH5iJ",
  "url": "https://checkout.stripe.com/c/pay/cs_test_51QYLx6AjHhIH8pK1G1aB2cD3eF4gH5iJ"
}
```

**Supplies Donation Response**:
```json
{
  "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "receiptId": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6"
}
```

---

### SessionDetail / SessionResponse

**Used by**: `GET /api/donation/session/{id}`

**Purpose**: Return payment session details from Stripe

**Properties**:

| Property | Type | Description |
| --- | --- | --- |
| id | string | Stripe session ID |
| amount | decimal | Actual paid amount in PKR |
| currency | string | "pkr" (lowercase) |
| paymentStatus | string | "paid", "unpaid", or "no_payment_required" |
| email | string | Customer email from session |

**Example**:
```json
{
  "id": "cs_test_51QYLx6AjHhIH8pK1G1aB2cD3eF4gH5iJ",
  "amount": 5000.00,
  "currency": "pkr",
  "paymentStatus": "paid",
  "email": "john.doe@example.com"
}
```

---

## Authentication DTOs

### LoginRequest

**Used by**: `POST /api/auth/login` (Step 1)

**Purpose**: Submit credentials to initiate login and receive OTP

**Properties**:

| Property | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| identifier | string | Yes | Email or Username | Email or username of admin |
| password | string | Yes | Plain text | Password (sent over HTTPS) |

**Example**:
```json
{
  "identifier": "admin@floodaid.org",
  "password": "SecurePassword123!"
}
```

**Validation Rules**:
- `identifier`: Must be registered admin email or username
- `password`: Must match hashed password in database

**Security Notes**:
- Always sent over HTTPS
- Password compared using BCrypt (work factor 11)
- Account locked after 5 failed attempts for 15 minutes

---

### VerifyOtpRequest

**Used by**: `POST /api/auth/verify-otp` (Step 2)

**Purpose**: Verify OTP received in email and complete login

**Properties**:

| Property | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| email | string | Yes | Must be registered | Admin email (from login step) |
| otp | string | Yes | 6 digits | One-time password from email |

**Example**:
```json
{
  "email": "admin@floodaid.org",
  "otp": "123456"
}
```

**Validation Rules**:
- `email`: Must match email from login request
- `otp`: Must be 6 digits, valid within 5 minutes

---

### LoginResponse

**Used by**: Responses from `/api/auth/login` and `/api/auth/verify-otp`

**Purpose**: Return authentication status and credentials

**Properties**:

| Property | Type | Description |
| --- | --- | --- |
| success | boolean | True if operation successful |
| nextStep | string | "otp" (sent OTP), "authenticated" (login complete), or null |
| token | string | JWT token (only when authenticated) |
| user | AdminUserDto | Admin user details (only when authenticated) |
| message | string | Status message or error description |

**After Login Request (OTP Sent)**:
```json
{
  "success": true,
  "nextStep": "otp",
  "message": "OTP sent to registered email. Valid for 5 minutes."
}
```

**After OTP Verification (Success)**:
```json
{
  "success": true,
  "nextStep": "authenticated",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@floodaid.org",
    "username": "admin",
    "role": "super_admin",
    "permissions": ["all"],
    "loginTime": "2025-12-31T10:30:00Z"
  },
  "message": "Login successful"
}
```

**Invalid Credentials**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Account Locked**:
```json
{
  "success": false,
  "message": "Account locked. Try again in 15 minutes"
}
```

---

## Admin User DTOs

### AdminUserDto

**Used by**: Returned in authentication responses

**Purpose**: Safe representation of admin user (no password)

**Properties**:

| Property | Type | Description |
| --- | --- | --- |
| id | integer | Unique admin identifier |
| name | string | Admin's full name |
| email | string | Email address |
| username | string | Username for login |
| role | string | Role level (super_admin, admin, moderator) |
| permissions | string[] | Array of allowed permissions |
| loginTime | DateTime? | Last login timestamp |

**Example**:
```json
{
  "id": 1,
  "name": "System Administrator",
  "email": "admin@floodaid.org",
  "username": "admin",
  "role": "super_admin",
  "permissions": [
    "view_donations",
    "approve_donations",
    "reject_donations",
    "view_requests",
    "approve_requests",
    "manage_admins"
  ],
  "loginTime": "2025-12-31T10:30:00Z"
}
```

---

## Error DTOs

### ErrorResponse

**Used by**: All error responses from API

**Purpose**: Standardized error format

**Properties**:

| Property | Type | Description |
| --- | --- | --- |
| error | string | Human-readable error message |
| errorCode | string | Machine-readable error code |
| timestamp | string | ISO 8601 timestamp |
| details | object | Additional error context (optional) |

**Examples**:

**Invalid Amount**:
```json
{
  "error": "Invalid donation amount. Must be between 100 and 999,999 PKR.",
  "errorCode": "INVALID_AMOUNT",
  "timestamp": "2025-12-31T10:30:00Z"
}
```

**Session Not Found**:
```json
{
  "error": "Session not found",
  "errorCode": "SESSION_NOT_FOUND",
  "timestamp": "2025-12-31T10:30:00Z"
}
```

**Unauthorized (Invalid Token)**:
```json
{
  "error": "Invalid or expired authentication token",
  "errorCode": "UNAUTHORIZED",
  "timestamp": "2025-12-31T10:30:00Z"
}
```

**Rate Limit Exceeded**:
```json
{
  "error": "Rate limit exceeded. Please retry after some time.",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2025-12-31T10:30:00Z",
  "details": {
    "retryAfter": 45
  }
}
```

---

## Common Patterns

### HTTP Status Codes

All responses follow standard HTTP status codes:

| Code | Meaning | Common Scenarios |
| --- | --- | --- |
| 200 | OK | Successful request |
| 201 | Created | Resource created (donations) |
| 204 | No Content | Successful but no response body |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist (session not found) |
| 410 | Gone | Expired resource (OTP expired) |
| 423 | Locked | Account locked (too many failed logins) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | External service down (Stripe, email) |

### Timestamp Format

All timestamps follow ISO 8601 standard:

```
2025-12-31T10:30:00Z        // UTC timezone
2025-12-31T10:30:00+05:00   // With offset
```

### Currency Format

Currency amounts are always decimal with 2 places:

```json
{
  "amount": 5000.00,    // ✓ Correct
  "amount": "5000.00"   // ✓ Also correct
}
```

NOT:
```json
{
  "amount": 5000,       // ✗ Missing decimals
  "amount": 5000.5      // ✗ Wrong precision
}
```

### Error Code Conventions

Error codes follow SNAKE_CASE pattern:

```
INVALID_AMOUNT
SESSION_NOT_FOUND
UNAUTHORIZED
RATE_LIMIT_EXCEEDED
DATABASE_ERROR
EMAIL_SERVICE_FAILED
```

---

## Practical Examples

### Complete Cash Donation Flow

**1. Frontend sends request**:
```json
POST /api/donation/create-session

{
  "name": "John Doe",
  "email": "john@example.com",
  "amount": 5000
}
```

**2. Backend responds with session**:
```json
200 OK

{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**3. Frontend redirects to Stripe, user pays**

**4. Stripe redirects to success page with session_id parameter**

**5. Frontend queries for session details**:
```
GET /api/donation/session/cs_test_...
```

**6. Backend returns payment confirmation**:
```json
200 OK

{
  "id": "cs_test_...",
  "amount": 5000.00,
  "currency": "pkr",
  "paymentStatus": "paid",
  "email": "john@example.com"
}
```

**7. Frontend displays success message with confirmed amount**

### Complete Login Flow

**1. Admin enters credentials**:
```json
POST /api/auth/login

{
  "identifier": "admin@floodaid.org",
  "password": "SecurePassword123!"
}
```

**2. Backend sends OTP via email**:
```json
200 OK

{
  "success": true,
  "nextStep": "otp",
  "message": "OTP sent to registered email"
}
```

**3. Admin receives email with OTP code**

**4. Admin enters OTP**:
```json
POST /api/auth/verify-otp

{
  "email": "admin@floodaid.org",
  "otp": "123456"
}
```

**5. Backend verifies and returns JWT token**:
```json
200 OK

{
  "success": true,
  "nextStep": "authenticated",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@floodaid.org",
    "role": "super_admin",
    "permissions": ["all"]
  }
}
```

**6. Frontend stores token, uses in Authorization header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Frontend Implementation Examples

### React Hook for Donation

```javascript
import { useState } from 'react';

function useCashDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSession = async (name, email, amount) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/donation/create-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, amount })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createSession, loading, error };
}
```

### TypeScript Types

```typescript
// Donation Types
interface CashDonationRequest {
  name: string;
  email: string;
  amount: decimal;
}

interface SuppliesDonationRequest {
  name: string;
  email: string;
  description: string;
}

interface DonationReceipt {
  id: string;
  receiptId: string;
  sessionId?: string;
  url?: string;
}

// Auth Types
interface LoginRequest {
  identifier: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  nextStep?: 'otp' | 'authenticated';
  token?: string;
  user?: AdminUserDto;
  message?: string;
}

interface AdminUserDto {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
  loginTime?: string;
}
```

---

**Last Updated**: December 31, 2025  
**Version**: 1.0
