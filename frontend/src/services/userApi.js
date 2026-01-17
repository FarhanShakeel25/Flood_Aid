import { API_BASE } from '../config/apiBase';

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

export const userLogin = async (email, password) => {
  const response = await fetch(`${API_BASE}/api/auth/user-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Login failed';
    throw new Error(message);
  }

  return data;
};

export const fetchPendingRequests = async () => {
  const response = await fetch(`${API_BASE}/api/helpRequest/status/pending`);
  const data = await parseJson(response);

  if (!response.ok) {
    const message = data?.message || 'Failed to fetch requests';
    throw new Error(message);
  }

  return Array.isArray(data) ? data : [];
};

export const deleteHelpRequest = async (id, token) => {
  const response = await fetch(`${API_BASE}/api/helpRequest/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    const message = payload?.message || 'Failed to delete request';
    throw new Error(message);
  }
};
