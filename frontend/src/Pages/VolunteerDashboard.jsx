import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteHelpRequest, fetchPendingRequests } from '../services/userApi';

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

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
        setRequests(scoped);
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
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-400 border border-slate-800 rounded-xl p-8 bg-slate-800/40">
            No requests found for your area.
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

              return (
                <div key={id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-400">Request #{id}</p>
                      <h2 className="text-lg font-semibold mt-1">{desc || 'No description provided'}</h2>
                      <div className="text-sm text-slate-400 mt-2 space-y-1">
                        <p>Type: <span className="text-emerald-200">{type}</span></p>
                        <p>Status: <span className="text-emerald-200">{status}</span></p>
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
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
