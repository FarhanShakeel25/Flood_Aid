import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertTriangle, CheckCircle, XCircle, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/AdminTables.css';
import RequestDetailModal from './RequestDetailModal';

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [requestTypeFilter, setRequestTypeFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                params.append('page', page);
                params.append('pageSize', pageSize);

                if (statusFilter !== 'All') {
                    params.append('status', mapStatusToInt(statusFilter));
                }

                if (requestTypeFilter !== 'All') {
                    params.append('requestType', mapRequestTypeToInt(requestTypeFilter));
                }

                if (startDate) {
                    params.append('startDate', startDate);
                }

                if (endDate) {
                    params.append('endDate', `${endDate}T23:59:59Z`);
                }

                if (searchTerm) {
                    params.append('searchTerm', searchTerm);
                }

                const response = await fetch(`https://floodaid-api.onrender.com/api/helpRequest?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch requests');
                }
                const result = await response.json();

                const mappedRequests = (result.data || []).map((req) => ({
                    id: req.id,
                    type: mapRequestType(req.requestType),
                    location: `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}`,
                    priority: determinePriority(req.requestType),
                    status: req.status,
                    reportedBy: req.requestorName || 'Anonymous',
                    phone: req.requestorPhoneNumber,
                    email: req.requestorEmail,
                    description: req.requestDescription,
                    createdAt: new Date(req.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
                    updatedAt: req.updatedAt,
                    latitude: req.latitude,
                    longitude: req.longitude,
                }));

                setRequests(mappedRequests);
                setTotalCount(result.totalCount || 0);
                setError(null);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching requests:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [page, pageSize, statusFilter, requestTypeFilter, startDate, endDate, searchTerm]);

    const mapRequestType = (requestType) => {
        const typeMap = {
            'MedicalSuppliesRequired': 'Medical Assistance',
            'FoodRequired': 'Food & Supplies',
            'EvacuationRequired': 'Rescue & Evacuation',
            'ClothesRequired': 'Clothes',
            'EmergencyCase': 'Emergency'
        };
        return typeMap[requestType] || requestType;
    };

    const mapRequestTypeToInt = (type) => {
        const typeMap = {
            'Medical Assistance': 0,
            'Food & Supplies': 1,
            'Rescue & Evacuation': 2,
            'Food': 1,
            'Medical': 0,
            'Evacuation': 2
        };
        return typeMap[type] ?? undefined;
    };

    // Determine priority based on request type (simple logic)
    const determinePriority = (requestType) => {
        if (requestType === 'EvacuationRequired') return 'Critical';
        if (requestType === 'MedicalSuppliesRequired') return 'High';
        if (requestType === 'EmergencyCase') return 'High';
        return 'Medium';
    };

    // Map status string to integer for API
    const mapStatusToInt = (status) => {
        const statusMap = {
            'Pending': 0,
            'InProgress': 1,
            'Fulfilled': 2,
            'Cancelled': 3,
            'OnHold': 4
        };
        return statusMap[status] ?? 0;
    };

    // Handle status update
    const handleStatusUpdate = async (requestId, newStatus) => {
        try {
            const statusInt = mapStatusToInt(newStatus);
            const response = await fetch(`https://floodaid-api.onrender.com/api/helpRequest/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: statusInt }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update status: ${errorText}`);
            }

            // Update local state with new status and updatedAt timestamp
            const now = new Date();
            const formattedUpdatedAt = now.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            
            setRequests(prevRequests =>
                prevRequests.map(r =>
                    r.id === requestId ? { ...r, status: newStatus, updatedAt: now.toISOString() } : r
                )
            );
            
            // Also update the selected request if it's open in the modal
            if (selectedRequest && selectedRequest.id === requestId) {
                setSelectedRequest(prev => ({
                    ...prev,
                    status: newStatus,
                    updatedAt: now.toISOString()
                }));
            }
            
            alert('Status updated successfully!');
        } catch (err) {
            alert(`Error updating status: ${err.message}`);
        }
    };

    const createFullRequest = (request) => ({
        ...request,
        requestorName: request.reportedBy,
        requestorPhoneNumber: request.phone,
        requestorEmail: request.email,
        requestDescription: request.description,
        requestType: request.type,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    });

    const handleOpenModal = (request) => {
        setSelectedRequest(createFullRequest(request));
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRequest(null);
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div className="page-title">
                    <h1>Relief Requests</h1>
                    <p>Monitor and respond to emergency relief requests.</p>
                </div>
            </div>

            <div className="table-controls" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search name/phone/email..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                        value={requestTypeFilter}
                        onChange={(e) => { setRequestTypeFilter(e.target.value); setPage(1); }}
                        className="status-dropdown"
                        style={{ minWidth: '180px' }}
                    >
                        <option value="All">All Types</option>
                        <option value="Food">Food & Supplies</option>
                        <option value="Medical">Medical Assistance</option>
                        <option value="Evacuation">Rescue & Evacuation</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="status-dropdown"
                        style={{ minWidth: '140px' }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                        className="search-input"
                        style={{ width: '150px' }}
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                        className="search-input"
                        style={{ width: '150px' }}
                    />
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
                            {requests.map((r) => (
                                <tr
                                    key={r.id}
                                    onClick={() => handleOpenModal(r)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td style={{ fontWeight: 600 }}>{r.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {(r.type === 'Medical Assistance' || r.type === 'Medical') && <span style={{ color: '#ef4444' }}>🏥</span>}
                                            {(r.type === 'Food & Supplies' || r.type === 'Food') && <span style={{ color: '#f97316' }}>🍞</span>}
                                            {(r.type === 'Rescue & Evacuation' || r.type === 'Evacuation') && <span style={{ color: '#dc2626' }}>🆘</span>}
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
                                        <span className={`badge ${r.status === 'Fulfilled' ? 'badge-green' : r.status === 'Cancelled' ? 'badge-red' : r.status === 'InProgress' ? 'badge-orange' : 'badge-blue'
                                            }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <select
                                                value={r.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleStatusUpdate(r.id, e.target.value)}
                                                className="status-dropdown"
                                                style={{
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e5e7eb',
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'white',
                                                    minWidth: '120px'
                                                }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="InProgress">In Progress</option>
                                                <option value="Fulfilled">Fulfilled</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                            <button
                                                className="icon-btn"
                                                title="View details"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal(r);
                                                }}
                                                style={{ marginLeft: '0.5rem' }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ color: '#475569', fontSize: '0.875rem' }}>
                    Showing {(requests.length > 0) ? ((page - 1) * pageSize + 1) : 0}-{(page - 1) * pageSize + requests.length} of {totalCount}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        className="icon-btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>Page {page}</span>
                    <button
                        className="icon-btn"
                        onClick={() => {
                            const maxPage = Math.max(1, Math.ceil(totalCount / pageSize));
                            setPage((p) => Math.min(maxPage, p + 1));
                        }}
                        disabled={page >= Math.ceil(totalCount / pageSize)}
                    >
                        <ChevronRight size={18} />
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

            {showModal && selectedRequest && (
                <RequestDetailModal
                    request={selectedRequest}
                    onClose={handleCloseModal}
                    onStatusUpdate={(status) => handleStatusUpdate(selectedRequest.id, status)}
                />
            )}
        </div>
    );
};

export default AdminRequests;
