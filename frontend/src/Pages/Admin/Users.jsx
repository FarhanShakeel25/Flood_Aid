import React, { useState } from 'react';
import { Search, Edit, Trash2, UserPlus, Shield, User, Heart } from 'lucide-react';
import AddUserModal from '../../components/Admin/AddUserModal';
import '../../styles/AdminTables.css';

const AdminUsers = () => {
    const [users] = useState([
        { id: 1, name: 'Admin User', email: 'admin@floodaid.com', role: 'admin', status: 'Active' },
        { id: 2, name: 'John Doe', email: 'john@example.com', role: 'volunteer', status: 'Active' },
        { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'Inactive' },
        { id: 4, name: 'Mike Johnson', email: 'mike@example.com', role: 'volunteer', status: 'Active' },
        { id: 5, name: 'Sarah Wilson', email: 'sarah@example.com', role: 'user', status: 'Active' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    const handleAddUser = (userData) => {
        console.log('New user data:', userData);
        alert(`User ${userData.name} added successfully! (Mock action)`);
        // In real app, would call API here
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>User Management</h1>
                    <p>Manage system users, admins, and volunteers.</p>
                </div>
                <button
                    className="action-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    <UserPlus size={18} />
                    Add User
                </button>
            </div>

            {/* Search Bar */}
            <div className="table-controls">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="table-container">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div className="user-info">
                                                <p className="user-name">{user.name}</p>
                                                <p className="user-email">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-purple' :
                                            user.role === 'volunteer' ? 'badge-blue' : 'badge-gray'
                                            }`}>
                                            {user.role === 'admin' && <Shield size={12} />}
                                            {user.role === 'volunteer' && <Heart size={12} />}
                                            {user.role === 'user' && <User size={12} />}
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.status === 'Active' ? 'badge-green' : 'badge-gray'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="icon-btn"
                                                title="Edit"
                                                onClick={() => alert(`Edit user: ${user.name} (ID: ${user.id})`)}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="icon-btn delete"
                                                title="Delete"
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                                        alert(`User ${user.name} deleted! (Mock action)`);
                                                    }
                                                }}
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
                {filteredUsers.length === 0 && (
                    <div className="empty-state">
                        No users found matching "{searchTerm}"
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            <AddUserModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddUser}
            />
        </div>
    );
};

export default AdminUsers;
