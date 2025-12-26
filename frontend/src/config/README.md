# Admin Credentials Configuration

## File Location
`frontend/src/config/adminCredentials.js`

## Purpose
This file stores admin authentication credentials separately from the main code for better security and maintainability.

## Current Credentials

**Email:** `um180181@gmail.com`  
**Username:** `@Muhammad180181`  
**Password:** `@Mu191UK46BGBW`  
**Master OTP:** `123456` (for development/testing)

## Where It's Used

This configuration file is imported and used in:

1. **`frontend/src/context/AdminAuthContext.jsx`**
   - Line 3: Import statement
   - Line 29-31: Credential validation in `verifyCredentials()` function
   - Line 61: Master OTP check in `verifyOTP()` function
   - Line 63-68: Admin user data template

## Security Notes

⚠️ **IMPORTANT FOR PRODUCTION:**

1. **Never commit this file to Git** - Add to `.gitignore`:
   ```
   src/config/adminCredentials.js
   ```

2. **Use Environment Variables** - In production, move these to `.env`:
   ```
   VITE_ADMIN_EMAIL=um180181@gmail.com
   VITE_ADMIN_USERNAME=@Muhammad180181
   VITE_ADMIN_PASSWORD=hashed_password_here
   ```

3. **Backend Authentication** - Replace this with proper backend API authentication:
   - Hash passwords (bcrypt)
   - Use JWT tokens
   - Implement proper session management
   - Send OTP via email service (SendGrid, AWS SES, etc.)

## How to Update Credentials

1. Open `frontend/src/config/adminCredentials.js`
2. Modify the `ADMIN_CREDENTIALS` object
3. Save the file
4. Restart the dev server (`npm run dev`)

## Migration to Backend

When you're ready to implement backend authentication:

1. Create backend API endpoints:
   - `POST /api/auth/login` - Verify credentials
   - `POST /api/auth/verify-otp` - Verify OTP
   - `POST /api/auth/resend-otp` - Resend OTP
   - `POST /api/auth/logout` - Logout

2. Update `AdminAuthContext.jsx` to call these APIs instead of using local credentials

3. Remove or comment out the `adminCredentials.js` file
