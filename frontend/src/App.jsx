import { Header } from "./components/Header/Header"; // named export
import HeroSection from "./components/Header/Hero";
import Footer from "./components/Header/Footer";
import StatsSection from "./components/Header/StatsSection";
import FloodAidChatbot from "./components/FloodAidChatbot/FloodAidChatbot"; // ✨ ADD THIS

function App() {
  // ✨ ADD THIS - Handle emergency situations
  const handleEmergency = (message) => {
    console.log('🚨 EMERGENCY DETECTED:', message);
    
    // You can add additional emergency handling here:
    // - Show alert banner
    // - Play notification sound
    // - Send to backend API
    // - Trigger emergency notification
    
    // Example: Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Emergency Alert! ', {
        body: 'Emergency situation detected in chatbot',
        icon: '/flood-icon.png'
      });
    }
  };

  return (
    <>
      <Header />
      <HeroSection />
      <StatsSection />
      <Footer />
      
      {/* ✨ ADD THIS - Multilingual Flood Aid Chatbot */}
      <FloodAidChatbot
        apiKey={import.meta.env.VITE_GEMINI_API_KEY}
        model="gemini-pro"
        position="bottom-right"
        onEmergency={handleEmergency}
      />
    </>
  );
}

export default App;