import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userLogin } from '../services/userApi';

const VolunteerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('floodaid_user_token');
    if (token) {
      navigate('/volunteer/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const data = await userLogin(email, password);

      if (!data?.success || !data?.token || !data?.user) {
        setError(data?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      localStorage.setItem('floodaid_user_token', data.token);
      localStorage.setItem('floodaid_user', JSON.stringify(data.user));

      navigate('/volunteer/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4">
      <div className="w-full max-w-md bg-slate-800/70 border border-slate-700 rounded-2xl shadow-2xl p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold text-center mb-2">Volunteer Login</h1>
        <p className="text-sm text-slate-300 text-center mb-6">Sign in with the email and password set during invitation acceptance.</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center text-sm text-emerald-200 hover:text-emerald-100"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default VolunteerLogin;
