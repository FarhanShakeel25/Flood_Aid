import { useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const testApi = async () => {
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE}/api/dummy`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      // If ngrok still sends HTML, this will catch it
      const text = await response.text();

      try {
        const json = JSON.parse(text);
        setData(json);
      } catch {
        setError("Response was not JSON. Probably HTML from ngrok.");
        console.log("Response content:", text);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Backend API</h1>
      <button onClick={testApi}>Check URL</button>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          Error: {error}
        </p>
      )}

      {data && (
        <pre
          style={{
            background: "#eee",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "8px",
          }}
        >
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
