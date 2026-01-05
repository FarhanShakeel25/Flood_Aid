import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Check, AlertCircle, Loader } from 'lucide-react';
import { API_BASE } from '../config/apiBase';

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [invitationInfo, setInvitationInfo] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link. Token is missing.');
        }
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!formData.phoneNumber.trim()) {
            setError('Please enter your phone number');
            return;
        }
        if (!formData.password) {
            setError('Please enter a password');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (!/[A-Z]/.test(formData.password)) {
            setError('Password must contain at least one uppercase letter');
            return;
        }
        if (!/[a-z]/.test(formData.password)) {
            setError('Password must contain at least one lowercase letter');
            return;
        }
        if (!/[0-9]/.test(formData.password)) {
            setError('Password must contain at least one digit');
            return;
        }
        if (!/[^a-zA-Z0-9]/.test(formData.password)) {
            setError('Password must contain at least one special character');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/invitations/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    name: formData.name,
                    phoneNumber: formData.phoneNumber,
                    password: formData.password
                })
            });

            if (!response.ok) {
                let errorMessage = 'Failed to accept invitation';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setInvitationInfo(data);
            setSuccess(true);

            // Redirect based on role
            const redirectPath = data.redirectTo || (data.role === 'ProvinceAdmin' ? '/admin/login' : '/home');
            setTimeout(() => {
                navigate(redirectPath);
            }, 3000);
        } catch (err) {
            console.error('Error accepting invitation:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        animation: 'slideUp 0.3s ease-out'
    };

    const headerStyle = {
        textAlign: 'center',
        marginBottom: '30px'
    };

    const titleStyle = {
        margin: '0 0 12px 0',
        color: '#1f2937',
        fontSize: '28px',
        fontWeight: '700'
    };

    const subtitleStyle = {
        margin: '0',
        color: '#6b7280',
        fontSize: '14px',
        lineHeight: '1.6'
    };

    const formStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '30px'
    };

    const formGroupStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    };

    const labelStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '600',
        color: '#374151',
        fontSize: '14px'
    };

    const inputStyle = {
        padding: '12px 16px',
        border: '1.5px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease',
        backgroundColor: '#f9fafb',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        padding: '12px 24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '10px'
    };

    const errorStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#dc2626',
        fontSize: '14px',
        marginBottom: '20px'
    };

    const successIconStyle = {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px'
    };

    const footerStyle = {
        textAlign: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb'
    };

    const footerTextStyle = {
        margin: '0',
        color: '#9ca3af',
        fontSize: '12px'
    };

    if (!token) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={successIconStyle}>
                        <AlertCircle size={48} color="#dc2626" />
                    </div>
                    <h2 style={titleStyle}>Invalid Invitation Link</h2>
                    <p style={subtitleStyle}>The invitation token is missing or invalid. Please check your email for the correct link.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <div style={successIconStyle}>
                        <Check size={48} color="#10b981" />
                    </div>
                    <h2 style={titleStyle}>Welcome to Flood Aid!</h2>
                    <p style={subtitleStyle}>Your account has been created successfully.</p>
                    <p style={{...subtitleStyle, fontWeight: '600', color: '#667eea', margin: '16px 0'}}>
                        {invitationInfo?.email}
                    </p>
                    <p style={{...subtitleStyle, color: '#9ca3af', fontStyle: 'italic', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb'}}>
                        Redirecting to login page in 3 seconds...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                input:focus {
                    outline: none;
                    border-color: #667eea !important;
                    background-color: white !important;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                input:disabled {
                    background-color: #f3f4f6 !important;
                    color: #9ca3af;
                    cursor: not-allowed;
                }
                button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                }
                button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
            <div style={cardStyle}>
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Complete Your Registration</h1>
                    <p style={subtitleStyle}>You've been invited to join Flood Aid. Please complete your profile to get started.</p>
                </div>

                {error && (
                    <div style={errorStyle}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            <User size={18} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            disabled={loading}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            <Phone size={18} />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your phone number"
                            disabled={loading}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            <Lock size={18} />
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter a password (min. 6 characters)"
                            disabled={loading}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            <Lock size={18} />
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm your password"
                            disabled={loading}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={buttonStyle}
                    >
                        {loading ? 'Creating account...' : 'Complete Registration'}
                    </button>
                </form>

                <div style={footerStyle}>
                    <p style={footerTextStyle}>By registering, you agree to our terms and conditions.</p>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitation;
