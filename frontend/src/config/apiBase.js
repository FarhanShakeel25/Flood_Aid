// Shared API base resolver for frontend
// Prefers VITE_API_BASE, falls back to localhost for dev and Render for prod
const envBase = import.meta.env?.VITE_API_BASE?.replace(/\/$/, '');
const inferredBase = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5273'
  : 'https://floodaid-api.onrender.com';

export const API_BASE = (envBase || inferredBase).replace(/\/$/, '');
