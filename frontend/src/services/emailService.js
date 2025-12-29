import axios from 'axios';
import { EMAILJS_CONFIG } from '../config/emailConfig';

/**
 * Sends an OTP email using EmailJS Direct API
 * @param {string} toEmail - Recipient email
 * @param {string} toName - Recipient name
 * @param {string} otpCode - The 6-digit OTP code
 */
export const sendOTPEmail = async (toEmail, toName, otpCode) => {
    const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn('⚠️ EmailJS credentials missing. Mocking email send.');
        return { success: true, mocked: true };
    }

    // Calculate expiry time (5 minutes from now) for the template
    const expiryTime = new Date(Date.now() + 5 * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    try {
        const payload = {
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: PUBLIC_KEY,
            template_params: {
                to_name: toName,
                email: toEmail, // Matches user's {{email}} field
                to_email: toEmail, // Backup
                cc_email: 'mustaqeem.uet@gmail.com, 24cs.se.secb@gmail.com', // CC recipients
                passcode: otpCode,
                time: expiryTime
            }
        };

        console.log('--- EmailJS Request Debug ---');
        console.log('Sending to:', toEmail);
        console.log('Payload:', payload);

        const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', payload);

        console.log('✅ EmailJS Response:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        // Log the SPECIFIC response data from EmailJS (crucial for 422 errors)
        const errorData = error.response?.data;
        console.error('❌ EmailJS Send Error Detailed:', {
            status: error.response?.status,
            data: errorData,
            message: error.message
        });

        // If it's a string like "The user_id is required", it helps debugging
        const errorMessage = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        throw new Error(`EmailJS Error: ${errorMessage || error.message}`);
    }
};
