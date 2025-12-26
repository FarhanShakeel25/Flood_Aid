import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard,
    Users,
    Heart,
    AlertTriangle,
    Settings,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react';
import '../../styles/AdminLayout.css';

const AdminLayout = ({ children }) => {
    const { admin, logout } = useAdminAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const mockNotifications = [
        { id: 1, title: 'New Donation', message: 'Rs. 5,000 received from Ali Khan', time: '5 min ago', unread: true },
        { id: 2, title: 'Relief Request', message: 'Emergency request from District 9', time: '15 min ago', unread: true },
        { id: 3, title: 'User Registered', message: 'New volunteer signed up', time: '1 hour ago', unread: false },
    ];

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'User Management' },
        { path: '/admin/donations', icon: Heart, label: 'Donations' },
        { path: '/admin/requests', icon: AlertTriangle, label: 'Relief Requests' },
        { path: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    const { theme } = useTheme();

    return (
        <div className="admin-container" data-theme={theme}>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${!isSidebarOpen ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                {/* Header */}
                <div className="admin-sidebar-header">
                    <Link to="/admin" className="brand-logo">
                        <span className="brand-icon">🌊</span>
                        <span className="brand-text">FloodAid</span>
                    </Link>
                    {/* Hamburger Toggle Button */}
                    <button
                        className="toggle-btn"
                        onClick={() => {
                            if (window.innerWidth >= 1024) {
                                setIsSidebarOpen(!isSidebarOpen);
                            } else {
                                setIsMobileMenuOpen(false);
                            }
                        }}
                        style={{ marginLeft: 'auto', color: 'white' }}
                        title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="admin-nav">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                title={!isSidebarOpen ? item.label : ''}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <item.icon size={20} className="nav-icon" />
                                <span className="nav-label">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="admin-profile">
                    <div className="profile-content">
                        <div className="profile-avatar">
                            {admin?.name?.charAt(0) || 'A'}
                        </div>
                        {isSidebarOpen && (
                            <div className="profile-info">
                                <p className="profile-name">{admin?.name || 'Admin'}</p>
                                <p className="profile-email">{admin?.email}</p>
                            </div>
                        )}
                        {isSidebarOpen && (
                            <button
                                onClick={handleLogout}
                                className="logout-btn"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <h2 className="page-title">
                            {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="header-right">
                        <div style={{ position: 'relative' }}>
                            <button
                                className="toggle-btn"
                                title="Notifications"
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ position: 'relative' }}
                            >
                                <Bell size={20} />
                                {mockNotifications.some(n => n.unread) && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        width: '8px',
                                        height: '8px',
                                        background: '#ef4444',
                                        borderRadius: '50%',
                                        border: '2px solid white'
                                    }}></span>
                                )}
                            </button>

                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 0.5rem)',
                                    right: 0,
                                    width: '320px',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                    border: '1px solid #e2e8f0',
                                    zIndex: 1000
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notifications</h3>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {mockNotifications.map(notif => (
                                            <div key={notif.id} style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                background: notif.unread ? '#eff6ff' : 'white'
                                            }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {notif.unread && <div style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }}></div>}
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{notif.title}</p>
                                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748b' }}>{notif.message}</p>
                                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>{notif.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                handleLogout();
                                window.location.href = '/';
                            }}
                            style={{
                                textDecoration: 'none',
                                color: '#2563eb',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem'
                            }}
                        >
                            View Site
                        </button>
                    </div>
                </header>

                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
