import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE } from '../../config/apiBase';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = useMemo(() => localStorage.getItem('floodaid_token'), []);
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
        const response = await fetch(`${API_BASE}/api/metrics/dashboard`, {
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
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [token, admin, navigate]);

  if (!token || !admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-slate-300">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p>Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3">
          <p className="font-semibold">Error Loading Dashboard</p>
          <p className="text-sm mt-1">{error}</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-400">{admin.Role === 'SuperAdmin' ? 'All Requests Metrics' : `${admin.ProvinceName} Province Metrics`}</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6 hover:border-slate-700 transition">
          <p className="text-slate-400 text-sm mb-1">Total Requests</p>
          <p className="text-3xl font-bold text-blue-400">{metrics?.TotalRequests || 0}</p>
          <p className="text-slate-500 text-xs mt-2">All submitted requests</p>
        </div>

        {/* Fulfilled Requests */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6 hover:border-slate-700 transition">
          <p className="text-slate-400 text-sm mb-1">Fulfilled</p>
          <p className="text-3xl font-bold text-emerald-400">{metrics?.FulfilledRequests || 0}</p>
          <p className="text-slate-500 text-xs mt-2">Completed requests</p>
        </div>

        {/* Completion Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6 hover:border-slate-700 transition">
          <p className="text-slate-400 text-sm mb-1">Completion Rate</p>
          <p className="text-3xl font-bold text-orange-400">{metrics?.CompletionRate || 0}%</p>
          <p className="text-slate-500 text-xs mt-2">Success rate</p>
        </div>

        {/* Avg Response Time */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6 hover:border-slate-700 transition">
          <p className="text-slate-400 text-sm mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-purple-400">{Math.round(metrics?.AverageResponseTimeHours || 0)}</p>
          <p className="text-slate-500 text-xs mt-2">hours to fulfill</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
          <h2 className="text-xl font-semibold mb-4">Requests by Priority</h2>
          {priorityData.length > 0 && priorityData.some(d => d.value > 0) ? (
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
          {statusData.length > 0 && statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Assignment Time */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
          <h2 className="text-xl font-semibold mb-4">Average Assignment Time</h2>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-blue-400">{Math.round(metrics?.AverageAssignmentTimeHours || 0)}</p>
              <p className="text-slate-400 text-sm mt-2">hours from request to assignment</p>
            </div>
            <div className="text-5xl opacity-20">⏱️</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6">
          <h2 className="text-xl font-semibold mb-4">Request Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">🔴 Critical Priority</span>
              <span className="text-xl font-semibold text-red-400">{metrics?.PriorityBreakdown?.Critical || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">⏳ Pending</span>
              <span className="text-xl font-semibold text-yellow-400">{metrics?.StatusBreakdown?.Pending || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <span className="text-slate-400">🔄 In Progress</span>
              <span className="text-xl font-semibold text-blue-400">{metrics?.StatusBreakdown?.InProgress || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">✅ Fulfilled</span>
              <span className="text-xl font-semibold text-emerald-400">{metrics?.StatusBreakdown?.Fulfilled || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-slate-500 text-xs">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AdminDashboard;
