// pages/Home.jsx
import Header from "../components/Header";
import HeroSection from "../components/Hero";
import StatsSection from "../components/StatsSection";
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="home-page">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <Footer/>
      </main>
    </div>
  );
};

export default Home;