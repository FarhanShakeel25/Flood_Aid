import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/HomePage';
import Contact from './Pages/ContactPage';
import Donations from './components/donations'; // Add this import
import FloodAidChatbot from './components/FloodAidChatbot';
import './styles/globals.css';

function App() {
  const handleEmergency = (message) => {
    console.log('🚨 EMERGENCY DETECTED:', message);
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/donate" element={<Donations />} /> {/* Add this route */}
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