import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, UserPlus, Shield, User, Heart, Trash2 } from 'lucide-react';
import '../../styles/AdminTables.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [roleFilter, setRoleFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize, statusFilter, roleFilter, searchTerm]);

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

            const response = await fetch(`https://floodaid-api.onrender.com/api/users?${params.toString()}`);
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
        const roleMap = { 0: 'Volunteer', 1: 'Donor', 2: 'Both' };
        return roleMap[roleInt] || 'Unknown';
    };

    const mapStatus = (statusInt) => {
        const statusMap = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
        return statusMap[statusInt] || 'Unknown';
    };

    const handleApproveUser = async (userId) => {
        try {
            const response = await fetch(`https://floodaid-api.onrender.com/api/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 1, verificationNotes: 'Approved by admin' }),
            });

            if (!response.ok) {
                throw new Error('Failed to approve user');
            }

            alert('User approved successfully!');
            setPage(1);
            fetchUsers();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleRejectUser = async (userId) => {
        const reason = window.prompt('Enter reason for rejection:');
        if (!reason) return;

        try {
            const response = await fetch(`https://floodaid-api.onrender.com/api/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 2, reasonForRejection: reason }),
            });

            if (!response.ok) {
                throw new Error('Failed to reject user');
            }

            alert('User rejected successfully!');
            setPage(1);
            fetchUsers();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`https://floodaid-api.onrender.com/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            alert('User deleted successfully!');
            setPage(1);
            fetchUsers();
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const getRoleIcon = (role) => {
        if (role === 'Volunteer') return <Heart size={12} />;
        if (role === 'Donor') return <User size={12} />;
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
                    <p>Review and approve volunteers and donors</p>
                </div>
            </div>

            {/* Filters */}
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
                        <option value="Both">Both</option>
                    </select>
                </div>
            </div>

            {error && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading users...</div>
            ) : (
                <>
                    {/* Table */}
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
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
                                                <span className={`badge ${user.roleInt === 0 ? 'badge-blue' : user.roleInt === 1 ? 'badge-purple' : 'badge-cyan'}`}>
                                                    {getRoleIcon(user.role)} {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    {user.statusInt === 0 && (
                                                        <>
                                                            <button
                                                                style={{
                                                                    padding: '0.5rem 1rem',
                                                                    backgroundColor: '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem'
                                                                }}
                                                                onClick={() => handleApproveUser(user.id)}
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={16} /> Approve
                                                            </button>
                                                            <button
                                                                style={{
                                                                    padding: '0.5rem 1rem',
                                                                    backgroundColor: '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem'
                                                                }}
                                                                onClick={() => handleRejectUser(user.id)}
                                                                title="Reject"
                                                            >
                                                                <XCircle size={16} /> Reject
                                                            </button>
                                                        </>
                                                    )}
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

                    {/* Pagination */}
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
                </>
            )}
        </div>
    );
};

export default AdminUsers;
