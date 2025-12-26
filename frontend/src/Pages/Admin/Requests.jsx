import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react';
import '../../styles/AdminTables.css';

const AdminRequests = () => {
    const [requests] = useState([
        { id: 'REQ-001', type: 'Medical', location: 'District 9', priority: 'High', status: 'Pending', reportedBy: 'Local Volunteer' },
        { id: 'REQ-002', type: 'Food', location: 'Shelter B', priority: 'Medium', status: 'In Progress', reportedBy: 'Civil Defense' },
        { id: 'REQ-003', type: 'Rescue', location: 'River Side', priority: 'Critical', status: 'Pending', reportedBy: 'SOS Signal' },
        { id: 'REQ-004', type: 'Clothing', location: 'Community Center', priority: 'Low', status: 'Resolved', reportedBy: 'Admin' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const filteredRequests = requests.filter(r => {
        const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>Relief Requests</h1>
                    <p>Monitor and respond to emergency relief requests.</p>
                </div>
            </div>

            <div className="table-controls">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search requests..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 0.5rem' }}></div>
                <div style={{ position: 'relative' }}>
                    <button
                        className="icon-btn"
                        title="Filter"
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        style={{ background: statusFilter !== 'All' ? '#eff6ff' : '', borderColor: statusFilter !== 'All' ? '#3b82f6' : '' }}
                    >
                        <Filter size={20} color={statusFilter !== 'All' ? '#3b82f6' : 'currentColor'} />
                    </button>

                    {/* Status Filter Dropdown */}
                    {showFilterDropdown && (
                        <div className="animate-scale-in" style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            minWidth: '150px',
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>FILTER BY STATUS</div>
                            {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setShowFilterDropdown(false);
                                    }}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.5rem 1rem',
                                        background: statusFilter === status ? '#f1f5f9' : 'white',
                                        color: statusFilter === status ? '#0f172a' : '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="table-container">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Priority</th>
                                <th>Reported By</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((r) => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {r.type === 'Medical' && <span style={{ color: '#ef4444' }}>🏥</span>}
                                            {r.type === 'Food' && <span style={{ color: '#f97316' }}>🍞</span>}
                                            {r.type === 'Rescue' && <span style={{ color: '#dc2626' }}>🆘</span>}
                                            {r.type}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748b' }}>
                                            <MapPin size={14} />
                                            {r.location}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${r.priority === 'Critical' ? 'badge-red' :
                                            r.priority === 'High' ? 'badge-orange' :
                                                'badge-blue'
                                            }`}>
                                            {r.priority}
                                        </span>
                                    </td>
                                    <td>{r.reportedBy}</td>
                                    <td>
                                        <span className={`badge ${r.status === 'Resolved' ? 'badge-green' : 'badge-gray'
                                            }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {r.status !== 'Resolved' && (
                                                <button
                                                    className="icon-btn"
                                                    title="Mark Resolved"
                                                    style={{ color: '#10b981' }}
                                                    onClick={() => {
                                                        if (window.confirm(`Mark request ${r.id} as Resolved?`)) {
                                                            alert(`Request ${r.id} marked as Resolved!`);
                                                        }
                                                    }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                className="icon-btn delete"
                                                title="Dismiss"
                                                onClick={() => {
                                                    if (window.confirm(`Dismiss request ${r.id}?`)) {
                                                        alert(`Request ${r.id} dismissed.`);
                                                    }
                                                }}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminRequests;
