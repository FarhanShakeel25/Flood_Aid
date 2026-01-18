import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingRequests } from '../services/userApi';
import { Search, Filter, Eye, MapPin, Calendar, AlertCircle, User as UserIcon, CheckCircle, XCircle, LogOut } from 'lucide-react';
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

  const token = localStorage.getItem('floodaid_user_token');
  const user = JSON.parse(localStorage.getItem('floodaid_user') || '{}');

  useEffect(() => {
    if (!token || !user.id) {
      navigate('/volunteer/login');
      return;
    }
    loadRequests();
  }, [token, user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, filterType, filterStatus, filterPriority, activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPendingRequests();
      const scoped = scopeToVolunteer(data, user);
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
    return items.filter((item) => {
      const requestCityId = item.cityId ?? item.CityId;
      return cityId && requestCityId === cityId;
    });
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
      const response = await fetch(`${API_BASE}/api/helpRequest/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ volunteerId: user.id || user.Id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign request');
      }

      await loadRequests();
      setActiveTab('assigned');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setAssigningId(null);
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
                          <tr key={id}>
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
                                  <span className="assigned-badge">
                                    <CheckCircle size={14} />
                                    Assigned
                                  </span>
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
    </div>
  );
};

export default VolunteerDashboard;
