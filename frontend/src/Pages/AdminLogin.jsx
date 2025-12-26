// frontend/src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from '../styles/AdminLogin.module.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed.  Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <div className={styles.logo}>🌊</div>
          <h1>FloodAid Admin</h1>
          <p>Login to access the admin dashboard</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@floodaid.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p className={styles.testCredentials}>
            <strong>Test Credentials:</strong><br />
            Email: admin@floodaid.com<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;