import { Header } from "./components/Header/Header";
import HeroSection from "./components/Header/Hero";
import Footer from "./components/Header/Footer";
import StatsSection from "./components/Header/StatsSection";
import FloodAidChatbot from "./components/FloodAidChatbot/FloodAidChatbot";

function App() {
  const handleEmergency = (message) => {
    console.log('🚨 EMERGENCY DETECTED:', message);
  };

  return (
    <>
      <Header />
      <HeroSection />
      <StatsSection />
      <Footer />
      
      <FloodAidChatbot
        apiKey={import.meta.env.VITE_MISTRAL_API_KEY}
        model="mistral-large-latest"
        aiProvider="mistral"
        position="bottom-right"
        onEmergency={handleEmergency}
      />
    </>
  );
}

export default App;