import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteHelpRequest, fetchPendingRequests } from '../services/userApi';
import { MapPin, Clock, AlertCircle, CheckCircle, Heart, LogOut, Filter } from 'lucide-react';
import '../styles/VolunteerDashboard.css';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const [filterPriority, setFilterPriority] = useState('all');

  const token = useMemo(() => localStorage.getItem('floodaid_user_token'), []);
  const user = useMemo(() => {
    const stored = localStorage.getItem('floodaid_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    if (!token || !user) {
      navigate('/volunteer/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPendingRequests();
        const scoped = scopeToVolunteer(data, user);
        
        // Separate available and assigned requests
        const available = scoped.filter(r => !r.assignedToVolunteerId || r.assignmentStatus === 'Unassigned');
        const assigned = scoped.filter(r => r.assignedToVolunteerId && r.assignmentStatus !== 'Unassigned');
        
        setRequests(available);
        setAssignedRequests(assigned);
      } catch (err) {
        setError(err.message || 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, token, user]);

  const scopeToVolunteer = (items, volunteer) => {
    if (!Array.isArray(items) || !volunteer) return [];

    const cityId = volunteer.cityId ?? volunteer.CityId;
    const provinceId = volunteer.provinceId ?? volunteer.ProvinceId;

    return items.filter((item) => {
      const requestCityId = item.cityId ?? item.CityId;
      const requestProvinceId = item.provinceId ?? item.ProvinceId;

      if (cityId && requestCityId) {
        return requestCityId === cityId;
      }

      if (provinceId && requestProvinceId) {
        return requestProvinceId === provinceId;
      }

      return true;
    });
  };

  const handleDelete = async (id) => {
    if (!token) {
      navigate('/volunteer/login');
      return;
    }

    setActionId(id);
    setError('');
    try {
      await deleteHelpRequest(id, token);
      setRequests((prev) => prev.filter((r) => (r.id ?? r.Id) !== id));
      setAssignedRequests((prev) => prev.filter((r) => (r.id ?? r.Id) !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete request');
    } finally {
      setActionId(null);
    }
  };

  const mapPriority = (priorityInt) => {
    const priorityMap = { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical' };
    return priorityMap[priorityInt] || 'Medium';
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

  const getRequestTypeIcon = (type) => {
    const typeMap = {
      'Medical': '🏥',
      'Food': '🍲',
      'Shelter': '🏠',
      'Water': '💧',
      'Other': '❓'
    };
    return typeMap[type] || '❓';
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      default: return '#3b82f6';
    }
  };

  const filterRequests = (reqs) => {
    if (filterPriority === 'all') return reqs;
    return reqs.filter(r => {
      const priority = r.priority !== undefined ? mapPriority(r.priority) : 'Medium';
      return priority === filterPriority;
    });
  };

  if (!token || !user) {
    return null;
  }

  const filteredAvailable = filterRequests(requests);
  const filteredAssigned = filterRequests(assignedRequests);

  return (
    <div className="volunteer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">
              <Heart size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="user-name">{user.name || user.Name}</h1>
              <p className="user-email">{user.email || user.Email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('floodaid_user_token');
              localStorage.removeItem('floodaid_user');
              navigate('/volunteer/login');
            }}
            className="logout-btn"
            title="Logout"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading help requests...</p>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <div className="stats-bar">
                <div className="stat-card">
                  <span className="stat-icon">📋</span>
                  <div>
                    <p className="stat-label">Available</p>
                    <p className="stat-value">{requests.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">✅</span>
                  <div>
                    <p className="stat-label">Assigned</p>
                    <p className="stat-value">{assignedRequests.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🚨</span>
                  <div>
                    <p className="stat-label">Critical</p>
                    <p className="stat-value">
                      {requests.filter(r => mapPriority(r.priority) === 'Critical').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-container">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
                >
                  <span className="tab-icon">📋</span>
                  Available Requests
                  <span className="tab-count">{requests.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
                >
                  <span className="tab-icon">✅</span>
                  My Tasks
                  <span className="tab-count">{assignedRequests.length}</span>
                </button>
              </div>

              {/* Filter */}
              <div className="filter-container">
                <Filter size={18} />
                <select 
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="Critical">🔴 Critical</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🔵 Low</option>
                </select>
              </div>

              {/* Requests Grid */}
              {activeTab === 'available' && (
                filteredAvailable.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🌊</div>
                    <p className="empty-title">No Available Requests</p>
                    <p className="empty-subtitle">Check back later for new help requests in your area</p>
                  </div>
                ) : (
                  <div className="requests-grid">
                    {filteredAvailable.map((req) => {
                      const id = req.id ?? req.Id;
                      const desc = req.requestDescription ?? req.RequestDescription;
                      const type = req.requestType ?? req.RequestType;
                      const status = req.status ?? req.Status;
                      const priority = req.priority !== undefined ? mapPriority(req.priority) : 'Medium';
                      const dueDate = req.dueDate ? new Date(req.dueDate) : null;
                      const timeRemaining = dueDate ? getTimeRemaining(dueDate) : 'No deadline';

                      return (
                        <div key={id} className="request-card available">
                          <div className="card-header">
                            <div className="type-badge">
                              <span>{getRequestTypeIcon(type)}</span>
                              <span>{type}</span>
                            </div>
                            <div className="priority-badge" style={{ backgroundColor: getPriorityColor(priority) }}>
                              {priority}
                            </div>
                          </div>

                          <h3 className="card-title">{desc || 'Help Request'}</h3>

                          <div className="card-details">
                            <div className="detail-row">
                              <MapPin size={16} className="detail-icon" />
                              <span>📍 Location details available</span>
                            </div>

                            {dueDate && (
                              <div className={`detail-row ${timeRemaining === 'Overdue' ? 'overdue' : ''}`}>
                                <Clock size={16} className="detail-icon" />
                                <span>
                                  {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {' '}
                                  <strong>({timeRemaining})</strong>
                                </span>
                              </div>
                            )}

                            <div className="detail-row">
                              <AlertCircle size={16} className="detail-icon" />
                              <span>Request #{id}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(id)}
                            disabled={actionId === id}
                            className="delete-btn"
                          >
                            {actionId === id ? '⏳ Removing...' : '❌ Delete'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {activeTab === 'assigned' && (
                filteredAssigned.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✋</div>
                    <p className="empty-title">No Assigned Tasks</p>
                    <p className="empty-subtitle">You haven't been assigned any requests yet. Check available requests!</p>
                  </div>
                ) : (
                  <div className="requests-grid">
                    {filteredAssigned.map((req) => {
                      const id = req.id ?? req.Id;
                      const desc = req.requestDescription ?? req.RequestDescription;
                      const type = req.requestType ?? req.RequestType;
                      const priority = req.priority !== undefined ? mapPriority(req.priority) : 'Medium';
                      const dueDate = req.dueDate ? new Date(req.dueDate) : null;
                      const timeRemaining = dueDate ? getTimeRemaining(dueDate) : 'No deadline';

                      return (
                        <div key={id} className="request-card assigned">
                          <div className="card-header">
                            <div className="type-badge">
                              <span>{getRequestTypeIcon(type)}</span>
                              <span>{type}</span>
                            </div>
                            <div className="status-badge">
                              <CheckCircle size={16} />
                              Assigned
                            </div>
                          </div>

                          <h3 className="card-title">{desc || 'Help Request'}</h3>

                          <div className="card-details">
                            <div className="detail-row">
                              <MapPin size={16} className="detail-icon" />
                              <span>📍 Location details available</span>
                            </div>

                            {dueDate && (
                              <div className={`detail-row ${timeRemaining === 'Overdue' ? 'overdue' : ''}`}>
                                <Clock size={16} className="detail-icon" />
                                <span>
                                  {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {' '}
                                  <strong>({timeRemaining})</strong>
                                </span>
                              </div>
                            )}

                            <div className="detail-row priority">
                              <AlertCircle size={16} className="detail-icon" style={{ color: getPriorityColor(priority) }} />
                              <span style={{ color: getPriorityColor(priority), fontWeight: '600' }}>
                                {priority} Priority
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(id)}
                            disabled={actionId === id}
                            className="delete-btn"
                          >
                            {actionId === id ? '⏳ Removing...' : '❌ Delete'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VolunteerDashboard;
