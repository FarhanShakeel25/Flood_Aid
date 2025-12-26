import React, { useState, useEffect, useRef } from 'react';
import '../styles/StatsSection.css';

export function StatsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const mockStats = {
    totalVisitors: { value: 12547, change: 12, target: 50000 },
    totalDonations: { value: 40000, change: 8, target: 80000 },
    reliefCenters: { value: 28, change: 5, target: 50 },
    peopleHelped: { value: 5823, change: 20, target: 15000 },
    emergencyCalls: { value: 1247, change: -3, target: 5000 }
  };

  // Scroll Trigger Logic
  // Scroll Trigger Logic - Re-triggers every time
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true); // Trigger animation
        } else {
          setIsVisible(false); // Reset when scrolled away so it can "pop" again
        }
      },
      { threshold: 0.1 } // Trigger as soon as 10% of the section is visible
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats(mockStats);
      }
    } catch (error) {
      setStats(mockStats);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

 const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const calculateProgress = (value, target) => Math.min((value / target) * 100, 100);

  const displayedStats = [
    { key: 'totalVisitors', label: 'Total Visitors', value: 12547, target: 50000, color: 'blue', icon: '👥' },
    { key: 'totalDonations', label: 'Total Donations', value: 284750, target: 1000000, color: 'green', icon: '💰', prefix: 'RS ' },
    { key: 'peopleHelped', label: 'People Helped', value: 5823, target: 15000, color: 'purple', icon: '🏠' }
  ];


  return (
    <section className={`stats-section ${isVisible ? 'is-visible' : ''}`} ref={sectionRef}>
      <div className="stats-container">
        <div className="stats-header-area">
          <h2 className="stats-title">Real-Time Impact</h2>
          <p className="stats-subtitle">Visualizing our relief efforts across the region</p>
        </div>
        
        <div className="stats-grid">
          {displayedStats.map((stat, index) => (
            <div 
              key={stat.key} 
              className={`stat-card card-${stat.color}`}
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              <div className="card-top">
                <span className="card-icon">{stat.icon}</span>
                <span className="live-pill">LIVE</span>
              </div>
              
              <div className="card-body">
                <h3 className="stat-value">{stat.prefix}{formatNumber(stat.value)}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
              
              <div className="progress-container">
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    /* The key fix: width is 0 unless isVisible is true */
                    style={{ width: isVisible ? `${calculateProgress(stat.value, stat.target)}%` : '0%' }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>{calculateProgress(stat.value, stat.target).toFixed(1)}%</span>
                  <span>Goal: {stat.prefix}{formatNumber(stat.target)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;