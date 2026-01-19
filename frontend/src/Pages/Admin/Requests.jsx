import React, { useState, useEffect } from 'react';
import { Search, MapPin, AlertTriangle, CheckCircle, XCircle, Filter, Eye, ChevronLeft, ChevronRight, Shield, Building2, User, X as XIcon } from 'lucide-react';
import '../../styles/AdminTables.css';
import RequestDetailModal from './RequestDetailModal';
import { API_BASE } from '../../config/apiBase';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminRequests = () => {
    const { admin } = useAdminAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [requestTypeFilter, setRequestTypeFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [volunteers, setVolunteers] = useState([]);
    const [loadingVolunteers, setLoadingVolunteers] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningRequestId, setAssigningRequestId] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState(null);

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

                const token = localStorage.getItem('floodaid_token');
                const response = await fetch(`${API_BASE}/api/helpRequest?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch requests');
                }
                const result = await response.json();

                const mappedRequests = (result.data || []).map((req) => ({
                    id: req.id,
                    type: mapRequestType(req.requestType),
                    location: `${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}`,
                    priority: req.priority !== undefined ? mapPriority(req.priority) : determinePriority(req.requestType),
                    priorityInt: req.priority ?? 1,
                    status: req.status,
                    assignmentStatus: req.assignmentStatus,
                    assignedToVolunteerId: req.assignedToVolunteerId,
                    reportedBy: req.requestorName || 'Anonymous',
                    phone: req.requestorPhoneNumber,
                    email: req.requestorEmail,
                    description: req.requestDescription,
                    dueDate: req.dueDate ? new Date(req.dueDate) : null,
                    createdAt: new Date(req.createdAt).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
                    updatedAt: req.updatedAt,
                    latitude: req.latitude,
                    longitude: req.longitude,
                    provinceId: req.provinceId,
                    cityId: req.cityId,
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

    const mapPriority = (priorityInt) => {
        const priorityMap = { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical' };
        return priorityMap[priorityInt] || 'Medium';
    };

    const getPriorityColor = (priorityInt) => {
        const colorMap = { 0: '#3b82f6', 1: '#f59e0b', 2: '#ef4444', 3: '#dc2626' };
        return colorMap[priorityInt] || '#3b82f6';
    };

    const getTimeRemaining = (dueDate) => {
        if (!dueDate) return '-';
        const now = new Date();
        const diffMs = new Date(dueDate) - now;
        if (diffMs < 0) return 'Overdue';
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const fetchVolunteers = async (cityId = null) => {
        try {
            setLoadingVolunteers(true);
            const params = new URLSearchParams();
            params.append('pageSize', 100);
            params.append('role', 0); // 0 = Volunteer role
            
            // Filter by city if provided (for request-specific assignment)
            if (cityId) {
                params.append('cityId', cityId);
                console.log('Filtering volunteers by cityId:', cityId);
            }

            const token = localStorage.getItem('floodaid_token');
            console.log('Fetching volunteers with params:', params.toString());
            
            const response = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fetch volunteers error response:', response.status, errorText);
                throw new Error(`Failed to fetch volunteers: ${response.status}`);
            }

            const result = await response.json();
            console.log('Fetched volunteers - Full response:', result);
            console.log('Volunteers data array:', result.data);
            console.log('Number of volunteers:', result.data?.length || 0);
            
            if (!result.data || result.data.length === 0) {
                console.warn('No volunteers found with role=0' + (cityId ? ` and cityId=${cityId}` : ''));
            }
            
            setVolunteers(result.data || []);
        } catch (err) {
            console.error('Error fetching volunteers:', err);
            alert(`Error loading volunteers: ${err.message}`);
        } finally {
            setLoadingVolunteers(false);
        }
    };

    const handleAssignClick = (requestId, e) => {
        e.stopPropagation();
        setAssigningRequestId(requestId);
        setShowAssignModal(true);
        
        // Find the request to get its cityId for filtering volunteers
        // Uses requests (which contains all fetched requests with pagination)
        const request = requests.find(r => r.id === requestId);
        const requestCityId = request?.cityId;
        
        console.log('Assignment clicked for request:', requestId, 'with cityId:', requestCityId);
        
        // Always fetch volunteers filtered by the request's city
        fetchVolunteers(requestCityId);
    };

    const handleConfirmAssignment = async () => {
        if (!selectedVolunteer || !assigningRequestId) return;

        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(
                `${API_BASE}/api/helpRequest/${assigningRequestId}/assign`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ volunteerId: selectedVolunteer.id })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to assign request');
            }

            // Update the request in the UI
            setRequests(prevRequests =>
                prevRequests.map(r =>
                    r.id === assigningRequestId
                        ? { ...r, assignedTo: selectedVolunteer.name, assignmentStatus: 'Assigned', assignedToVolunteerId: selectedVolunteer.id, status: 'InProgress' }
                        : r
                )
            );

            setShowAssignModal(false);
            setSelectedVolunteer(null);
            setAssigningRequestId(null);
            alert('Request assigned successfully!');
        } catch (err) {
            alert(`Error assigning request: ${err.message}`);
        }
    };

    const handleUnassignClick = async (requestId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to unassign this request?')) return;

        try {
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/helpRequest/${requestId}/unassign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: 'Unassigned by admin' })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to unassign request');
            }

            setRequests(prevRequests =>
                prevRequests.map(r =>
                    r.id === requestId
                        ? { ...r, assignmentStatus: 'Unassigned', assignedToVolunteerId: null, status: 'Pending', assignedTo: null }
                        : r
                )
            );
            alert('Request unassigned successfully!');
        } catch (err) {
            alert(`Error unassigning request: ${err.message}`);
        }
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
            const token = localStorage.getItem('floodaid_token');
            const response = await fetch(`${API_BASE}/api/helpRequest/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                }}>
                        <Shield size={20} />
                        <span>Viewing: {admin?.role === 'ProvinceAdmin' ? admin?.provinceName || 'Your Province' : 'All Requests'}</span>
                    <span style={{ 
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        fontSize: '0.85rem'
                    }}>
                        {totalCount} total
                    </span>
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

                    <select
                        value={priorityFilter}
                        onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                        className="status-dropdown"
                        style={{ minWidth: '140px' }}
                    >
                        <option value="All">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
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
                                <th>Due Date</th>
                                <th>Reported By</th>
                                <th>Assigned To</th>
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
                                            r.priority === 'Medium' ? 'badge-yellow' :
                                                'badge-blue'
                                            }`}>
                                            {r.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            {r.dueDate ? (
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                                                        {r.dueDate.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <div style={{ color: getTimeRemaining(r.dueDate) === 'Overdue' ? '#dc2626' : '#64748b' }}>
                                                        {getTimeRemaining(r.dueDate)}
                                                    </div>
                                                </div>
                                            ) : '-'}
                                        </div>
                                    </td>
                                    <td>{r.reportedBy}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {r.assignedToVolunteerId && r.assignmentStatus !== 'Unassigned' ? (
                                                <>
                                                    <span style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 500 }}>
                                                        {r.assignedTo}
                                                    </span>
                                                    <button
                                                        onClick={(e) => handleUnassignClick(r.id, e)}
                                                        title="Unassign"
                                                        style={{
                                                            padding: '0.4rem 0.6rem',
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleAssignClick(r.id, e)}
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        background: '#4f46e5',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <User size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                                    Assign
                                                </button>
                                            )}
                                        </div>
                                    </td>
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

            {/* Assignment Modal */}
            {showAssignModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Assign Request</h2>
                            <button
                                onClick={() => { setShowAssignModal(false); setSelectedVolunteer(null); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <XIcon size={24} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
                                Select Volunteer
                            </label>
                            {loadingVolunteers ? (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                                    Loading volunteers...
                                </div>
                            ) : (
                                <select
                                    value={selectedVolunteer?.id || ''}
                                    onChange={(e) => {
                                        const vol = volunteers.find(v => v.id === parseInt(e.target.value));
                                        setSelectedVolunteer(vol);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="">-- Select a volunteer --</option>
                                    {volunteers.length === 0 ? (
                                        <option disabled>No volunteers found</option>
                                    ) : (
                                        volunteers.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.email})
                                            </option>
                                        ))
                                    )}
                                </select>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setShowAssignModal(false); setSelectedVolunteer(null); }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAssignment}
                                disabled={!selectedVolunteer}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: selectedVolunteer ? '#4f46e5' : '#cbd5e1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: selectedVolunteer ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRequests;
