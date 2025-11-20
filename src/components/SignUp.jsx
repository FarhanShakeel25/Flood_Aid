import React, { useState } from 'react';
import SocialLogin from './SocialLogin';
import { countries } from '../utils/countries';
import { securityQuestions } from '../utils/validation';
import Select from 'react-select'; // ← ADD THIS LINE

const SignUp = ({ onSubmit, isAnimating }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: '+1',
    dateOfBirth: '',
    gender: '',
    country: '',
    address: '',
    postalCode: '',
    securityQuestion: '',
    securityAnswer: '',
    termsAccepted: false,
    privacyAccepted: false,
    marketingOptIn: false,
    captchaVerified: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: '', score: 0 };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'weak', score };
    if (score <= 3) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const validateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

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

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!validateAge(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'You must be at least 18 years old';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.country) {
      newErrors.country = 'Please select your country';
    }

    if (!formData.securityQuestion) {
      newErrors.securityQuestion = 'Please select a security question';
    }

    if (!formData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms & Conditions';
    }

    if (!formData.privacyAccepted) {
      newErrors.privacyAccepted = 'You must accept the Privacy Policy';
    }

    if (!formData.captchaVerified) {
      newErrors.captcha = 'Please verify you are not a robot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
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

  const passwordStrength = getPasswordStrength();

  return (
    <form onSubmit={handleSubmit} className="auth-form signup-form">
      {/* Full Name */}
      <div className="form-group">
        <label htmlFor="fullName">
          Full Name <span className="required">*</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">👤</span>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className={errors.fullName ? 'error' : ''}
            disabled={isAnimating}
            autoComplete="name"
          />
        </div>
        {errors.fullName && <span className="error-message">{errors.fullName}</span>}
      </div>

      {/* Username */}
      <div className="form-group">
        <label htmlFor="username">
          Username <span className="optional">(Optional)</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">@</span>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="johndoe123"
            disabled={isAnimating}
            autoComplete="username"
          />
        </div>
      </div>

      {/* Email */}
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

      {/* Phone Number with Country Code */}
      {/* Phone Number with Searchable Country Code */}
<div className="form-group">
  <label htmlFor="phone">
    Phone Number <span className="required">*</span>
  </label>
  <div className="phone-input-group">
    <Select
      className="country-code-select-searchable"
      classNamePrefix="select"
      options={countries.map(country => ({
        value: country.phoneCode,
        label: `${country.flag} ${country.phoneCode}`,
        searchLabel: `${country.name} ${country.phoneCode}`
      }))}
      value={{
        value: formData.countryCode,
        label: countries.find(c => c.phoneCode === formData.countryCode)
          ? `${countries.find(c => c.phoneCode === formData.countryCode).flag} ${formData.countryCode}`
          : '🇺🇸 +1'
      }}
      onChange={(selected) => {
        setFormData(prev => ({
          ...prev,
          countryCode: selected.value
        }));
      }}
      isSearchable={true}
      placeholder="Search country code..."
      isDisabled={isAnimating}
      styles={{
        control: (base) => ({
          ...base,
          minWidth: '140px',
          borderColor: errors.phone ? '#fc8181' : '#e2e8f0',
          borderWidth: '2px',
          borderRadius: '12px',
          fontSize: '15px'
        }),
        menu: (base) => ({
          ...base,
          zIndex: 100
        })
      }}
      filterOption={(option, inputValue) => {
        return option.data.searchLabel.toLowerCase().includes(inputValue.toLowerCase());
      }}
    />
    <input
      type="tel"
      id="phone"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      placeholder="555-0123"
      className={errors.phone ? 'error' : ''}
      disabled={isAnimating}
      autoComplete="tel"
    />
  </div>
  {errors.phone && <span className="error-message">{errors.phone}</span>}
</div>

      {/* Password with Strength Meter */}
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
            placeholder="Enter a strong password"
            className={errors.password ? 'error' : ''}
            disabled={isAnimating}
            autoComplete="new-password"
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
        
        {formData.password && (
          <div className={`password-strength ${passwordStrength.strength}`}>
            <div className="strength-bars">
              {[1, 2, 3, 4, 5].map(bar => (
                <div 
                  key={bar}
                  className={`strength-bar ${bar <= passwordStrength.score ? 'active' : ''}`}
                />
              ))}
            </div>
            <span className="strength-text">
              Password Strength: <strong>{passwordStrength.strength || 'None'}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="form-group">
        <label htmlFor="confirmPassword">
          Confirm Password <span className="required">*</span>
        </label>
        <div className="input-wrapper password-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className={errors.confirmPassword ? 'error' : ''}
            disabled={isAnimating}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
      </div>

      {/* Date of Birth */}
      <div className="form-group">
        <label htmlFor="dateOfBirth">
          Date of Birth <span className="required">*</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">📅</span>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            className={errors.dateOfBirth ? 'error' : ''}
            disabled={isAnimating}
          />
        </div>
        {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
        <span className="field-hint">You must be at least 18 years old</span>
      </div>

      {/* Gender */}
      <div className="form-group">
        <label htmlFor="gender">
          Gender <span className="required">*</span>
        </label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="gender"
              value="male"
              checked={formData.gender === 'male'}
              onChange={handleChange}
              disabled={isAnimating}
            />
            <span>Male</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="gender"
              value="female"
              checked={formData.gender === 'female'}
              onChange={handleChange}
              disabled={isAnimating}
            />
            <span>Female</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="gender"
              value="other"
              checked={formData.gender === 'other'}
              onChange={handleChange}
              disabled={isAnimating}
            />
            <span>Other</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="gender"
              value="prefer-not-to-say"
              checked={formData.gender === 'prefer-not-to-say'}
              onChange={handleChange}
              disabled={isAnimating}
            />
            <span>Prefer not to say</span>
          </label>
        </div>
        {errors.gender && <span className="error-message">{errors.gender}</span>}
      </div>

      {/* Country */}
      {/* Country - Searchable */}
<div className="form-group">
  <label htmlFor="country">
    Country/Region <span className="required">*</span>
  </label>
  <Select
    className="country-select-searchable"
    classNamePrefix="select"
    options={countries.map(country => ({
      value: country.code,
      label: `${country.flag} ${country.name}`,
      searchLabel: country.name
    }))}
    value={formData.country ? {
      value: formData.country,
      label: countries.find(c => c.code === formData.country)
        ? `${countries.find(c => c.code === formData.country).flag} ${countries.find(c => c.code === formData.country).name}`
        : ''
    } : null}
    onChange={(selected) => {
      setFormData(prev => ({
        ...prev,
        country: selected.value
      }));
      if (errors.country) {
        setErrors(prev => ({ ...prev, country: '' }));
      }
    }}
    isSearchable={true}
    placeholder="🔍 Search and select your country..."
    isDisabled={isAnimating}
    styles={{
      control: (base, state) => ({
        ...base,
        borderColor: errors.country ? '#fc8181' : (state.isFocused ? '#667eea' : '#e2e8f0'),
        borderWidth: '2px',
        borderRadius: '12px',
        padding: '6px',
        fontSize: '15px',
        boxShadow: state.isFocused ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
        '&:hover': {
          borderColor: state.isFocused ? '#667eea' : '#cbd5e0'
        }
      }),
      menu: (base) => ({
        ...base,
        zIndex: 100,
        borderRadius: '12px',
        marginTop: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#667eea' : (state.isFocused ? '#f0f4ff' : 'white'),
        color: state.isSelected ? 'white' : '#2d3748',
        padding: '12px 16px',
        cursor: 'pointer',
        fontSize: '15px'
      }),
      placeholder: (base) => ({
        ...base,
        color: '#a0aec0'
      })
    }}
    filterOption={(option, inputValue) => {
      return option.data.searchLabel.toLowerCase().includes(inputValue.toLowerCase());
    }}
  />
  {errors.country && <span className="error-message">{errors.country}</span>}
</div>

      {/* Address */}
      <div className="form-group">
        <label htmlFor="address">
          Street Address <span className="optional">(Optional)</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">🏠</span>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main Street, Apt 4B"
            disabled={isAnimating}
            autoComplete="street-address"
          />
        </div>
      </div>

      {/* Postal Code */}
      <div className="form-group">
        <label htmlFor="postalCode">
          Postal/ZIP Code <span className="optional">(Optional)</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">📮</span>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="12345"
            disabled={isAnimating}
            autoComplete="postal-code"
          />
        </div>
      </div>

      {/* Security Question */}
      <div className="form-group">
        <label htmlFor="securityQuestion">
          Security Question <span className="required">*</span>
        </label>
        <div className="input-wrapper">
          <span className="input-icon">❓</span>
          <select
            id="securityQuestion"
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            className={errors.securityQuestion ? 'error' : ''}
            disabled={isAnimating}
          >
            <option value="">Select a security question</option>
            {securityQuestions.map((question, index) => (
              <option key={index} value={question}>
                {question}
              </option>
            ))}
          </select>
        </div>
        {errors.securityQuestion && <span className="error-message">{errors.securityQuestion}</span>}
      </div>

      {/* Security Answer */}
      {formData.securityQuestion && (
        <div className="form-group">
          <label htmlFor="securityAnswer">
            Security Answer <span className="required">*</span>
          </label>
          <div className="input-wrapper">
            <span className="input-icon">💬</span>
            <input
              type="text"
              id="securityAnswer"
              name="securityAnswer"
              value={formData.securityAnswer}
              onChange={handleChange}
              placeholder="Your answer"
              className={errors.securityAnswer ? 'error' : ''}
              disabled={isAnimating}
            />
          </div>
          {errors.securityAnswer && <span className="error-message">{errors.securityAnswer}</span>}
        </div>
      )}

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

      {/* Terms & Conditions */}
      <div className="form-group">
        <label className={`checkbox-label ${errors.termsAccepted ? 'error-label' : ''}`}>
          <input
            type="checkbox"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            disabled={isAnimating}
          />
          <span>
            I agree to the <a href="#terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> <span className="required">*</span>
          </span>
        </label>
        {errors.termsAccepted && <span className="error-message">{errors.termsAccepted}</span>}
      </div>

      {/* Privacy Policy */}
      <div className="form-group">
        <label className={`checkbox-label ${errors.privacyAccepted ? 'error-label' : ''}`}>
          <input
            type="checkbox"
            name="privacyAccepted"
            checked={formData.privacyAccepted}
            onChange={handleChange}
            disabled={isAnimating}
          />
          <span>
            I agree to the <a href="#privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> <span className="required">*</span>
          </span>
        </label>
        {errors.privacyAccepted && <span className="error-message">{errors.privacyAccepted}</span>}
      </div>

      {/* Marketing Opt-in */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="marketingOptIn"
            checked={formData.marketingOptIn}
            onChange={handleChange}
            disabled={isAnimating}
          />
          <span>Send me updates, tips, and promotional emails <span className="optional">(Optional)</span></span>
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
          <>🚁 Create Account & Request Aid</>
        )}
      </button>

      {/* Social Sign Up */}
      <SocialLogin disabled={isAnimating} isSignUp={true} />
    </form>
  );
};

export default SignUp;