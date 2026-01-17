import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, AlertTriangle, CheckCircle, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../config/apiBase';
import '../styles/AdminTables.css';

const VolunteerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userToken = localStorage.getItem('floodaid_user_token');
    const userData = localStorage.getItem('floodaid_user');

    if (!userToken || !userData) {
      navigate('/volunteer/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchRequests(userToken);
  }, [page, pageSize, statusFilter, searchTerm, navigate]);

  const fetchRequests = async (token) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('pageSize', pageSize);

      if (statusFilter !== 'All') {
        params.append('status', mapStatusToInt(statusFilter));
      }

      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }

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
        status: req.status,
        reportedBy: req.requestorName || 'Anonymous',
        phone: req.requestorPhoneNumber,
        description: req.requestDescription,
        createdAt: new Date(req.createdAt).toLocaleString(),
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

  const mapStatusInt = (statusInt) => {
    const statusMap = {
      0: 'Pending',
      1: 'InProgress',
      2: 'Fulfilled',
      3: 'Cancelled',
      4: 'OnHold'
    };
    return statusMap[statusInt] || statusInt;
  };

  const handleLogout = () => {
    localStorage.removeItem('floodaid_user_token');
    localStorage.removeItem('floodaid_user');
    navigate('/volunteer/login');
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <div className="page-title">
          <h1>My Assigned Requests</h1>
          <p>View and manage requests assigned to you in {user?.cityId ? 'your city' : 'your area'}.</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.75rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="table-controls">
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
          <option value="OnHold">On Hold</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Reported By</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Description</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No requests found
              </td>
            </tr>
          ) : (
            requests.map(req => (
              <tr key={req.id}>
                <td>#{req.id}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#f1f5f9',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}>
                    {req.type}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: req.status === 'Fulfilled' ? '#dcfce7' : req.status === 'Pending' ? '#fef3c7' : '#f3f4f6',
                    color: req.status === 'Fulfilled' ? '#15803d' : req.status === 'Pending' ? '#92400e' : '#374151',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 500
                  }}>
                    {req.status}
                  </span>
                </td>
                <td>{req.reportedBy}</td>
                <td>{req.phone}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  <MapPin size={14} style={{ display: 'inline-block', marginRight: '0.25rem' }} />
                  {req.location}
                </td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.description}
                </td>
                <td style={{ fontSize: '0.85rem' }}>{req.createdAt}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalCount > pageSize && (
        <div className="pagination-controls">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ margin: '0 1rem' }}>
            Page {page} of {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            onClick={() => setPage(Math.min(Math.ceil(totalCount / pageSize), page + 1))}
            disabled={page === Math.ceil(totalCount / pageSize)}
            className="pagination-btn"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
