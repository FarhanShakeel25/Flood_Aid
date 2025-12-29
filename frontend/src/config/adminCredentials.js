// Admin Credentials Configuration
// Using Vite Environment Variables for security and live deployment (Vercel)
export const ADMIN_CREDENTIALS = {
    email: import.meta.env.VITE_ADMIN_EMAIL || 'um180181@gmail.com',
    username: import.meta.env.VITE_ADMIN_USERNAME || '@Muhammad180181',
    password: import.meta.env.VITE_ADMIN_PASSWORD || '@Mu191UK46BGBW'
};

// OTP Configuration
export const OTP_CONFIG = {
    length: 6,
    expiryMinutes: 5,
    // Master OTP allows login even if the generated OTP is lost
    masterOTP: import.meta.env.VITE_ADMIN_MASTER_OTP || '123456'
};

// Session Configuration
export const SESSION_CONFIG = {
    tokenPrefix: 'floodaid_',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Admin User Data Template
export const ADMIN_USER_TEMPLATE = {
    id: 1,
    name: import.meta.env.VITE_ADMIN_NAME || 'Muhammad Admin',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'um180181@gmail.com',
    username: import.meta.env.VITE_ADMIN_USERNAME || '@Muhammad180181',
    role: 'super_admin',
    permissions: ['all']
};
