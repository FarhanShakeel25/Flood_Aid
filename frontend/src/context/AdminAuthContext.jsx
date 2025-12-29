// frontend/src/context/AdminAuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ADMIN_CREDENTIALS, OTP_CONFIG, ADMIN_USER_TEMPLATE } from '../config/adminCredentials';
import { sendOTPEmail } from '../services/emailService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState('login'); // 'login' | 'otp' | 'authenticated'
  const [tempEmail, setTempEmail] = useState(''); // Store email between steps
  const [tempName, setTempName] = useState(''); // Store name for EmailJS

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
    // Check for custom credentials in localStorage (overrides)
    const storedEmail = localStorage.getItem('floodaid_admin_email') || ADMIN_CREDENTIALS.email;
    const storedUsername = localStorage.getItem('floodaid_admin_username') || ADMIN_CREDENTIALS.username;
    const validPassword = localStorage.getItem('floodaid_admin_password') || ADMIN_CREDENTIALS.password;

    const isIdentifierValid = identifier === storedEmail || identifier === storedUsername;
    const isPasswordValid = password === validPassword;

    if (isIdentifierValid && isPasswordValid) {
      // Get current admin name if exists, else template
      const currentName = admin?.name || ADMIN_USER_TEMPLATE.name;

      setTempEmail(storedEmail);
      setTempName(currentName);
      setAuthStep('otp');

      // Generate a mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('floodaid_mock_otp', otp);

      // Send real email
      try {
        await sendOTPEmail(storedEmail, currentName, otp);
        console.log('📧 OTP Sent via EmailJS.');
      } catch (error) {
        console.warn('⚠️ Email sending failed, check EmailJS config or fallback to console.');
        console.log('Generated OTP:', otp);
      }

      return { success: true, nextStep: 'otp' };
    } else {
      throw new Error('Invalid username/email or password');
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!tempEmail) return;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('floodaid_mock_otp', otp);

    try {
      await sendOTPEmail(tempEmail, tempName, otp);
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Resend failed, OTP logged to console.');
      console.log('Resent OTP:', otp);
      throw error;
    }
  };

  // Step 2: Verify OTP
  const verifyOTP = async (otp) => {
    const validOtp = localStorage.getItem('floodaid_mock_otp');

    if (otp === validOtp || otp === OTP_CONFIG.masterOTP) {
      // Load any existing profile data or use template
      const existingData = localStorage.getItem('floodaid_admin');
      let adminData;

      if (existingData) {
        adminData = JSON.parse(existingData);
      } else {
        adminData = {
          ...ADMIN_USER_TEMPLATE,
          email: localStorage.getItem('floodaid_admin_email') || ADMIN_CREDENTIALS.email,
          username: localStorage.getItem('floodaid_admin_username') || ADMIN_CREDENTIALS.username,
        };
      }

      adminData.loginTime = new Date().toISOString();

      setAdmin(adminData);
      setAuthStep('authenticated');
      localStorage.setItem('floodaid_admin', JSON.stringify(adminData));
      localStorage.setItem('floodaid_token', 'mock_jwt_token_' + Date.now());
      localStorage.removeItem('floodaid_mock_otp');

      return { success: true };
    } else {
      throw new Error('Invalid OTP code');
    }
  };

  const updateProfile = (newData) => {
    setAdmin(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('floodaid_admin', JSON.stringify(updated));
      // Also update standalone fields for credential matching
      if (newData.email) localStorage.setItem('floodaid_admin_email', newData.email);
      if (newData.username) localStorage.setItem('floodaid_admin_username', newData.username);
      return updated;
    });
  };

  const logout = () => {
    setAdmin(null);
    setAuthStep('login');
    setTempEmail('');
    setTempName('');
    localStorage.removeItem('floodaid_admin');
    localStorage.removeItem('floodaid_token');
  };

  const value = {
    admin,
    loading,
    authStep,
    verifyCredentials,
    verifyOTP,
    resendOTP,
    updateProfile,
    login: verifyCredentials,
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