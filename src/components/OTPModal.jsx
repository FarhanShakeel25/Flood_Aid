import React, { useState, useEffect, useRef } from 'react';

const OTPModal = ({ email, phone, countryCode, onSendOTP, onVerifyOTP, onVerified, onClose }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0 && otpSent) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, otpSent]);

  // Focus first input when OTP is sent
  useEffect(() => {
    if (otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [otpSent]);

  // Handle initial OTP send when method is selected
  const handleInitialSend = async (method) => {
    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    const result = await onSendOTP(method);
    
    setIsSending(false);
    
    if (result.success) {
      setOtpSent(true);
      setTimer(60);
      setCanResend(false);
      setSuccessMessage(result.message);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (newOtp.every(digit => digit !== '') && !isVerifying) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
    
    if (newOtp.length === 6) {
      verifyOTP(pastedData);
    }
  };

  const verifyOTP = (code) => {
    setIsVerifying(true);
    setErrorMessage('');
    
    setTimeout(() => {
      const result = onVerifyOTP(code, verificationMethod);
      
      if (result.valid) {
        console.log('✅ OTP verified successfully!');
        setIsVerifying(false);
        setSuccessMessage(result.message);
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        console.log('❌ Invalid OTP');
        setIsVerifying(false);
        setErrorMessage(result.message);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 1000);
  };

  const handleResend = async () => {
    if (!canResend || isSending) return;
    
    setIsSending(true);
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
    setSuccessMessage('');
    
    const result = await onSendOTP(verificationMethod);
    
    setIsSending(false);
    
    if (result.success) {
      setTimer(60);
      setCanResend(false);
      setSuccessMessage('OTP resent successfully!');
      inputRefs.current[0]?.focus();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleMethodChange = async (method) => {
    setVerificationMethod(method);
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
    setSuccessMessage('');
    setOtpSent(false);
    
    // Send OTP via new method
    await handleInitialSend(method);
  };

  return (
    <div className="modal-overlay">
      <div className="otp-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        
        <div className="otp-header">
          <div className="otp-icon">🔐</div>
          <h2>Verify Your Identity</h2>
          <p>
            Choose how you want to receive your verification code
          </p>
        </div>

        {/* Verification Method Selector */}
        <div className="verification-method">
          <button
            className={`method-btn ${verificationMethod === 'email' ? 'active' : ''}`}
            onClick={() => handleMethodChange('email')}
            disabled={isSending || isVerifying}
          >
            📧 Email
          </button>
          <button
            className={`method-btn ${verificationMethod === 'sms' ? 'active' : ''}`}
            onClick={() => handleMethodChange('sms')}
            disabled={isSending || isVerifying}
          >
            📱 SMS
          </button>
        </div>

        <div className="otp-destination">
          {verificationMethod === 'email' ? (
            <span>📧 {email}</span>
          ) : (
            <span>📱 {countryCode} {phone}</span>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="otp-success">
            ✅ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="otp-error">
            ❌ {errorMessage}
          </div>
        )}

        {/* Sending Status */}
        {isSending && (
          <div className="verification-status">
            <span className="spinner-small"></span>
            <span>Sending OTP...</span>
          </div>
        )}

        {/* OTP Input Fields (only show after OTP is sent) */}
        {otpSent && (
          <>
            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`otp-input ${digit ? 'filled' : ''} ${errorMessage ? 'error' : ''}`}
                  disabled={isVerifying || isSending}
                />
              ))}
            </div>

            {/* Verification Status */}
            {isVerifying && (
              <div className="verification-status">
                <span className="spinner-small"></span>
                <span>Verifying...</span>
              </div>
            )}

            {/* Timer and Resend */}
            <div className="otp-footer">
              {!canResend ? (
                <p className="timer-text">
                  Resend code in <strong>{timer}s</strong>
                </p>
              ) : (
                <button 
                  className="resend-btn" 
                  onClick={handleResend}
                  disabled={isVerifying || isSending}
                >
                  🔄 Resend Code
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="otp-help">
              <p>Didn't receive the code?</p>
              <ul>
                <li>Check your spam/junk folder (for email)</li>
                <li>Verify your {verificationMethod === 'email' ? 'email address' : 'phone number'}</li>
                <li>Try switching to {verificationMethod === 'email' ? 'SMS' : 'Email'}</li>
                <li>Wait and click "Resend Code"</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OTPModal;