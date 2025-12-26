import React, { useState } from 'react';
import { User, Sun, Moon, Type, Shield, Bell, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/AdminTables.css'; // Reusing for container/header styles

const AdminSettings = () => {
    const { theme, toggleTheme, font, setFont } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [profile, setProfile] = useState({
        name: 'Super Admin',
        email: 'um180181@gmail.com',
        currentPassword: '',
        newPassword: ''
    });

    const handleSave = (section) => {
        if (section === 'Security') {
            if (!profile.newPassword) {
                alert("Please enter a new password.");
                return;
            }
            // Save new password to localStorage (overrides config)
            localStorage.setItem('floodaid_admin_password', profile.newPassword);
            setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            alert("Password updated successfully! using new password on next login.");
        } else {
            alert(`${section} settings saved successfully!`);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>Settings</h1>
                    <p>Manage your account preferences and application appearance.</p>
                </div>
            </div>

            <div className="settings-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem'
            }}>
                {/* Profile Settings */}
                <div className="settings-card" style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', color: '#3b82f6' }}>
                            <User size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Profile Information</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Full Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                enterKeyHint="done"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                            />
                        </div>
                        <button
                            onClick={() => handleSave('Profile')}
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Appearance Settings */}
                <div className="settings-card" style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
                            <Sun size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Appearance</h3>
                    </div>

                    {/* Theme Switcher */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Theme Preference</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => theme === 'dark' && toggleTheme()}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: `2px solid ${theme === 'light' ? '#3b82f6' : '#e2e8f0'}`,
                                    borderRadius: '12px',
                                    background: theme === 'light' ? '#eff6ff' : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Sun size={24} color={theme === 'light' ? '#3b82f6' : '#64748b'} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme === 'light' ? '#3b82f6' : '#64748b' }}>Light Mode</span>
                            </button>
                            <button
                                onClick={() => theme === 'light' && toggleTheme()}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: `2px solid ${theme === 'dark' ? '#3b82f6' : '#e2e8f0'}`,
                                    borderRadius: '12px',
                                    background: theme === 'dark' ? '#1e293b' : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Moon size={24} color={theme === 'dark' ? '#3b82f6' : '#64748b'} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme === 'dark' ? '#3b82f6' : '#64748b' }}>Dark Mode</span>
                            </button>
                        </div>
                    </div>

                    {/* Font Selection */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Type size={16} color="#64748b" />
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Font Family</label>
                        </div>
                        <select
                            value={font}
                            onChange={(e) => setFont(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '1rem',
                                fontFamily: font === 'Inter' ? 'Inter' : font === 'Roboto' ? 'Roboto' : 'Open Sans'
                            }}
                        >
                            <option value="Inter">Inter (Clean & Modern)</option>
                            <option value="Roboto">Roboto (Android Standard)</option>
                            <option value="Open Sans">Open Sans (Friendly)</option>
                        </select>
                    </div>
                </div>

                {/* Notifications & Security */}
                <div className="settings-card" style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: '#fff1f2', borderRadius: '8px', color: '#e11d48' }}>
                            <Shield size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Security & Notifications</h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Bell size={20} color="#64748b" />
                            <div>
                                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>Email Notifications</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Receive daily summaries</span>
                            </div>
                        </div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={() => setNotifications(!notifications)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span
                                style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: notifications ? '#3b82f6' : '#cbd5e1',
                                    transition: '.4s', borderRadius: '34px'
                                }}
                            >
                                <span style={{
                                    position: 'absolute', content: '""', height: '16px', width: '16px',
                                    left: notifications ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>Change Password</label>
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={profile.currentPassword}
                            onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={profile.newPassword}
                            onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}
                        />
                        <button
                            onClick={() => handleSave('Security')}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'white',
                                color: '#0f172a',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Update Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
