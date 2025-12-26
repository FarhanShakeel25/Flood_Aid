import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

function AdminPanel() {
  const navigate = useNavigate();
  const { logout, user } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin:  '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1e293b' }}>
              🌊 FloodAid Admin Dashboard
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
              Welcome, {user?.email || 'Admin'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius:  '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Logout
          </button>
        </div>

        {/* Dashboard Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns:  'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {/* Card 1 */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            borderRadius:  '12px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Donations</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>$12,450</p>
          </div>

          {/* Card 2 */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Active Cases</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>48</p>
          </div>

          {/* Card 3 */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius:  '12px',
            color:  'white'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Volunteers</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>156</p>
          </div>

          {/* Card 4 */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '12px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Emergency Alerts</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>7</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
            Recent Activity
          </h2>
          <div style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px'
          }}>
            <p style={{ color: '#64748b', margin: 0 }}>
              No recent activity to display.  Admin features will be added here.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius:  '8px',
              cursor:  'pointer',
              fontWeight: 600
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;