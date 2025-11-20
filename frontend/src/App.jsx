import { useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDummyData = async () => {
    setError(null);
    setData(null);
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";
      const response = await fetch(`${apiBase}/api/dummy`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error("Response is not JSON. Received HTML from ngrok.");
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>
        Backend API Test
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
        Click the button below to fetch dummy data from the backend
      </p>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={fetchDummyData}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: loading ? "#95a5a6" : "#3498db",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
          onMouseOver={(e) => {
            if (!loading) e.target.style.backgroundColor = "#2980b9";
          }}
          onMouseOut={(e) => {
            if (!loading) e.target.style.backgroundColor = "#3498db";
          }}
        >
          {loading ? "Loading..." : "Fetch Dummy Data"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#ffe6e6",
            border: "1px solid #ff4d4d",
            borderRadius: "6px",
            color: "#d32f2f",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: "20px" }}>
          <h2 style={{ color: "#27ae60", marginBottom: "10px" }}>
            ✓ Success! Data received:
          </h2>
          <pre
            style={{
              background: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              overflow: "auto",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!data && !error && !loading && (
        <p
          style={{
            marginTop: "30px",
            textAlign: "center",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          No data yet. Click the button to fetch data from the backend.
        </p>
      )}
    </div>
  );
}

export default App;