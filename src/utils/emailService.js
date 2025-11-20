// src/utils/emailService.js
import emailjs from '@emailjs/browser';

// ============================================
// EMAILJS CONFIGURATION
// ============================================
// Get these from https://www.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_mmqmrz8';
const EMAILJS_TEMPLATE_ID = 'template_vngtvo4';
const EMAILJS_PUBLIC_KEY = 'hVUJnO-CsQKX03FWQ';
if (EMAILJS_PUBLIC_KEY !== 'hVUJnO-CsQKX03FWQ') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP temporarily (in production, use backend/database)
let storedOTPs = {};

export const storeOTP = (identifier, otp) => {
  storedOTPs[identifier] = {
    otp,
    timestamp: Date.now(),
    expiresIn: 10 * 60 * 1000 // 10 minutes
  };
  console.log('🔐 OTP stored:', { identifier, otp });
};

export const verifyStoredOTP = (identifier, inputOTP) => {
  const stored = storedOTPs[identifier];
  
  if (!stored) {
    return { valid: false, message: 'OTP not found. Please request a new one.' };
  }
  
  // Check expiration
  if (Date.now() - stored.timestamp > stored.expiresIn) {
    delete storedOTPs[identifier];
    return { valid: false, message: 'OTP expired. Please request a new one.' };
  }
  
  // Check if OTP matches
  if (stored.otp === inputOTP) {
    delete storedOTPs[identifier]; // Remove after successful verification
    return { valid: true, message: 'OTP verified successfully!' };
  }
  
  return { valid: false, message: 'Invalid OTP. Please try again.' };
};

// ============================================
// EMAIL OTP SENDING
// ============================================

export const sendOTPEmail = async (email, otp) => {
  try {
    console.log('📧 Sending OTP to email:', email);
    
    const now = new Date();
    
    // Format: 2025-11-20 13:36:54 (UTC)
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    
    // Format: November 20, 2025
    const readableDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format: 1:36 PM
    const readableTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const templateParams = {
      to_email: email,
      to_name: email.split('@')[0],
      otp_code: otp,
      expiry_minutes: '10',
      timestamp: timestamp,                    // 2025-11-20 13:36:54
      readable_date: readableDate,             // November 20, 2025
      readable_time: readableTime,             // 1:36 PM
      year: now.getFullYear().toString(),      // 2025
      timezone: 'UTC',
      user_login: '2024cs480-cyberon'          // ← ADD THIS LINE
    };

    console.log('📦 Sending email with params:', templateParams);

    // Send email with public key as 4th parameter
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent successfully!');
    storeOTP(email, otp);
    
    return { 
      success: true, 
      message: `OTP sent to ${email}` 
    };
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    storeOTP(email, otp);
    
    return { 
      success: false, 
      message: 'Email service error. Check console for OTP (dev mode).',
      devOTP: otp
    };
  }
};

// ============================================
// SMS OTP SENDING (PLACEHOLDER)
// ============================================

export const sendOTPSMS = async (phone, countryCode, otp) => {
  try {
    console.log('📱 Sending OTP to phone:', `${countryCode}${phone}`);
    
    // Format phone number with country code
    const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;
    
    // For development/testing without actual SMS service
    console.log('📱 Dev Mode - OTP for', fullPhoneNumber, ':', otp);
    
    storeOTP(fullPhoneNumber, otp);
    
    return {
      success: true,
      message: `OTP sent to ${fullPhoneNumber} (Dev Mode)`,
      devOTP: otp,
      devMode: true
    };
    
    // TO USE TWILIO (uncomment and configure):
    /*
    const twilio = require('twilio');
    const TWILIO_ACCOUNT_SID = 'YOUR_ACCOUNT_SID';
    const TWILIO_AUTH_TOKEN = 'YOUR_AUTH_TOKEN';
    const TWILIO_PHONE = 'YOUR_TWILIO_PHONE';
    
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    const message = await client.messages.create({
      body: `Your Flood Aid verification code is: ${otp}. Valid for 10 minutes.`,
      from: TWILIO_PHONE,
      to: fullPhoneNumber
    });
    
    console.log('✅ SMS sent:', message.sid);
    storeOTP(fullPhoneNumber, otp);
    
    return {
      success: true,
      message: `OTP sent to ${fullPhoneNumber}`
    };
    */
    
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    
    const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;
    storeOTP(fullPhoneNumber, otp);
    
    return {
      success: false,
      message: 'SMS service error. Check console for OTP (dev mode).',
      devOTP: otp
    };
  }
};

// ============================================
// UNIFIED SEND OTP FUNCTION
// ============================================

export const sendOTP = async (method, email, phone, countryCode) => {
  const otp = generateOTP();
  
  if (method === 'email') {
    return await sendOTPEmail(email, otp);
  } else if (method === 'sms') {
    return await sendOTPSMS(phone, countryCode, otp);
  } else {
    return {
      success: false,
      message: 'Invalid verification method'
    };
  }
};