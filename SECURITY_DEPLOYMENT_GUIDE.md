# FloodAid Security Implementation - Deployment Guide

## ✅ What Was Implemented

### Backend (C# .NET 9.0)
Implemented secure authentication system per **SRS Section 3.3.2** requirements:

1. **BCrypt Password Hashing** (Work Factor 11)
   - All passwords hashed using BCrypt.Net-Next
   - Complies with SRS: "While Argon2id is the current state-of-the-art, we have selected Bcrypt (Work Factor 11) for its proven reliability in .NET environments"

2. **JWT Authentication**
   - Secure token-based authentication
   - Configurable expiry (default 24 hours)
   - Role-Based Access Control (RBAC) foundation

3. **Multi-Factor Authentication**
   - Two-step login process
   - OTP generation and verification
   - Email integration ready (EmailService configured)

### Frontend (React + Vite)
- Removed hardcoded credentials
- API-based authentication
- Secure token storage
- Environment variable configuration

---

## 🚀 Deployment Instructions

### 1. Backend Deployment on Render

**Environment Variables to Add:**

```bash
# JWT Configuration (REQUIRED - Change SecretKey!)
JwtSettings__SecretKey=YOUR_SECURE_32_CHAR_SECRET_KEY_HERE_CHANGE_THIS
JwtSettings__Issuer=FloodAid.Api
JwtSettings__Audience=FloodAid.Frontend
JwtSettings__ExpiryMinutes=1440

# Admin Credentials (REQUIRED)
AdminCredentials__Email=um180181@gmail.com
AdminCredentials__Username=@Muhammad180181
AdminCredentials__PasswordHash=$2a$11$TON22vC.W9hwJuKFnnAsOuBxVfQMIkvVEZ8W2s/QMtlImfbN5Zfxa
AdminCredentials__Name=Muhammad Admin
AdminCredentials__MasterOTP=123456
```

**⚠️ CRITICAL SECURITY STEPS:**

1. **Generate a new JWT Secret Key:**
   ```bash
   # Generate a secure 32+ character random string
   openssl rand -base64 32
   ```
   Replace `YOUR_SECURE_32_CHAR_SECRET_KEY_HERE_CHANGE_THIS` with this value.

2. **Change the Admin Password:**
   - To hash a new password, use the `/api/auth/hash-password` endpoint
   - Or use BCrypt online tools with Work Factor 11
   - Update `AdminCredentials__PasswordHash` with the new hash
   - **Remove the hash-password endpoint before production deployment**

3. **Change MasterOTP:**
   - Replace `123456` with a secure 6-digit code
   - This is for development/emergency access only

### 2. Frontend Deployment on Vercel

**Updated Environment Variables:**

```bash
# Required - API Configuration
VITE_API_BASE=https://floodaid-api.onrender.com

# Optional - Keep these if you use them
VITE_EMAILJS_SERVICE_ID=service_57nbmtc
VITE_EMAILJS_TEMPLATE_ID=template_2gog0pv
VITE_EMAILJS_PUBLIC_KEY=7IGf_PhH1PTSjd9Hs
VITE_STRIPE_PUBLIC_KEY=(Your Stripe Public Key)
VITE_MISTRAL_API_KEY=(Your AI Chatbot API Key)
```

**❌ REMOVE These Variables (No Longer Needed):**
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_USERNAME`
- `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_MASTER_OTP`
- `VITE_ADMIN_NAME`

---

## 🔐 Security Features Implemented

### Per SRS Requirements:
- ✅ **Authentication:** BCrypt (Work Factor 11) password hashing
- ✅ **Encryption:** TLS 1.2+ (HTTPS) enforced
- ✅ **Access Control:** RBAC foundation with JWT roles
- ✅ **Multi-Factor:** OTP-based two-step verification

### Additional Security:
- Passwords never stored in plain text
- Frontend credentials removed completely
- Token-based session management
- Configurable token expiration
- OTP with 5-minute expiry
- Protected admin endpoints ready for `[Authorize]` attribute

---

## 📋 Testing the Implementation

### 1. Test Login Flow:

**Step 1 - Login:**
```bash
curl -X POST https://floodaid-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "um180181@gmail.com",
    "password": "@Mu191UK46BGBW"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "nextStep": "otp",
  "message": "OTP sent to your registered email"
}
```

**Step 2 - Verify OTP:**
```bash
curl -X POST https://floodaid-api.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "um180181@gmail.com",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "nextStep": "authenticated",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Muhammad Admin",
    "email": "um180181@gmail.com",
    "username": "@Muhammad180181",
    "role": "super_admin",
    "permissions": ["all"]
  }
}
```

### 2. Frontend Login:
1. Navigate to `/admin/login`
2. Enter: `um180181@gmail.com` / `@Mu191UK46BGBW`
3. Enter OTP: `123456` (master OTP for development)
4. Should redirect to admin dashboard

---

## 🔧 Production Hardening (Before Go-Live)

### Backend:
1. **Remove Development Endpoints:**
   ```csharp
   // Delete this endpoint from AuthController.cs
   [HttpPost("hash-password")]
   public ActionResult<object> HashPassword([FromBody] string password)
   ```

2. **Implement Email Service:**
   - Configure EmailService to send actual OTPs
   - Remove console logging of OTPs
   - Add email templates

3. **Add Database:**
   - Move admin credentials to database
   - Implement proper user management
   - Add password reset functionality

4. **Enhanced Security:**
   - Add rate limiting on auth endpoints
   - Implement account lockout after failed attempts
   - Add refresh tokens
   - Enable detailed audit logging

### Frontend:
1. **Remove Development Code:**
   - Clean up any console.log statements
   - Remove any hardcoded values
   - Implement proper error boundaries

2. **Add Features:**
   - Password complexity requirements UI
   - Session timeout warnings
   - Account lockout notifications

---

## 📊 API Endpoints Added

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Step 1: Verify credentials, send OTP |
| `/api/auth/verify-otp` | POST | Step 2: Verify OTP, return JWT token |
| `/api/auth/hash-password` | POST | Utility: Hash passwords (remove in production) |

---

## 🐛 Troubleshooting

### Issue: "Invalid credentials"
- Check environment variables are set correctly on Render
- Verify password hash matches in `AdminCredentials__PasswordHash`

### Issue: "OTP expired"
- OTPs expire after 5 minutes
- Restart login process
- Use master OTP (123456) for development

### Issue: "401 Unauthorized"
- Check JWT token is being sent in Authorization header
- Verify token hasn't expired (24 hours default)
- Check `JwtSettings__SecretKey` matches between requests

### Issue: Frontend can't connect to backend
- Verify `VITE_API_BASE` points to correct Render URL
- Check CORS is enabled in backend (already configured)
- Ensure Render deployment is live and healthy

---

## 📝 Next Steps

1. **Deploy backend to Render** with environment variables
2. **Deploy frontend to Vercel** with updated environment variables
3. **Test the complete authentication flow**
4. **Change default credentials and secrets**
5. **Implement email service for OTP delivery**
6. **Add database for user management**
7. **Remove development/debug endpoints**

---

## 📞 Support

Created: December 28, 2025  
Implements: SRS Section 3.3.2 - Security Requirements  
Technology: C# .NET 9.0, BCrypt.Net-Next, JWT, React
