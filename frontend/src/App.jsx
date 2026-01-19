import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link, Navigate, useNavigate } from 'react-router-dom';
import Home from './Pages/HomePage';
import Contact from './Pages/ContactPage';
import Donations from './components/donations';
import HelpRequestPage from './Pages/HelpRequestPage';
import SuccessPage from './Pages/SuccessPage';
import CancelPage from './Pages/CancelPage';
import AcceptInvitation from './Pages/AcceptInvitation';
import VolunteerLogin from './Pages/VolunteerLogin';
import VolunteerDashboard from './Pages/VolunteerDashboard';
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
// APP CONTENT
// ============================================================================
function VolunteerRoute({ children }) {
  const hasToken = !!localStorage.getItem('floodaid_user_token');
  return hasToken ? children : <Navigate to="/volunteer/login" replace />;
}

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
        <Route path="/help-request" element={<HelpRequestPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/volunteer/login" element={<VolunteerLogin />} />
        <Route
          path="/volunteer/dashboard"
          element={
            <VolunteerRoute>
              <VolunteerDashboard />
            </VolunteerRoute>
          }
        />

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