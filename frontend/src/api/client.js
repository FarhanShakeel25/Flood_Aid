// frontend/src/api/client.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers||{}) },
    ...opts
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }
  return res.json().catch(()=>null);
}

export async function getHealth() {
  return request("/api/health", { method: "GET" });
}

// export more api helpers here as you add endpoints
export default { getHealth };
