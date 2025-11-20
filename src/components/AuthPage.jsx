import React, { useState } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import RescueAnimation from './RescueAnimation';
import OTPModal from './OTPModal';
import { sendOTP, verifyStoredOTP } from '../utils/emailService';
import './AuthPage.css';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpData, setOtpData] = useState({ 
    email: '', 
    phone: '', 
    countryCode: '',
    method: 'email' 
  });

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
  };

  const handleSubmit = async (formData) => {
    console.log('Form submitted:', formData);
    
    // Start rescue animation
    setIsAnimating(true);
    
    // Wait for animation to complete, then show OTP modal
    setTimeout(() => {
      setOtpData({
        email: formData.email,
        phone: formData.phone || '',
        countryCode: formData.countryCode || '+1',
        method: 'email' // Default method
      });
      setShowOTPModal(true);
    }, 10000); // 10 seconds animation
  };

  const handleSendOTP = async (method) => {
    console.log('📤 Sending OTP via:', method);
    
    const result = await sendOTP(
      method,
      otpData.email,
      otpData.phone,
      otpData.countryCode
    );
    
    console.log('📬 Send result:', result);
    
    if (result.success) {
      let message = `✅ ${result.message}`;
      if (result.devMode) {
        message += `\n\n🔍 DEV MODE\nYour OTP: ${result.devOTP}`;
      }
      alert(message);
    } else {
      alert(`⚠️ ${result.message}`);
    }
    
    // Show OTP in console for development
    if (result.devOTP) {
      console.log('🔐 Your OTP:', result.devOTP);
    }
    
    return result;
  };

  const handleVerifyOTP = (inputOTP, method) => {
    const identifier = method === 'email' 
      ? otpData.email 
      : `${otpData.countryCode}${otpData.phone.replace(/\D/g, '')}`;
    
    const result = verifyStoredOTP(identifier, inputOTP);
    console.log('🔍 Verification result:', result);
    
    return result;
  };

  const handleOTPVerified = () => {
    setShowOTPModal(false);
    setIsAnimating(false);
    alert('✅ Account verified successfully! Welcome to Flood Aid Management System. 🌊');
  };

  return (
    <div className="auth-container">
      <RescueAnimation isAnimating={isAnimating} />
      
      {/* Auth card with fade-out animation */}
      <div className={`auth-card ${isAnimating ? 'fade-out' : ''}`}>
        <div className="auth-header">
          <h1>🌊 Flood Aid Management System</h1>
          <p className="auth-subtitle">
            {isSignUp ? 'Create an account to request or provide aid' : 'Welcome back! Sign in to continue'}
          </p>
        </div>

        {isSignUp ? (
          <SignUp onSubmit={handleSubmit} isAnimating={isAnimating} />
        ) : (
          <SignIn onSubmit={handleSubmit} isAnimating={isAnimating} />
        )}

        <div className="auth-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={handleToggle} className="toggle-btn" disabled={isAnimating}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {showOTPModal && (
        <OTPModal
          email={otpData.email}
          phone={otpData.phone}
          countryCode={otpData.countryCode}
          onSendOTP={handleSendOTP}
          onVerifyOTP={handleVerifyOTP}
          onVerified={handleOTPVerified}
          onClose={() => {
            setShowOTPModal(false);
            setIsAnimating(false);
          }}
        />
      )}
    </div>
  );
};

export default AuthPage;