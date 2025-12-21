/**
 * Keep-Alive Service
 * Periodically pings the backend to prevent Render free tier cold start
 * Renders free tier puts services to sleep after 15 minutes of inactivity
 * This service ensures the backend stays warm by pinging every 10 minutes
 */

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
let pingInterval = null;

export const startKeepAlive = () => {
  // Only start if we're in production (Vercel)
  if (import.meta.env.MODE !== 'production' || pingInterval) {
    return;
  }

  const apiBase = import.meta.env.VITE_API_BASE;
  if (!apiBase) {
    console.warn('VITE_API_BASE not configured, keep-alive disabled');
    return;
  }

  // Initial ping
  pingBackend();

  // Set up interval
  pingInterval = setInterval(pingBackend, PING_INTERVAL);

  console.log('✅ Backend keep-alive started (pings every 10 minutes)');
};

export const stopKeepAlive = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log('⏹️ Backend keep-alive stopped');
  }
};

const pingBackend = async () => {
  try {
    const apiBase = import.meta.env.VITE_API_BASE;
    const response = await fetch(`${apiBase}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('🔄 Backend ping successful:', data.status);
    }
  } catch (error) {
    // Silently fail - don't spam console if backend is down
    console.debug('Backend ping failed (this is normal if service is starting)');
  }
};
