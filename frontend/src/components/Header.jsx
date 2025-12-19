// components/Header/Header.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/globals.css";
import "../styles/Header.css";
import logo from "../assets/logo.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleEmergencyClick = () => {
    navigate("/contact");
    setMobileMenuOpen(false);
  };

  const handleDonateClick = () => {
    navigate("/donate");
    setMobileMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-main">
          <div className="logo-area">
            {/* Replaced 🔔 with the imported logo image */}
            <div className="logo-image-wrapper">
              <img src={logo} alt="Flood Aid Logo" className="header-logo" />
            </div>
            <Link to="/" className="logo-text">
              Flood Relief System
            </Link>
          </div>

          <nav className="nav-desktop">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <a href="#alerts" className="nav-link">
              Alerts
            </a>
            <a href="#centers" className="nav-link">
              Relief Centers
            </a>
            <button
              className="nav-link donate-btn" // Changed from <a> to <button>
              onClick={handleDonateClick} // Added click handler
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            >
              Donate
            </button>
            <a href="#dashboard" className="nav-link">
              Dashboard
            </a>
            <button className="btn-emergency" onClick={handleEmergencyClick}>
              Emergency Contact
            </button>
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
              <Link
                to="/"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <a
                href="#alerts"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Alerts
              </a>
              <a
                href="#centers"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Relief Centers
              </a>
              <button
                className="nav-link"
                onClick={() => {
                  handleDonateClick();
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 0",
                  color: "#333",
                }}
              >
                Donate
              </button>
              <a
                href="#dashboard"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </a>
              <button className="btn-emergency" onClick={handleEmergencyClick}>
                Emergency Contact
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
