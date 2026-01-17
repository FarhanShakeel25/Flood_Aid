import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userLogin } from '../services/userApi';
import '../styles/VolunteerLogin.css';

const VolunteerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('floodaid_user_token');
    if (token) {
      navigate('/volunteer/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const data = await userLogin(email, password);

      if (!data?.success || !data?.token || !data?.user) {
        setError(data?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      localStorage.setItem('floodaid_user_token', data.token);
      localStorage.setItem('floodaid_user', JSON.stringify(data.user));

      navigate('/volunteer/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="volunteer-login-container">
      {/* Animated Background */}
      <div className="login-bg-gradient"></div>
      <div className="login-bg-shape shape-1"></div>
      <div className="login-bg-shape shape-2"></div>
      <div className="login-bg-shape shape-3"></div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">🤝</div>
          <h1 className="login-title">Volunteer Portal</h1>
          <p className="login-subtitle">
            Sign in with your invitation credentials
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="volunteer@example.com"
                required
                className="form-input"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="back-link"
          >
            ← Back to Home
          </button>
          <p className="help-text">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerLogin;
