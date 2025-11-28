import { Header } from "./components/Header/Header"; // named export
import HeroSection from "./components/Header/Hero";
import Footer from "./components/Header/Footer";
import StatsSection from "./components/Header/StatsSection";
function App() {
  return (
    <>
      <Header />
      <HeroSection />
      <StatsSection />
      <Footer />
    </>
  );
}

export default App;