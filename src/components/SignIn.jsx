import React, { useState } from 'react';
import SocialLogin from './SocialLogin';

const SignIn = ({ onSubmit, isAnimating }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    trustDevice: false,
    captchaVerified: false,
    mfaEnabled: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [accountLocked, setAccountLocked] = useState(false);
  const [sessionExpiring, setSessionExpiring] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.captchaVerified) {
      newErrors.captcha = 'Please verify you are not a robot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (accountLocked) {
      alert('⚠️ Account is locked due to multiple failed login attempts. Please reset your password.');
      return;
    }

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCaptchaChange = () => {
    setFormData(prev => ({ ...prev, captchaVerified: !prev.captchaVerified }));
    if (errors.captcha) {
      setErrors(prev => ({ ...prev, captcha: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {/* Account Locked Notice */}
      {accountLocked && (
        <div className="alert alert-error">
          <span className="alert-icon">🔒</span>
          <div>
            <strong>Account Locked</strong>
            <p>Your account has been locked due to multiple failed login attempts. Please reset your password.</p>
          </div>
        </div>
      )}

      {/* Session Expiration Info */}
      {sessionExpiring && (
        <div className="alert alert-warning">
          <span className="alert-icon">⏰</span>
          <div>
            <strong>Session Expiring Soon</strong>
            <p>Your session will expire in 5 minutes. Please save your work.</p>
          </div>
        </div>
      )}

      {/* Email/Username Field */}
      <div className="form-group">
        <label htmlFor="email">
          Email Address <span className="required">*</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">📧</span>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            className={errors.email ? 'error' : ''}
            disabled={isAnimating}
            autoComplete="email"
          />
        </div>
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      {/* Password Field with Show/Hide */}
      <div className="form-group">
        <label htmlFor="password">
          Password <span className="required">*</span>
        </label>
        <div className="input-wrapper password-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={errors.password ? 'error' : ''}
            disabled={isAnimating}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.password && <span className="error-message">{errors.password}</span>}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={isAnimating}
          />
          <span>Remember Me</span>
        </label>
        <a href="#forgot-password" className="forgot-link">Forgot Password?</a>
      </div>

      {/* Device Trust Option */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="trustDevice"
            checked={formData.trustDevice}
            onChange={handleChange}
            disabled={isAnimating}
          />
          <span>Trust this device (Skip MFA for 30 days)</span>
        </label>
      </div>

      {/* CAPTCHA */}
      <div className="form-group">
        <div className="captcha-box">
          <label className="checkbox-label captcha-checkbox">
            <input
              type="checkbox"
              checked={formData.captchaVerified}
              onChange={handleCaptchaChange}
              disabled={isAnimating}
            />
            <span>I'm not a robot</span>
          </label>
          <div className="captcha-logo">
            <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="reCAPTCHA" />
          </div>
        </div>
        {errors.captcha && <span className="error-message">{errors.captcha}</span>}
      </div>

      {/* MFA Option */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="mfaEnabled"
            checked={formData.mfaEnabled}
            onChange={handleChange}
            disabled={isAnimating}
          />
          <span>Enable Multi-Factor Authentication (Recommended)</span>
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className={`submit-btn ${isAnimating ? 'loading' : ''}`}
        disabled={isAnimating}
      >
        {isAnimating ? (
          <>
            <span className="spinner"></span>
            Rescue in Progress...
          </>
        ) : (
          <>🚁 Sign In</>
        )}
      </button>

      {/* Social Login */}
      <SocialLogin disabled={isAnimating} />

      {/* Session Info */}
      <div className="session-info">
        <span className="info-icon">ℹ️</span>
        <p>Your session will remain active for 30 minutes of inactivity</p>
      </div>
    </form>
  );
};

export default SignIn;