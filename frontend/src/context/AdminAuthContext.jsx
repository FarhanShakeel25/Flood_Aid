// frontend/src/context/AdminAuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE } from '../config/apiBase';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState('login'); // 'login' | 'otp' | 'authenticated'
  const [tempEmail, setTempEmail] = useState(''); // Store email between steps

  useEffect(() => {
    // Check if admin is logged in on mount
    const storedAdmin = localStorage.getItem('floodaid_admin');
    const storedToken = localStorage.getItem('floodaid_token');
    
    if (storedAdmin && storedToken) {
      try {
        setAdmin(JSON.parse(storedAdmin));
        setAuthStep('authenticated');
      } catch (error) {
        localStorage.removeItem('floodaid_admin');
        localStorage.removeItem('floodaid_token');
      }
    }
    setLoading(false);
  }, []);

  // Step 1: Verify Credentials with Backend
  const verifyCredentials = async (identifier, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      if (data.success && data.nextStep === 'otp') {
        setTempEmail(identifier.includes('@') ? identifier : data.email);
        setAuthStep('otp');
        return { success: true, nextStep: 'otp', message: data.message };
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Step 2: Verify OTP with Backend
  const verifyOTP = async (otp) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: tempEmail,
          otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      if (data.success && data.token && data.user) {
        setAdmin(data.user);
        setAuthStep('authenticated');
        localStorage.setItem('floodaid_admin', JSON.stringify(data.user));
        localStorage.setItem('floodaid_token', data.token);
        return { success: true };
      }

      throw new Error('Unexpected response from server');
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
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