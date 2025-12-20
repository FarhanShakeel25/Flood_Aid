import React from 'react';
import '../styles/Hero.css'; // import hero-specific styles

export function HeroSection() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-container">
        <div className="hero-grid">
          <div>
            <div className="emergency-alert">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span className="alert-text">Emergency Relief Active</span>
            </div>

            <h1 className="hero-title">
              Flood Relief Management System
            </h1>
            <p className="hero-description">
              Coordinating emergency response, connecting affected communities with relief centers, 
              and facilitating donations to support flood relief efforts across all districts.
            </p>

            <div className="button-group">
              <button className="btn btn-primary">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                Emergency Hotline: 911
              </button>
              <button className="btn btn-outline">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Find Relief Center
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <p className="stat-number">1,247</p>
                <p className="stat-label">Active Requests</p>
              </div>
              <div className="stat-item">
                <p className="stat-number">5,823</p>
                <p className="stat-label">People Helped</p>
              </div>
              <div className="stat-item">
                <p className="stat-number">24/7</p>
                <p className="stat-label">Support Available</p>
              </div>
            </div>
          </div>

          <div className="image-section">
            <div className="image-container">
              <img
                src="https://images.unsplash.com/photo-1657069343999-39722b95f1d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9vZCUyMHJlbGllZiUyMGhlbHB8ZW58MXx8fHwxNzYyMTg0ODY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Flood relief operations"
                className="hero-image"
              />
            </div>
            
            {/* Floating card */}
            <div className="floating-card">
              <div className="card-content">
                <div className="card-info">
                  <div className="card-icon">
                    <svg className="card-svg-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="card-title">4 Relief Centers Open</p>
                    <p className="card-subtitle">Accepting people now</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;