import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/AdminLogin.css';

function AdminLogin() {
    const { verifyCredentials, verifyOTP, resendOTP, authStep, isAuthenticated } = useAdminAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin');
        }
    }, [isAuthenticated, navigate]);

    // Handle resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyCredentials(email, password);
            // next step is handled by context state change
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOTP(otp);
            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setLoading(true);
        try {
            await resendOTP();
            setResendCooldown(60); // 60 seconds cooldown
            alert('A new OTP has been sent to your email.');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            {/* Background Ambience */}
            <div className="login-bg-shape shape-1"></div>
            <div className="login-bg-shape shape-2"></div>

            <div className="login-card">
                {/* Header */}
                <div className="login-header">
                    <div className="login-icon">🌊</div>
                    <h1 className="login-title">Admin Access</h1>
                    <p className="login-subtitle">
                        {authStep === 'login'
                            ? 'Secure Administrative Gateway'
                            : 'Two-Factor Authentication'}
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* STEP 1: LOGIN */}
                {authStep === 'login' && (
                    <form onSubmit={handleCredentialsSubmit} className="login-form step-enter">
                        <div className="form-group">
                            <label className="form-label" htmlFor="identifier">Email or Username</label>
                            <input
                                id="identifier"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="um180181@gmail.com"
                                required
                                className="form-input"
                                autoFocus
                                enterKeyHint="next"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Security Key</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    className="form-input"
                                    enterKeyHint="go"
                                    style={{
                                        paddingRight: '45px',
                                        letterSpacing: showPassword ? 'normal' : '0.1rem'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '4px'
                                    }}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Verifying Credentials...' : 'Authenticate →'}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP */}
                {authStep === 'otp' && (
                    <form onSubmit={handleOtpSubmit} className="login-form step-enter">
                        <div className="otp-container">
                            <p className="otp-text">
                                An authentication code has been sent to <strong>{email}</strong>.
                            </p>
                            {/* Information removed for security */}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="otp">One-Time Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="otp"
                                    type={showOtp ? 'text' : 'password'}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="••••••"
                                    required
                                    className="form-input"
                                    maxLength={6}
                                    autoFocus
                                    enterKeyHint="done"
                                    style={{
                                        letterSpacing: showOtp ? '0.3rem' : '0.2rem',
                                        textAlign: 'center',
                                        fontSize: '1.2rem',
                                        paddingRight: '45px',
                                        fontWeight: 600
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(!showOtp)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        padding: '4px'
                                    }}
                                    title={showOtp ? 'Hide OTP' : 'Show OTP'}
                                >
                                    {showOtp ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Verifying OTP...' : 'Verify & Access →'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={loading || resendCooldown > 0}
                            style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                background: 'transparent',
                                color: resendCooldown > 0 ? '#94a3b8' : '#3b82f6',
                                border: `1px solid ${resendCooldown > 0 ? '#e2e8f0' : 'rgba(59, 130, 246, 0.3)'}`,
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => {
                                if (resendCooldown === 0) {
                                    e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.target.style.borderColor = '#3b82f6';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (resendCooldown === 0) {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                }
                            }}
                        >
                            {resendCooldown > 0
                                ? `🔄 Resend in ${resendCooldown}s`
                                : '🔄 Resend OTP'}
                        </button>
                    </form>
                )}

                {/* Footer */}
                <div className="back-link">
                    <Link to="/">
                        ← Return to Platform
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
