// frontend/src/context/AdminAuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ADMIN_CREDENTIALS, OTP_CONFIG, ADMIN_USER_TEMPLATE } from '../config/adminCredentials';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState('login'); // 'login' | 'otp' | 'authenticated'
  const [tempEmail, setTempEmail] = useState(''); // Store email between steps

  useEffect(() => {
    // Check if admin is logged in on mount
    const storedAdmin = localStorage.getItem('floodaid_admin');
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
        setAuthStep('authenticated');
      } catch (error) {
        localStorage.removeItem('floodaid_admin');
      }
    }
    setLoading(false);
  }, []);

  // Step 1: Verify Credentials
  const verifyCredentials = async (identifier, password) => {
    // Use credentials from config file
    const validEmail = ADMIN_CREDENTIALS.email;
    const validUsername = ADMIN_CREDENTIALS.username;
    const validPassword = ADMIN_CREDENTIALS.password;

    const isIdentifierValid = identifier === validEmail || identifier === validUsername;
    const isPasswordValid = password === validPassword;

    if (isIdentifierValid && isPasswordValid) {
      setTempEmail(validEmail); // Always store the email for OTP purposes
      setAuthStep('otp');

      // Generate a mock OTP and log it (simulating email send)
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('floodaid_mock_otp', mockOtp);

      console.log('==========================================');
      console.log(`🔐 SECURITY ALERT: Your Login OTP is: ${mockOtp}`);
      console.log('==========================================');
      alert(`OTP sent to ${validEmail}. (Test Code: ${mockOtp})`);

      return { success: true, nextStep: 'otp' };
    } else {
      throw new Error('Invalid username/email or password');
    }
  };

  // Step 2: Verify OTP
  const verifyOTP = async (otp) => {
    const validOtp = localStorage.getItem('floodaid_mock_otp');

    if (otp === validOtp || otp === OTP_CONFIG.masterOTP) { // Allow master OTP for dev
      const adminData = {
        ...ADMIN_USER_TEMPLATE,
        loginTime: new Date().toISOString()
      };

      setAdmin(adminData);
      setAuthStep('authenticated');
      localStorage.setItem('floodaid_admin', JSON.stringify(adminData));
      localStorage.setItem('floodaid_token', 'mock_jwt_token_' + Date.now());
      localStorage.removeItem('floodaid_mock_otp'); // Clean up

      return { success: true };
    } else {
      throw new Error('Invalid OTP code');
    }
  };

  const logout = () => {
    setAdmin(null);
    setAuthStep('login');
    setTempEmail('');
    localStorage.removeItem('floodaid_admin');
    localStorage.removeItem('floodaid_token');
  };

  const value = {
    admin,
    loading,
    authStep,
    verifyCredentials,
    verifyOTP,
    login: verifyCredentials, // Backward compatibility
    logout,
    isAuthenticated: !!admin && authStep === 'authenticated'
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};