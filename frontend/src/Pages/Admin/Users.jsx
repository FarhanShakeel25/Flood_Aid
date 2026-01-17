import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, User, Heart, Trash2, Mail, RotateCw, X as XIcon, MapPin, Building2 } from 'lucide-react';
import '../../styles/AdminTables.css';
import { API_BASE } from '../../config/apiBase';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminUsers = () => {
    const { admin } = useAdminAuth();
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [roleFilter, setRoleFilter] = useState('All');
    const [adminRoleFilter, setAdminRoleFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', role: 3, provinceId: '', cityId: '' });

    // Adjust default invite role based on admin type
    useEffect(() => {
        if (admin?.role === 'ProvinceAdmin') {
            setInviteForm((prev) => ({ ...prev, role: 0 })); // ProvinceAdmin can only invite Volunteers
        }
    }, [admin]);
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'admins', or 'invitations'

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'admins' && admin?.role === 'SuperAdmin') {
            fetchAdmins();
        }
        fetchInvitations();
        fetchProvinces();
    }, [page, pageSize, statusFilter, roleFilter, adminRoleFilter, searchTerm, activeTab]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);

            if (statusFilter !== 'All') {
                const statusMap = { 'Pending': 0, 'Approved': 1, 'Rejected': 2 };
                params.append('status', statusMap[statusFilter]);
            }

            if (roleFilter !== 'All') {
                const roleMap = { 'Volunteer': 0, 'Donor': 1, 'Both': 2 };
                params.append('role', roleMap[roleFilter]);
            }

            if (searchTerm) {
                params.append('searchTerm', searchTerm);
            }

            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const result = await response.json();
            const mappedUsers = (result.data || []).map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phoneNumber: u.phoneNumber,
                role: mapRole(u.role),
                roleInt: u.role,
                status: mapStatus(u.status),
                statusInt: u.status,
                createdAt: new Date(u.createdAt).toLocaleString(),
                approvedAt: u.approvedAt ? new Date(u.approvedAt).toLocaleString() : '-',
                reasonForRejection: u.reasonForRejection || '-',
                verificationNotes: u.verificationNotes || '-'
            }));

            setUsers(mappedUsers);
            setTotalCount(result.totalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const mapRole = (roleInt) => {
        const roleMap = { 0: 'Volunteer', 1: 'Donor', 2: 'Both', 3: 'ProvinceAdmin', 4: 'SuperAdmin' };
        return roleMap[roleInt] || 'Unknown';
    };

    const mapStatus = (statusInt) => {
        const statusMap = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
        return statusMap[statusInt] || 'Unknown';
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);

            if (adminRoleFilter !== 'All') {
                params.append('role', adminRoleFilter);
            }

            if (searchTerm) {
                params.append('searchTerm', searchTerm);
            }

            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/admins?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch admins');
            }

            const result = await response.json();
            const mappedAdmins = (result.data || []).map(a => ({
                id: a.id,
                name: a.name,
                email: a.email,
                username: a.username,
                role: a.role,
                isActive: a.isActive,
                provinceId: a.provinceId,
                provinceName: a.provinceName || '-',
                createdAt: new Date(a.createdAt).toLocaleString(),
                lastLoginAt: a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : 'Never'
            }));

            setAdmins(mappedAdmins);
            setTotalCount(result.totalCount || 0);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching admins:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/invitations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setInvitations(data || []);
            }
        } catch (err) {
            console.error('Error fetching invitations:', err);
        }
    };

    const fetchProvinces = async () => {
        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/provinces`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProvinces(data || []);
            }
        } catch (err) {
            console.error('Error fetching provinces:', err);
        }
    };

    const fetchCitiesForProvince = async (provinceId) => {
        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/provinces/${provinceId}/cities`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCities(data || []);
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('floodaid_token');
            console.log('Token:', token ? 'Present' : 'Missing');
            console.log('API_BASE:', API_BASE);
            console.log('Invite data:', { email: inviteForm.email, role: inviteForm.role, provinceId: inviteForm.provinceId, cityId: inviteForm.cityId });
            
            const requestBody = {
                email: inviteForm.email,
                role: parseInt(inviteForm.role),
                provinceId: inviteForm.provinceId ? parseInt(inviteForm.provinceId) : null,
                cityId: inviteForm.cityId ? parseInt(inviteForm.cityId) : null
            };
            console.log('Request body:', requestBody);
            
            const response = await fetch(`${API_BASE}/api/invitations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Response status:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = 'Failed to send invitation';
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            alert('Invitation sent successfully!');
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 3, provinceId: '', cityId: '' });
            fetchInvitations();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleResendInvitation = async (invitationId) => {
        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/invitations/${invitationId}/resend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorMessage = 'Failed to resend invitation';
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            alert('Invitation resent successfully!');
            fetchInvitations();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleRevokeInvitation = async (invitationId) => {
        if (!window.confirm('Are you sure you want to revoke this invitation?')) return;

        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/invitations/${invitationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorMessage = 'Failed to revoke invitation';
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            alert('Invitation revoked successfully!');
            fetchInvitations();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete user';
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            alert('User deleted successfully!');
            setPage(1);
            fetchUsers();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const getRoleIcon = (role) => {
        if (role === 'Volunteer' || role === 0) return <Heart size={12} />;
        if (role === 'Donor' || role === 1) return <User size={12} />;
        if (role === 'ProvinceAdmin' || role === 3) return <Building2 size={12} />;
        if (role === 'SuperAdmin' || role === 4) return <Shield size={12} />;
        return <Shield size={12} />;
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'Approved') return 'badge-green';
        if (status === 'Rejected') return 'badge-red';
        return 'badge-yellow';
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>User Management</h1>
                    <p>Invite volunteers and manage user access</p>
                </div>
                <button
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600
                    }}
                    onClick={() => setShowInviteModal(true)}
                >
                    <UserPlus size={20} /> Invite User
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'users' ? '#4f46e5' : 'transparent',
                            color: activeTab === 'users' ? 'white' : '#64748b',
                            border: 'none',
                            borderBottom: activeTab === 'users' ? '3px solid #4f46e5' : '3px solid transparent',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600
                        }}
                        onClick={() => { setActiveTab('users'); setPage(1); }}
                    >
                        Volunteers & Donors ({activeTab === 'users' ? totalCount : users.length})
                    </button>
                    {admin?.role === 'SuperAdmin' && (
                        <button
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: activeTab === 'admins' ? '#4f46e5' : 'transparent',
                                color: activeTab === 'admins' ? 'white' : '#64748b',
                                border: 'none',
                                borderBottom: activeTab === 'admins' ? '3px solid #4f46e5' : '3px solid transparent',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: 600
                            }}
                            onClick={() => { setActiveTab('admins'); setPage(1); }}
                        >
                            Province Admins ({activeTab === 'admins' ? totalCount : admins.length})
                        </button>
                    )}
                    <button
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === 'invitations' ? '#4f46e5' : 'transparent',
                            color: activeTab === 'invitations' ? 'white' : '#64748b',
                            border: 'none',
                            borderBottom: activeTab === 'invitations' ? '3px solid #4f46e5' : '3px solid transparent',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600
                        }}
                        onClick={() => { setActiveTab('invitations'); setPage(1); }}
                    >
                        Invitations ({invitations.length})
                    </button>
                </div>
                {activeTab === 'invitations' && (
                    <button
                        onClick={() => fetchInvitations()}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'transparent',
                            color: '#4f46e5',
                            border: '2px solid #4f46e5',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <RotateCw size={16} /> Refresh
                    </button>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: '#0f172a' }}>Invite New User</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    color: '#64748b'
                                }}
                            >
                                <XIcon size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleInviteUser}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem'
                                    }}
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Role *</label>
                                <select
                                    required
                                    value={inviteForm.role}
                                    onChange={(e) => {
                                        setInviteForm({ ...inviteForm, role: parseInt(e.target.value), provinceId: '', cityId: '' });
                                        setCities([]);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem'
                                    }}
                                    disabled={admin?.role === 'ProvinceAdmin'}
                                >
                                    {admin?.role === 'SuperAdmin' && <option value={3}>Province Admin</option>}
                                    <option value={0}>Volunteer</option>
                                </select>
                            </div>
                            {inviteForm.role == 3 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Province *</label>
                                    <select
                                        required
                                        value={inviteForm.provinceId}
                                        onChange={(e) => {
                                            setInviteForm({ ...inviteForm, provinceId: e.target.value });
                                            fetchCitiesForProvince(e.target.value);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <option value="">Select Province</option>
                                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {inviteForm.role == 0 && (
                                <>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>Province *</label>
                                        <select
                                            required
                                            value={inviteForm.provinceId}
                                            onChange={(e) => {
                                                setInviteForm({ ...inviteForm, provinceId: e.target.value, cityId: '' });
                                                fetchCitiesForProvince(e.target.value);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            <option value="">Select Province</option>
                                            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#0f172a', fontWeight: 600 }}>City *</label>
                                        <select
                                            required
                                            value={inviteForm.cityId}
                                            onChange={(e) => setInviteForm({ ...inviteForm, cityId: e.target.value })}
                                            disabled={!inviteForm.provinceId || cities.length === 0}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.95rem',
                                                backgroundColor: !inviteForm.provinceId || cities.length === 0 ? '#f1f5f9' : 'white'
                                            }}
                                        >
                                            <option value="">Select City</option>
                                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 600
                                    }}
                                >
                                    Send Invitation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            {activeTab === 'users' && (
                <div className="table-controls" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search name/email/phone..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="status-dropdown"
                            style={{ minWidth: '140px' }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            className="status-dropdown"
                            style={{ minWidth: '140px' }}
                        >
                            <option value="All">All Roles</option>
                            <option value="Volunteer">Volunteer</option>
                            <option value="Donor">Donor</option>
                            <option value="ProvinceAdmin">Province Admin</option>
                        </select>
                    </div>
                </div>
            )}

            {error && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</div>
            ) : (
                <>
                    {activeTab === 'users' ? (
                        /* Users Table */
                        <>
                            <div className="table-container">
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Role</th>
                                                <th>Scope</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#e0e7ff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: '#4f46e5',
                                                                fontWeight: 600,
                                                                fontSize: '14px'
                                                            }}>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{user.name}</p>
                                                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{user.createdAt}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontSize: '0.875rem' }}>{user.email}</td>
                                                    <td style={{ fontSize: '0.875rem' }}>{user.phoneNumber}</td>
                                                    <td>
                                                        <span className={`badge ${user.roleInt === 0 ? 'badge-blue' : user.roleInt === 1 ? 'badge-purple' : user.roleInt === 3 ? 'badge-indigo' : 'badge-cyan'}`}>
                                                            {getRoleIcon(user.roleInt)} {user.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                        {user.province || user.city || '-'}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button
                                                                className="icon-btn delete"
                                                                title="Delete"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {users.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    No users found
                                </div>
                            )}
                        </>
                    ) : activeTab === 'admins' ? (
                        /* Admins Table */
                        <>
                            {/* Admin Filters */}
                            <div className="table-controls" style={{ flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                                    <Search className="search-icon" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search name/email..."
                                        className="search-input"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    />
                                </div>
                                <select
                                    value={adminRoleFilter}
                                    onChange={(e) => { setAdminRoleFilter(e.target.value); setPage(1); }}
                                    className="status-dropdown"
                                    style={{ minWidth: '140px' }}
                                >
                                    <option value="All">All Roles</option>
                                    <option value="SuperAdmin">SuperAdmin</option>
                                    <option value="ProvinceAdmin">ProvinceAdmin</option>
                                </select>
                            </div>

                            <div className="table-container">
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Province</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Last Login</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {admins.map((admin) => (
                                                <tr key={admin.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                background: admin.role === 'SuperAdmin' ? '#ef4444' : '#3b82f6',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 600
                                                            }}>
                                                                {admin.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 500 }}>{admin.name}</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{admin.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{admin.email}</td>
                                                    <td>
                                                        <span className={admin.role === 'SuperAdmin' ? 'badge-red' : 'badge-blue'}>
                                                            {admin.role === 'SuperAdmin' ? <Shield size={12} /> : <Building2 size={12} />}
                                                            {admin.role}
                                                        </span>
                                                    </td>
                                                    <td>{admin.provinceName}</td>
                                                    <td>
                                                        <span className={admin.isActive ? 'badge-green' : 'badge-gray'}>
                                                            {admin.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{admin.createdAt}</td>
                                                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{admin.lastLoginAt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {admins.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                    No admins found
                                </div>
                            )}
                        </>
                    ) : (
                        /* Invitations Table */
                        <>
                            <div className="table-container">
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Scope</th>
                                                <th>Status</th>
                                                <th>Expires</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invitations.map((inv) => (
                                                <tr key={inv.id}>
                                                    <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                                        <Mail size={14} style={{ display: 'inline', marginRight: '0.5rem', color: '#64748b' }} />
                                                        {inv.email}
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-indigo">
                                                            {getRoleIcon(inv.role)} {inv.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                        {inv.province || inv.city || '-'}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${inv.status === 'Pending' ? 'badge-yellow' : inv.status === 'Accepted' ? 'badge-green' : 'badge-red'}`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                        {new Date(inv.expiresAt).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            {inv.status === 'Pending' && (
                                                                <>
                                                                    <button
                                                                        className="icon-btn"
                                                                        title="Resend"
                                                                        onClick={() => handleResendInvitation(inv.id)}
                                                                        style={{ backgroundColor: '#0891b2', color: 'white' }}
                                                                    >
                                                                        <RotateCw size={18} />
                                                                    </button>
                                                                    <button
                                                                        className="icon-btn delete"
                                                                        title="Revoke"
                                                                        onClick={() => handleRevokeInvitation(inv.id)}
                                                                    >
                                                                        <XIcon size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {invitations.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    No invitations found
                                </div>
                            )}
                        </>
                    )}

                    {/* Pagination */}
                    {activeTab === 'users' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ color: '#475569', fontSize: '0.875rem' }}>
                                Showing {users.length > 0 ? (page - 1) * pageSize + 1 : 0}-{(page - 1) * pageSize + users.length} of {totalCount}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    className="icon-btn"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    ←
                                </button>
                                <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>Page {page}</span>
                                <button
                                    className="icon-btn"
                                    onClick={() => {
                                        const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
                                        setPage(Math.min(maxPage, page + 1));
                                    }}
                                    disabled={page >= Math.ceil(totalCount / pageSize)}
                                >
                                    →
                                </button>
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                    className="status-dropdown"
                                    style={{ minWidth: '80px' }}
                                >
                                    {[5, 10, 20, 50].map((size) => (
                                        <option key={size} value={size}>{size}/page</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminUsers;
