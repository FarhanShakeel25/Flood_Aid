// components/Header/Header.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/globals.css";
import "../styles/Header.css";
import logo from "../assets/Logo.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [activeSection, setActiveSection] = useState('home');
  const navigate = useNavigate();

  // Scroll detection for fluid motion effects
  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      
      // Update scrolled state (for background transparency)
      setScrolled(scrollY > 20);
      
      // Update scroll direction (for hide/show)
      if (Math.abs(scrollY - lastScrollY) < 10) return;
      
      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    // Section detection for active nav link
    const updateActiveSection = () => {
      const sections = ['home', 'alerts', 'centers', 'dashboard'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollDirection();
          updateActiveSection();
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveSection(); // Initial check
    
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Block body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  // Handle smooth scroll for anchor links
  const handleAnchorClick = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(sectionId);
    }
    setMobileMenuOpen(false);
  };

  const handleEmergencyClick = () => {
    navigate("/contact");
    setMobileMenuOpen(false);
  };

  const handleDonateClick = () => {
    navigate("/donate");
    setMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Logic: Only hide header on scroll down if menu is CLOSED
  const isHidden = scrollDirection === 'down' && !mobileMenuOpen && scrolled;
  const headerClass = `header ${scrolled ? 'scrolled' : ''} ${isHidden ? 'scrolled-down' : 'scrolled-up'}`;

  return (
    <header className={headerClass}>
      <div className="header-container">
        <div className="header-main">
          {/* Logo Area */}
          <Link 
            to="/" 
            className="logo-area" 
            onClick={() => {
              handleLinkClick();
              setActiveSection('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="logo-image-wrapper">
              <img src={logo} alt="Flood Aid Logo" className="header-logo" />
            </div>
            <span className="logo-text">Flood Relief</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link 
              to="/" 
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </Link>
            <a 
              href="#alerts" 
              className={`nav-link ${activeSection === 'alerts' ? 'active' : ''}`}
              onClick={(e) => handleAnchorClick(e, 'alerts')}
            >
              Alerts
            </a>
            <a 
              href="#centers" 
              className={`nav-link ${activeSection === 'centers' ? 'active' : ''}`}
              onClick={(e) => handleAnchorClick(e, 'centers')}
            >
              Relief Centers
            </a>
            <a 
              href="#dashboard" 
              className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={(e) => handleAnchorClick(e, 'dashboard')}
            >
              Dashboard
            </a>
            <Link 
              to="/volunteer/login" 
              className="nav-link"
              onClick={handleLinkClick}
            >
              Volunteer Login
            </Link>
            <Link 
              to="/admin/login" 
              className="nav-link"
              onClick={handleLinkClick}
            >
              Admin
            </Link>
            
            {/* Action Buttons */}
            <div className="nav-actions">
              <button className="btn-donate" onClick={handleDonateClick}>
                Donate
              </button>
              <button className="btn-emergency" onClick={handleEmergencyClick}>
                Emergency
              </button>
            </div>
          </nav>

          {/* Mobile Toggle Button */}
          <button
            className={`menu-btn ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`nav-mobile-container ${mobileMenuOpen ? "open" : ""}`}>
        <div className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)}></div>
        <nav className="nav-mobile">
          <Link 
            to="/" 
            className={`mobile-link ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => {
              handleLinkClick();
              setActiveSection('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Home
          </Link>
          <a 
            href="#alerts" 
            className={`mobile-link ${activeSection === 'alerts' ? 'active' : ''}`}
            onClick={(e) => handleAnchorClick(e, 'alerts')}
          >
            Alerts
          </a>
          <a 
            href="#centers" 
            className={`mobile-link ${activeSection === 'centers' ? 'active' : ''}`}
            onClick={(e) => handleAnchorClick(e, 'centers')}
          >
            Relief Centers
          </a>
          <a 
            href="#dashboard" 
            className={`mobile-link ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => handleAnchorClick(e, 'dashboard')}
          >
            Dashboard
          </a>
          <Link 
            to="/volunteer/login" 
            className="mobile-link"
            onClick={handleLinkClick}
          >
            Volunteer Login
          </Link>
          <Link 
            to="/admin/login" 
            className="mobile-link"
            onClick={handleLinkClick}
          >
            Admin Login
          </Link>
          
          <div className="mobile-actions">
            <button className="btn-donate full-width" onClick={handleDonateClick}>
              Donate
            </button>
            <button className="btn-emergency full-width" onClick={handleEmergencyClick}>
              Emergency Contact
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;