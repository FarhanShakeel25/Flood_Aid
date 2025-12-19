// components/Hero/Hero.jsx - DYNAMIC FLUID VERSION
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Hero.css';
import img from '../assets/flood.jpeg'

export function HeroSection() {
  const [activeRequests, setActiveRequests] = useState(0);
  const [peopleHelped, setPeopleHelped] = useState(0);
  const [centersOpen, setCentersOpen] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef(null);
  const videoRef = useRef(null);

  // Animated counters
  useEffect(() => {
    const animateCounters = () => {
      const duration = 2000; // 2 seconds
      const steps = 60; // 60 frames
      const stepDuration = duration / steps;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setActiveRequests(Math.floor(1247 * easeOutQuart));
        setPeopleHelped(Math.floor(5823 * easeOutQuart));
        setCentersOpen(Math.floor(4 * easeOutQuart));
        
        if (step >= steps) {
          clearInterval(interval);
          setActiveRequests(1247);
          setPeopleHelped(5823);
          setCentersOpen(4);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    };

    // Start animation after component mounts
    const timer = setTimeout(animateCounters, 300);
    return () => clearTimeout(timer);
  }, []);

  // Scroll-based video simulation effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current && videoRef.current) {
        const heroRect = heroRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const heroCenter = heroRect.top + heroRect.height / 2;
        
        // Calculate scroll progress through hero section (0 to 1)
        const progress = 1 - Math.min(Math.max((heroCenter) / windowHeight, 0), 1);
        setScrollProgress(progress);
        
        // Simulate water level based on scroll
        const waterLevel = Math.min(progress * 120, 100);
        document.documentElement.style.setProperty('--water-level', `${waterLevel}%`);
        
        // Parallax effect for floating elements
        const parallaxY = progress * 40;
        document.documentElement.style.setProperty('--parallax-y', `${parallaxY}px`);
        
        // Video intensity (if using video)
        const intensity = Math.min(progress * 0.8, 0.6);
        videoRef.current.style.opacity = intensity.toString();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating animation for emergency alert
  useEffect(() => {
    const interval = setInterval(() => {
      const alert = document.querySelector('.emergency-alert');
      if (alert) {
        alert.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 3}px)`;
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  const handleEmergencyCall = () => {
    window.location.href = 'tel:911';
  };

  const handleFindCenters = () => {
    const centersSection = document.getElementById('centers');
    if (centersSection) {
      centersSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero-section" ref={heroRef}>
      {/* Background video/simulation layer */}
      <div className="hero-video-container">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          poster="/api/placeholder/1920/1080"
        >
          <source src="/api/placeholder/1920/1080" type="video/mp4" />
          {/* Fallback gradient background */}
        </video>
        <div className="water-simulation-layer" style={{ '--scroll-progress': scrollProgress }}></div>
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-container">
        <div className="hero-grid">
          {/* Left Column: Information & Actions */}
          <div className="content-side">
            <div className="emergency-alert">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span className="alert-text">
                <span className="pulse-dot"></span>
                Emergency Relief Active
              </span>
            </div>

            <h1 className="hero-title">
              <span className="hero-title-line">Flood Relief</span>
              <span className="hero-title-line">Management System</span>
            </h1>
            
            <p className="hero-description">
              Real-time emergency response coordination connecting affected communities 
              with immediate relief and vital support during flood crises.
            </p>

            <div className="button-group">
              <button 
                className="btn btn-primary floating-btn"
                onClick={handleEmergencyCall}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <div className="btn-content">
                  <span className="btn-label">Emergency Hotline </span>
                  <span className="btn-number"> 911</span>
                </div>
                <div className="btn-ripple"></div>
              </button>
              
              <button 
                className="btn btn-outline floating-btn"
                onClick={handleFindCenters}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div className="btn-content">
                  <span className="btn-label">Find Relief Center</span>
                </div>
                {/* <div className="btn-ripple"></div> */}
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <p className="stat-number" data-target="1247">
                  {activeRequests.toLocaleString()}
                  <span className="stat-plus">+</span>
                </p>
                <p className="stat-label">Active Requests</p>
              </div>
              
              <div className="stat-item">
                <p className="stat-number" data-target="5823">
                  {peopleHelped.toLocaleString()}
                  <span className="stat-plus">+</span>
                </p>
                <p className="stat-label">People Helped</p>
              </div>
              
              <div className="stat-item">
                <p className="stat-number" data-target="24/7">
                  24/7
                </p>
                <p className="stat-label">Support Available</p>
              </div>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="image-side">
            <img src={img} alt="Flood Relief" className="hero-image" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;