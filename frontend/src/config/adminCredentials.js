// Admin Credentials Configuration
// DEPRECATED: This file is no longer used for authentication.
// Authentication is now handled by the backend API.
// This file is kept for backward compatibility only.

export const ADMIN_CREDENTIALS = {
    // These are no longer used - authentication happens via backend
    email: '',
    username: '',
    password: ''
};

// OTP Configuration
export const OTP_CONFIG = {
    length: 6,
    expiryMinutes: 5,
    // Master OTP is now handled by backend for development
    masterOTP: '' 
};

// Session Configuration
export const SESSION_CONFIG = {
    tokenPrefix: 'floodaid_',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Admin User Data Template
// This is populated by the backend API response
export const ADMIN_USER_TEMPLATE = {
    id: 0,
    name: '',
    email: '',
    username: '',
    role: 'super_admin',
    permissions: ['all']
};
