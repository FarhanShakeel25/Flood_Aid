// Admin Credentials Configuration
// WARNING: This is for development only. In production, use environment variables and backend authentication.

export const ADMIN_CREDENTIALS = {
    email: 'um180181@gmail.com',
    username: '@Muhammad180181',
    password: '@Mu191UK46BGBW'
};

// OTP Configuration
export const OTP_CONFIG = {
    length: 6,
    expiryMinutes: 5,
    // For development, you can set a master OTP
    masterOTP: '123456' // This allows login even if the generated OTP is lost
};

// Session Configuration
export const SESSION_CONFIG = {
    tokenPrefix: 'floodaid_',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Admin User Data Template
export const ADMIN_USER_TEMPLATE = {
    id: 1,
    name: 'Muhammad Admin',
    email: 'um180181@gmail.com',
    username: '@Muhammad180181',
    role: 'super_admin',
    permissions: ['all']
};
