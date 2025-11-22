import { useState } from "react";
import "../../styles/globals.css"; // import global styles
import "../../styles/Header.css";           // import header-specific styles

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-main">
          <div className="logo-area">
            <div className="logo-icon">🔔</div>
            <span className="logo-text">Flood Relief System</span>
          </div>

          <nav className="nav-desktop">
            <a href="#home" className="nav-link">Home</a>
            <a href="#alerts" className="nav-link">Alerts</a>
            <a href="#centers" className="nav-link">Relief Centers</a>
            <a href="#donate" className="nav-link">Donate</a>
            <a href="#volunteer" className="nav-link">Volunteer</a>
            <a href="#dashboard" className="nav-link">Dashboard</a>
            <button className="btn-emergency">Emergency Contact</button>
          </nav>

          <button
            className="menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "✖" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="nav-mobile-container">
            <nav className="nav-mobile">
              <a href="#home" className="nav-link">Home</a>
              <a href="#alerts" className="nav-link">Alerts</a>
              <a href="#centers" className="nav-link">Relief Centers</a>
              <a href="#donate" className="nav-link">Donate</a>
              <a href="#volunteer" className="nav-link">Volunteer</a>
              <a href="#dashboard" className="nav-link">Dashboard</a>
              <button className="btn-emergency">Emergency Contact</button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}