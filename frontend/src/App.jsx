import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './Pages/HomePage';
import Contact from './Pages/ContactPage';
import Donations from './components/donations';
import SuccessPage from './Pages/SuccessPage';
import CancelPage from './Pages/CancelPage';
import FloodAidChatbot from './components/FloodAidChatbot';
import { startKeepAlive } from './services/keepAliveService';
import './styles/globals.css';

function App() {
  const handleEmergency = (message) => {
    console.log('🚨 EMERGENCY DETECTED:', message);
  };

  // Start backend keep-alive on app load
  useEffect(() => {
    startKeepAlive();
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donations />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/cancel" element={<CancelPage />} />
        </Routes>
        
        <FloodAidChatbot
          apiKey={import.meta.env.VITE_MISTRAL_API_KEY}
          model="mistral-large-latest"
          aiProvider="mistral"
          position="bottom-right"
          onEmergency={handleEmergency}
        />
      </div>
    </Router>
  );
}

export default App;