// frontend/src/App.jsx
import { useEffect, useState } from "react";
import { getHealth } from "./api/client";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHealth();
      setData(res);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>FloodAid — Frontend</h1>

      <div style={{ marginTop: 12 }}>
        <button onClick={fetchHealth}>Retry</button>
      </div>

      <div style={{ marginTop: 18 }}>
        {loading && <div>Loading backend response…</div>}
        {error && <pre style={{ color: "crimson" }}>Error: {error}</pre>}
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </div>
  );
}
