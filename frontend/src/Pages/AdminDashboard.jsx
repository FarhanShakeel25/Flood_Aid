import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = useMemo(() => localStorage.getItem('floodaid_admin_token'), []);
  const admin = useMemo(() => {
    const stored = localStorage.getItem('floodaid_admin');
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    if (!token || !admin) {
      navigate('/admin/login');
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE || 'https://floodaid-api.onrender.com'}/api/metrics/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [token, admin, navigate]);

  if (!token || !admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-slate-300">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const priorityData = metrics?.PriorityBreakdown ? [
    { name: 'Low', value: metrics.PriorityBreakdown.Low || 0 },
    { name: 'Medium', value: metrics.PriorityBreakdown.Medium || 0 },
    { name: 'High', value: metrics.PriorityBreakdown.High || 0 },
    { name: 'Critical', value: metrics.PriorityBreakdown.Critical || 0 }
  ] : [];

  const statusData = metrics?.StatusBreakdown ? [
    { name: 'Pending', value: metrics.StatusBreakdown.Pending || 0 },
    { name: 'In Progress', value: metrics.StatusBreakdown.InProgress || 0 },
    { name: 'Fulfilled', value: metrics.StatusBreakdown.Fulfilled || 0 },
    { name: 'On Hold', value: metrics.StatusBreakdown.OnHold || 0 },
    { name: 'Cancelled', value: metrics.StatusBreakdown.Cancelled || 0 }
  ] : [];

  const PRIORITY_COLORS = {
    'Low': '#3b82f6',
    'Medium': '#eab308',
    'High': '#f97316',
    'Critical': '#ef4444'
  };

  const STATUS_COLORS = {
    'Pending': '#fbbf24',
    'In Progress': '#60a5fa',
    'Fulfilled': '#10b981',
    'On Hold': '#6366f1',
    'Cancelled': '#ef4444'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-slate-400">{admin.Role === 'SuperAdmin' ? 'All Requests' : `${admin.ProvinceName} Province`}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('floodaid_admin_token');
              localStorage.removeItem('floodaid_admin');
              navigate('/admin/login');
            }}
            className="px-4 py-2 rounded-lg border border-slate-700 text-sm hover:border-red-400 hover:text-red-200 transition"
          >
            Log out
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Requests */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <p className="text-slate-400 text-sm mb-1">Total Requests</p>
            <p className="text-3xl font-bold text-blue-400">{metrics?.TotalRequests || 0}</p>
          </div>

          {/* Fulfilled Requests */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <p className="text-slate-400 text-sm mb-1">Fulfilled</p>
            <p className="text-3xl font-bold text-emerald-400">{metrics?.FulfilledRequests || 0}</p>
          </div>

          {/* Completion Rate */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <p className="text-slate-400 text-sm mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-orange-400">{metrics?.CompletionRate || 0}%</p>
          </div>

          {/* Avg Response Time */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <p className="text-slate-400 text-sm mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-purple-400">{metrics?.AverageResponseTimeHours || 0}h</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Requests by Priority</h2>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">No data available</p>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Requests by Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">No data available</p>
            )}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Average Assignment Time */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Average Assignment Time</h2>
            <p className="text-4xl font-bold text-blue-400">{metrics?.AverageAssignmentTimeHours || 0}</p>
            <p className="text-slate-400 text-sm mt-2">hours from request to assignment</p>
          </div>

          {/* Quick Stats */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
            <h2 className="text-xl font-semibold mb-4">Request Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Critical Priority</span>
                <span className="text-xl font-semibold text-red-400">{metrics?.PriorityBreakdown?.Critical || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Unassigned</span>
                <span className="text-xl font-semibold text-yellow-400">{metrics?.StatusBreakdown?.Pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">In Progress</span>
                <span className="text-xl font-semibold text-blue-400">{metrics?.StatusBreakdown?.InProgress || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
