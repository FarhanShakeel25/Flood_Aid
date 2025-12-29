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
    const { theme } = useTheme();

    // Reset global body padding for admin layout
    React.useEffect(() => {
        document.body.classList.add('admin-mode');
        return () => document.body.classList.remove('admin-mode');
    }, []);

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
                <div className="admin-profile" style={{ borderTop: '1px solid var(--admin-border)' }}>
                    <div className="profile-content">
                        <div className="profile-avatar overflow-hidden" style={{ background: 'var(--admin-bg)', color: 'var(--admin-accent)', border: '1px solid var(--admin-border)' }}>
                            {admin?.avatar ? (
                                <img
                                    src={admin.avatar}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                admin?.name?.charAt(0) || 'A'
                            )}
                        </div>
                        {isSidebarOpen && (
                            <div className="profile-info">
                                <p className="profile-name" style={{ color: 'var(--admin-sidebar-text)', fontWeight: 600 }}>{admin?.name || 'Admin'}</p>
                                <p className="profile-email" style={{ color: 'var(--admin-sidebar-text)', opacity: 0.7, fontSize: '0.75rem' }}>{admin?.email}</p>
                            </div>
                        )}
                        {isSidebarOpen && (
                            <button
                                onClick={handleLogout}
                                className="logout-btn"
                                title="Logout"
                                style={{ color: 'var(--admin-sidebar-text)' }}
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
                                    background: 'var(--admin-card-bg)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                    border: '1px solid var(--admin-border)',
                                    zIndex: 1000,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--admin-border)' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--admin-text-main)' }}>Notifications</h3>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {mockNotifications.map(notif => (
                                            <div key={notif.id} style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid var(--admin-border)',
                                                cursor: 'pointer',
                                                background: notif.unread ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                            }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {notif.unread && <div style={{ width: '6px', height: '6px', background: 'var(--admin-accent)', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }}></div>}
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--admin-text-main)' }}>{notif.title}</p>
                                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>{notif.message}</p>
                                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{notif.time}</p>
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
                                color: 'var(--admin-accent)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
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
