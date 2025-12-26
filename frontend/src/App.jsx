import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link, Navigate, useNavigate } from 'react-router-dom';
import Home from './Pages/HomePage';
import Contact from './Pages/ContactPage';
import Donations from './components/donations';
import SuccessPage from './Pages/SuccessPage';
import CancelPage from './Pages/CancelPage';
import FloodAidChatbot from './components/FloodAidChatbot';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { startKeepAlive } from './services/keepAliveService';
import './styles/globals.css';
import './styles/scrollbar.css';
import './styles/animations.css';

// Admin Components
import AdminLogin from './Pages/Admin/Login';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './Pages/Admin/Dashboard';
import AdminUsers from './Pages/Admin/Users';
import AdminDonations from './Pages/Admin/Donations';
import AdminRequests from './Pages/Admin/Requests';
import AdminSettings from './Pages/Admin/Settings';

// ============================================================================
// ADMIN FLOATING BUTTON (GPT-Style)
// ============================================================================
function AdminButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  const handleAdminClick = (e) => {
    e.preventDefault();
    // Logout if authenticated
    const storedAdmin = localStorage.getItem('floodaid_admin');
    if (storedAdmin) {
      // Clear admin session
      localStorage.removeItem('floodaid_admin');
      localStorage.removeItem('floodaid_token');
      localStorage.removeItem('floodaid_mock_otp');
    }
    // Navigate to login
    navigate('/admin/login');
  };

  return (
    <Link
      to="/admin/login"
      onClick={handleAdminClick}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        color: 'white',
        textDecoration: 'none',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.95)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)';
      }}
      title="Admin Access"
    >
      <span>🔐</span>
    </Link>
  );
}

// ============================================================================
// APP CONTENT
// ============================================================================
function AppContent() {
  const location = useLocation();

  const handleEmergency = (message) => {
    console.log('🚨 EMERGENCY DETECTED:', message);
  };

  return (
    <div className="app">
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donate" element={<Donations />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes with Layout */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="donations" element={<AdminDonations />} />
                <Route path="requests" element={<AdminRequests />} />
                <Route path="settings" element={<AdminSettings />} />
                {/* Catch-all for sub-routes redirects to dashboard */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } >
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>
      </Routes>

      {/* ===== GLOBAL OVERLAYS ===== */}
      {!location.pathname.startsWith('/admin') && (
        <>
          <FloodAidChatbot
            apiKey={import.meta.env.VITE_MISTRAL_API_KEY}
            model="mistral-large-latest"
            aiProvider="mistral"
            position="bottom-right"
            onEmergency={handleEmergency}
          />
          <AdminButton />
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function App() {
  // Start backend keep-alive on app load
  useEffect(() => {
    if (typeof startKeepAlive === 'function') {
      startKeepAlive();
    }
  }, []);

  return (
    <Router>
      <AdminAuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;