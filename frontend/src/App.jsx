import { Header } from "./components/Header/Header"; // named export

function App() {
  return (
    <>
      <Header />
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Header Test Page</h1>
        <p>If you see the header above, it works correctly.</p>
      </div>
    </>
  );
}

export default App;