import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteHelpRequest, fetchPendingRequests, unassignHelpRequest } from '../services/userApi';
import UnassignModal from '../components/UnassignModal';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'assigned'
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [unassignRequestId, setUnassignRequestId] = useState(null);

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
    } catch (err) {
      setError(err.message || 'Failed to delete request');
    } finally {
      setActionId(null);
    }
  };

  const handleUnassignClick = (requestId) => {
    setUnassignRequestId(requestId);
    setShowUnassignModal(true);
  };

  const handleUnassignConfirm = async (requestId, reason) => {
    if (!token) {
      navigate('/volunteer/login');
      return;
    }

    try {
      await unassignHelpRequest(requestId, reason, token);
      // Move request from assigned to available
      const request = assignedRequests.find((r) => (r.id ?? r.Id) === requestId);
      if (request) {
        request.assignmentStatus = 'Unassigned';
        request.assignedToVolunteerId = null;
        setRequests((prev) => [...prev, request]);
        setAssignedRequests((prev) => prev.filter((r) => (r.id ?? r.Id) !== requestId));
      }
    } catch (err) {
      setError(err.message || 'Failed to unassign request');
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

  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm text-slate-400">Signed in as</p>
            <h1 className="text-2xl font-semibold">{user.name || user.Name}</h1>
            <p className="text-slate-300 text-sm">{user.email || user.Email}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('floodaid_user_token');
              localStorage.removeItem('floodaid_user');
              navigate('/volunteer/login');
            }}
            className="px-4 py-2 rounded-lg border border-slate-700 text-sm hover:border-red-400 hover:text-red-200 transition"
          >
            Log out
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-300">Loading requests...</div>
        ) : (
          <>
            {/* Tab Buttons */}
            <div className="flex gap-4 mb-6 border-b border-slate-700">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Available Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === 'assigned'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Assigned to Me ({assignedRequests.length})
              </button>
            </div>

            {/* Available Requests Tab */}
            {activeTab === 'available' && (
              requests.length === 0 ? (
                <div className="text-center text-slate-400 border border-slate-800 rounded-xl p-8 bg-slate-800/40">
                  No unassigned requests in your area.
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((req) => {
                    const id = req.id ?? req.Id;
                    const desc = req.requestDescription ?? req.RequestDescription;
                    const type = req.requestType ?? req.RequestType;
                    const status = req.status ?? req.Status;
                    const province = req.provinceId ?? req.ProvinceId;
                    const city = req.cityId ?? req.CityId;
                    const priority = req.priority !== undefined ? mapPriority(req.priority) : 'Medium';
                    const dueDate = req.dueDate ? new Date(req.dueDate) : null;

                    return (
                      <div key={id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-slate-400">Request #{id}</p>
                            <h2 className="text-lg font-semibold mt-1">{desc || 'No description provided'}</h2>
                            <div className="text-sm text-slate-400 mt-2 space-y-1">
                              <p>Type: <span className="text-emerald-200">{type}</span></p>
                              <p>Status: <span className="text-emerald-200">{status}</span></p>
                              <p>Priority: <span className={priority === 'Critical' ? 'text-red-200' : priority === 'High' ? 'text-orange-200' : 'text-blue-200'}>{priority}</span></p>
                              {dueDate && <p>Due: <span className={getTimeRemaining(dueDate) === 'Overdue' ? 'text-red-200' : 'text-emerald-200'}>{dueDate.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} ({getTimeRemaining(dueDate)})</span></p>}
                              <p>ProvinceId: {province ?? 'N/A'} | CityId: {city ?? 'N/A'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(id)}
                            disabled={actionId === id}
                            className="px-3 py-2 text-sm rounded-lg bg-red-500/90 hover:bg-red-400 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionId === id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Assigned Requests Tab */}
            {activeTab === 'assigned' && (
              assignedRequests.length === 0 ? (
                <div className="text-center text-slate-400 border border-slate-800 rounded-xl p-8 bg-slate-800/40">
                  You have no assigned requests.
                </div>
              ) : (
                <div className="grid gap-4">
                  {assignedRequests.map((req) => {
                    const id = req.id ?? req.Id;
                    const desc = req.requestDescription ?? req.RequestDescription;
                    const type = req.requestType ?? req.RequestType;
                    const assignStatus = req.assignmentStatus ?? 'Assigned';
                    const province = req.provinceId ?? req.ProvinceId;
                    const city = req.cityId ?? req.CityId;
                    const priority = req.priority !== undefined ? mapPriority(req.priority) : 'Medium';
                    const dueDate = req.dueDate ? new Date(req.dueDate) : null;

                    return (
                      <div key={id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-slate-400">Request #{id}</p>
                            <h2 className="text-lg font-semibold mt-1">{desc || 'No description provided'}</h2>
                            <div className="text-sm text-slate-400 mt-2 space-y-1">
                              <p>Type: <span className="text-emerald-200">{type}</span></p>
                              <p>Assignment Status: <span className="text-yellow-200">{assignStatus}</span></p>
                              <p>Priority: <span className={priority === 'Critical' ? 'text-red-200' : priority === 'High' ? 'text-orange-200' : 'text-blue-200'}>{priority}</span></p>
                              {dueDate && <p>Due: <span className={getTimeRemaining(dueDate) === 'Overdue' ? 'text-red-200' : 'text-emerald-200'}>{dueDate.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} ({getTimeRemaining(dueDate)})</span></p>}
                              <p>ProvinceId: {province ?? 'N/A'} | CityId: {city ?? 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 mb-3">
                              Assigned
                            </span>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleUnassignClick(id)}
                                className="px-3 py-2 text-sm rounded-lg bg-orange-500/90 hover:bg-orange-400 text-white transition"
                              >
                                Unassign
                              </button>
                              <button
                                onClick={() => handleDelete(id)}
                                disabled={actionId === id}
                                className="px-3 py-2 text-sm rounded-lg bg-red-500/90 hover:bg-red-400 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {actionId === id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        <UnassignModal
          requestId={unassignRequestId}
          isOpen={showUnassignModal}
          onClose={() => {
            setShowUnassignModal(false);
            setUnassignRequestId(null);
          }}
          onConfirm={handleUnassignConfirm}
        />
      </div>
    </div>
  );
};

export default VolunteerDashboard;
