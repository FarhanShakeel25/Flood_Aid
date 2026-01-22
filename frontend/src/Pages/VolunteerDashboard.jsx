import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingRequests } from '../services/userApi';
import { Search, Filter, Eye, MapPin, Calendar, AlertCircle, User as UserIcon, CheckCircle, XCircle, LogOut } from 'lucide-react';
import RequestDetailModal from './Admin/RequestDetailModal';
import '../styles/VolunteerDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://flood-aid.onrender.com';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [activeTab, setActiveTab] = useState('available');
  const [assigningId, setAssigningId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawRequestId, setWithdrawRequestId] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawEvidenceUrl, setWithdrawEvidenceUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const token = localStorage.getItem('floodaid_user_token');
  const user = JSON.parse(localStorage.getItem('floodaid_user') || '{}');

  useEffect(() => {
    if (!token || !user.id) {
      navigate('/volunteer/login');
      return;
    }
    loadRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, filterType, filterStatus, filterPriority, activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPendingRequests();
      console.log('All pending requests from API:', data.length);
      const scoped = scopeToVolunteer(data, user);
      console.log('After city scoping:', scoped.length, 'City ID:', user.cityId || user.CityId);
      console.log('Requests breakdown:', {
        total: data.length,
        inUserCity: scoped.length,
        unassigned: scoped.filter(r => !r.assignedToVolunteerId || r.assignmentStatus === 'Unassigned').length
      });
      setRequests(scoped);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const scopeToVolunteer = (items, volunteer) => {
    if (!Array.isArray(items) || !volunteer) return [];
    const cityId = volunteer.cityId ?? volunteer.CityId;
    
    if (!cityId) {
      console.warn('Volunteer has no cityId, cannot scope requests');
      return [];
    }

    const filtered = items.filter((item) => {
      const requestCityId = item.cityId ?? item.CityId;
      const match = requestCityId && requestCityId === cityId;
      if (!match && requestCityId) {
        console.log('Request filtered out - city mismatch:', { requestCityId, userCityId: cityId });
      }
      return match;
    });
    console.log('Scoped to user city:', { totalRequests: items.length, filteredByCity: filtered.length, userCityId: cityId });
    return filtered;
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Tab filter
    if (activeTab === 'available') {
      filtered = filtered.filter(r => !r.assignedToVolunteerId || r.assignmentStatus === 'Unassigned');
    } else if (activeTab === 'assigned') {
      filtered = filtered.filter(r => r.assignedToVolunteerId === user.id || r.assignedToVolunteerId === user.Id);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.requestDescription || '').toLowerCase().includes(term) ||
        (r.requestorName || '').toLowerCase().includes(term) ||
        (r.requestorEmail || '').toLowerCase().includes(term) ||
        (r.requestorPhoneNumber || '').toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.requestType === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(r => mapPriority(r.priority) === filterPriority);
    }

    setFilteredRequests(filtered);
  };

  const handleSelfAssign = async (requestId) => {
    if (!window.confirm('Do you want to assign this request to yourself?')) return;

    setAssigningId(requestId);
    try {
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      if (!user.id && !user.Id) {
        throw new Error('User ID not found. Please log in again.');
      }

      const volunteerId = user.id || user.Id;
      const payload = { volunteerId };
      
      // Debug: Log token details (first 20 chars + ... + last 20 chars for security)
      const tokenPreview = token.length > 40 ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : token;
      console.log('Self-assigning with:', {
        requestId,
        volunteerId,
        tokenLength: token.length,
        tokenPreview,
        API_BASE,
        hasToken: !!token,
        userEmail: user.email || 'N/A',
        userRole: user.role || 'N/A'
      });

      const response = await fetch(`${API_BASE}/api/helpRequest/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to assign request';
        let errorData = null;
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        console.error('Assignment failed with response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Assignment successful:', result);
      await loadRequests();
      setActiveTab('assigned');
      alert('Request assigned to you successfully!');
    } catch (err) {
      console.error('Assignment error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setAssigningId(null);
    }
  };

  const handleOpenWithdraw = (requestId) => {
    setWithdrawRequestId(requestId);
    setWithdrawReason('');
    setWithdrawEvidenceUrl('');
    setShowWithdrawModal(true);
  };

  const handleCloseWithdraw = () => {
    setShowWithdrawModal(false);
    setWithdrawRequestId(null);
    setWithdrawReason('');
    setWithdrawEvidenceUrl('');
  };

  const handleWithdraw = async () => {
    if (!withdrawRequestId) return;
    if (!window.confirm('Confirm: withdraw from this assignment?')) return;

    setWithdrawingId(withdrawRequestId);
    try {
      if (!token) throw new Error('No authentication token found.');

      const payload = {
        reason: withdrawReason || undefined,
        evidenceUrl: withdrawEvidenceUrl || undefined,
      };

      const response = await fetch(`${API_BASE}/api/helpRequest/${withdrawRequestId}/unassign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to withdraw';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Withdraw successful:', result);
      await loadRequests();
      setActiveTab('available');
      alert('You have withdrawn from this request.');
    } catch (err) {
      console.error('Withdraw error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setWithdrawingId(null);
      handleCloseWithdraw();
    }
  };

  const mapPriority = (priority) => {
    const map = { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical' };
    return map[priority] || 'Medium';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return '#dc2626';
      case 'High': return '#ea580c';
      case 'Medium': return '#ca8a04';
      default: return '#2563eb';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Medical': '🏥',
      'Food': '🍲',
      'Shelter': '🏠',
      'Water': '💧',
      'Rescue': '🚑',
      'Other': '📦'
    };
    return icons[type] || '📦';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createFullRequest = (req) => ({
    id: req.id ?? req.Id,
    type: req.requestType ?? req.RequestType,
    location: `${req.latitude ?? req.Latitude}, ${req.longitude ?? req.Longitude}`,
    priority: mapPriority(req.priority),
    priorityInt: req.priority ?? 1,
    status: req.status ?? req.Status,
    reportedBy: req.requestorName ?? req.RequestorName ?? 'Anonymous',
    phone: req.requestorPhoneNumber ?? req.RequestorPhoneNumber,
    email: req.requestorEmail ?? req.RequestorEmail,
    description: req.requestDescription ?? req.RequestDescription,
    dueDate: req.dueDate ?? req.DueDate,
    createdAt: req.createdAt ?? req.CreatedAt,
    updatedAt: req.updatedAt ?? req.UpdatedAt,
    latitude: req.latitude ?? req.Latitude,
    longitude: req.longitude ?? req.Longitude,
    requestorName: req.requestorName ?? req.RequestorName,
    requestorPhoneNumber: req.requestorPhoneNumber ?? req.RequestorPhoneNumber,
    requestorEmail: req.requestorEmail ?? req.RequestorEmail,
    requestDescription: req.requestDescription ?? req.RequestDescription,
    requestType: req.requestType ?? req.RequestType
  });

  const handleOpenModal = (req) => {
    const fullRequest = createFullRequest(req);
    setSelectedRequest(fullRequest);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    // Volunteers typically won't update status, but keeping this for consistency
    alert('Status updates are managed by admins');
  };

  const availableCount = requests.filter(r => !r.assignedToVolunteerId || r.assignmentStatus === 'Unassigned').length;
  const assignedCount = requests.filter(r => r.assignedToVolunteerId === (user.id || user.Id)).length;

  return (
    <div className="volunteer-dashboard-new">
      {/* Header */}
      <header className="dashboard-header-new">
        <div className="header-container">
          <div className="header-left">
            <h1 className="dashboard-title">Relief Requests</h1>
            <p className="dashboard-subtitle">Viewing: {activeTab === 'available' ? 'Available' : 'My Assigned'} Requests • {filteredRequests.length} total</p>
          </div>
          <div className="header-right">
            <div className="user-info-header">
              <UserIcon size={20} />
              <span>{user.name || user.Name}</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('floodaid_user_token');
                localStorage.removeItem('floodaid_user');
                navigate('/volunteer/login');
              }}
              className="logout-btn-new"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main-new">
        <div className="dashboard-content">
          {/* Tabs */}
          <div className="tabs-row">
            <button
              onClick={() => setActiveTab('available')}
              className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
            >
              <span className="tab-icon">📋</span>
              Available Requests
              <span className="tab-badge">{availableCount}</span>
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
            >
              <span className="tab-icon">✅</span>
              My Assigned Tasks
              <span className="tab-badge">{assignedCount}</span>
            </button>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search name/phone/email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="all">All Types</option>
              <option value="Medical">Medical</option>
              <option value="Food">Food & Supplies</option>
              <option value="Shelter">Shelter</option>
              <option value="Water">Water</option>
              <option value="Rescue">Rescue & Evacuation</option>
              <option value="Other">Other</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>

            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="filter-select">
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner-new"></div>
              <p>Loading requests...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="table-container-new">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>TYPE</th>
                      <th>LOCATION</th>
                      <th>PRIORITY</th>
                      <th>DUE DATE</th>
                      <th>REPORTED BY</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">
                          <div className="empty-state-table">
                            <span className="empty-icon">📭</span>
                            <p>No requests found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => {
                        const id = req.id ?? req.Id;
                        const type = req.requestType ?? req.RequestType;
                        const priority = mapPriority(req.priority);
                        const status = req.status ?? req.Status;
                        const lat = req.latitude ?? req.Latitude;
                        const lng = req.longitude ?? req.Longitude;
                        const reportedBy = req.requestorName ?? req.RequestorName ?? 'Anonymous';
                        const dueDate = req.dueDate ?? req.DueDate;

                        return (
                          <tr 
                            key={id} 
                            onClick={() => handleOpenModal(req)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="td-id">{id}</td>
                            <td>
                              <div className="type-cell">
                                <span className="type-icon">{getTypeIcon(type)}</span>
                                <span>{type}</span>
                              </div>
                            </td>
                            <td>
                              <div className="location-cell">
                                <MapPin size={14} />
                                <span>{lat?.toFixed(4)}, {lng?.toFixed(4)}</span>
                              </div>
                            </td>
                            <td>
                              <span 
                                className="priority-badge-new" 
                                style={{ backgroundColor: getPriorityColor(priority) }}
                              >
                                {priority}
                              </span>
                            </td>
                            <td>
                              <div className="date-cell">
                                {dueDate ? formatDate(dueDate) : '-'}
                              </div>
                            </td>
                            <td>{reportedBy}</td>
                            <td>
                              <span className={`status-badge-new status-${status.toLowerCase()}`}>
                                {status}
                              </span>
                            </td>
                            <td>
                              <div className="actions-cell">
                                {activeTab === 'available' ? (
                                  <button
                                    onClick={() => handleSelfAssign(id)}
                                    disabled={assigningId === id}
                                    className="assign-btn-new"
                                    title="Assign to me"
                                  >
                                    {assigningId === id ? '⏳' : '✋ Assign'}
                                  </button>
                                ) : (
                                  <>
                                    <span className="assigned-badge">
                                      <CheckCircle size={14} />
                                      Assigned
                                    </span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleOpenWithdraw(id); }}
                                      disabled={withdrawingId === id}
                                      className="unassign-btn-new"
                                      title="Withdraw with proof"
                                      style={{ marginLeft: 8 }}
                                    >
                                      {withdrawingId === id ? '⏳' : '🚪 Withdraw'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Request Detail Modal */}
      {showModal && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onStatusUpdate={(status) => handleStatusUpdate(selectedRequest.id, status)}
        />
      )}

      {showWithdrawModal && (
        <div className="modal-backdrop" onClick={handleCloseWithdraw}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Withdraw From Assignment</h3>
            <div className="modal-field">
              <label>Reason (required)</label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Describe why you need to withdraw"
                rows={3}
              />
            </div>
            <div className="modal-field">
              <label>Evidence URL (optional)</label>
              <input
                type="url"
                value={withdrawEvidenceUrl}
                onChange={(e) => setWithdrawEvidenceUrl(e.target.value)}
                placeholder="Link to supporting evidence (image/doc)"
              />
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={handleCloseWithdraw}>Cancel</button>
              <button className="primary-btn" onClick={handleWithdraw} disabled={!withdrawReason.trim()}>
                {withdrawingId === withdrawRequestId ? '⏳' : 'Confirm Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
