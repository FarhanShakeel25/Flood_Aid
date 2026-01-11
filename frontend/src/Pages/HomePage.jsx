// pages/Home.jsx
import React, { useState } from 'react';
import Header from "../components/Header";
import HeroSection from "../components/Hero";
import StatsSection from "../components/StatsSection";
import Footer from '../components/Footer';
import Experience from "../components/Experience";

const Home = () => {
  const [isExperienceActive, setIsExperienceActive] = useState(true);

  const handleExperienceComplete = () => {
    setIsExperienceActive(false);
  };

  return (
    <>
      {isExperienceActive ? (
        <Experience onComplete={handleExperienceComplete} />
      ) : (
        /* The main site wrapper with a simple fade and no Y-axis movement */
        <div 
          style={{ 
            animation: 'simpleFadeIn 1.2s forwards',
            opacity: 0
          }}
        >
          <Header />
          <main>
            <HeroSection />
            <StatsSection />
          </main>
          <Footer />
        </div>
      )}

      <style>{`
        @keyframes simpleFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Home;
