import React, { useState, useEffect, useRef } from 'react';
import { User, Sun, Moon, Type, Shield, Bell, Save, Upload, Camera } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import '../../styles/AdminTables.css';
import '../../styles/Settings.css';

const AdminSettings = () => {
    const { theme, toggleTheme, font, setFont } = useTheme();
    const { admin, updateProfile } = useAdminAuth();
    const [notifications, setNotifications] = useState(true);
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: admin?.name || 'Admin',
        email: admin?.email || '',
        avatar: admin?.avatar || '',
        currentPassword: '',
        newPassword: ''
    });

    useEffect(() => {
        if (admin) {
            setProfile(prev => ({
                ...prev,
                name: admin.name,
                email: admin.email,
                avatar: admin.avatar || ''
            }));
        }
    }, [admin]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfile(prev => ({ ...prev, avatar: base64String }));
                updateProfile({ avatar: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (section) => {
        if (section === 'Security') {
            if (!profile.newPassword) {
                alert("Please enter a new password.");
                return;
            }
            localStorage.setItem('floodaid_admin_password', profile.newPassword);
            setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            alert("Password updated successfully! It will be required on your next login.");
        } else if (section === 'Profile') {
            updateProfile({
                name: profile.name,
                email: profile.email
            });
            alert("Profile updated successfully!");
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

            <div className="settings-grid">
                {/* Profile Settings */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--admin-accent)' }}>
                            <User size={18} />
                        </div>
                        <h3>Profile Information</h3>
                    </div>

                    <div className="settings-section-content">
                        {/* Avatar Upload */}
                        <div className="settings-avatar-container">
                            <div className="settings-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Profile" />
                                ) : (
                                    <Camera size={24} color="var(--admin-text-muted)" />
                                )}
                                <div className="settings-avatar-overlay">Change</div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.75rem',
                                    background: 'var(--admin-bg)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '16px',
                                    color: 'var(--admin-text-secondary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <Upload size={12} /> Upload
                            </button>
                        </div>

                        <div className="settings-input-group">
                            <label className="settings-label">Full Name</label>
                            <input
                                type="text"
                                className="settings-input"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            />
                        </div>
                        <div className="settings-input-group">
                            <label className="settings-label">Email Address</label>
                            <input
                                type="email"
                                className="settings-input"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>
                        <button className="settings-button-primary" onClick={() => handleSave('Profile')}>
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Appearance Settings */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-icon-wrapper" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
                            <Sun size={18} />
                        </div>
                        <h3>Appearance</h3>
                    </div>

                    <div className="settings-section-content">
                        <div className="settings-input-group">
                            <label className="settings-label">Theme Preference</label>
                            <div className="theme-toggle-grid">
                                <button
                                    className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => theme === 'dark' && toggleTheme()}
                                >
                                    <Sun size={20} color={theme === 'light' ? 'var(--admin-accent)' : 'var(--admin-text-muted)'} />
                                    <span style={{ color: theme === 'light' ? 'var(--admin-accent)' : 'var(--admin-text-secondary)' }}>Light</span>
                                </button>
                                <button
                                    className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => theme === 'light' && toggleTheme()}
                                >
                                    <Moon size={20} color={theme === 'dark' ? 'var(--admin-accent)' : 'var(--admin-text-muted)'} />
                                    <span style={{ color: theme === 'dark' ? 'var(--admin-accent)' : 'var(--admin-text-secondary)' }}>Dark</span>
                                </button>
                            </div>
                        </div>

                        <div className="settings-input-group">
                            <label className="settings-label">Font Family</label>
                            <select
                                className="settings-input"
                                value={font}
                                onChange={(e) => setFont(e.target.value)}
                                style={{ fontFamily: font }}
                            >
                                <option value="Inter">Inter (Clean)</option>
                                <option value="Roboto">Roboto (Strict)</option>
                                <option value="Open Sans">Open Sans (Soft)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-icon-wrapper" style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48' }}>
                            <Shield size={18} />
                        </div>
                        <h3>Security & Alerts</h3>
                    </div>

                    <div className="settings-section-content">
                        <div className="notification-row">
                            <div className="notification-info">
                                <Bell size={16} color="var(--admin-text-muted)" />
                                <div className="notification-text">
                                    <h4>Email Notifications</h4>
                                    <p>Daily summaries</p>
                                </div>
                            </div>
                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '38px', height: '18px' }}>
                                <input
                                    type="checkbox"
                                    checked={notifications}
                                    onChange={() => setNotifications(!notifications)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span
                                    style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: notifications ? 'var(--admin-accent)' : '#cbd5e1',
                                        transition: '.4s', borderRadius: '34px'
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute', content: '""', height: '12px', width: '12px',
                                        left: notifications ? '22px' : '4px', bottom: '3px',
                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        <div className="settings-input-group">
                            <label className="settings-label">Change Password</label>
                            <input
                                type="password"
                                placeholder="Current Password"
                                className="settings-input"
                                value={profile.currentPassword}
                                onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                                style={{ marginBottom: '0.25rem' }}
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                className="settings-input"
                                value={profile.newPassword}
                                onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                            />
                        </div>
                        <button className="settings-button-outline" onClick={() => handleSave('Security')}>
                            Update Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
