import React, { useState, useEffect } from 'react';
import '../styles/StatsSection.css';

export function StatsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Mock data for initial display and fallback
  const mockStats = {
    totalVisitors: { value: 12547, change: 12, target: 50000 },
    totalDonations: { value: 284750, change: 8, target: 1000000 },
    activeVolunteers: { value: 347, change: 15, target: 1000 },
    reliefCenters: { value: 28, change: 5, target: 50 },
    peopleHelped: { value: 5823, change: 20, target: 15000 },
    emergencyCalls: { value: 1247, change: -3, target: 5000 }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual endpoint
      const response = await fetch('/api/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback to mock data if API fails
        setStats(mockStats);
      }
    } catch (error) {
      //console.error('Failed to fetch stats:', error);
      setStats(mockStats);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time updates (WebSocket or polling)
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds

    // Set up visibility change listener for tab focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate progress percentage
  const calculateProgress = (value, target) => {
    return Math.min((value / target) * 100, 100);
  };

  if (loading && !stats) {
    return (
      <section className="stats-section">
        <div className="stats-container">
          <h2 className="stats-title">Making a Difference in Real-Time</h2>
          <p className="stats-subtitle">Live updates from our relief operations</p>
          <div className="stats-grid">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="stat-card loading">
                <div className="stat-skeleton-icon"></div>
                <div className="stat-skeleton-value"></div>
                <div className="stat-skeleton-label"></div>
                <div className="stat-skeleton-progress"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const displayedStats = [
    {
      key: 'totalVisitors',
      label: 'Total Visitors',
      value: stats?.totalVisitors?.value || mockStats.totalVisitors.value,
      change: stats?.totalVisitors?.change || mockStats.totalVisitors.change,
      target: stats?.totalVisitors?.target || mockStats.totalVisitors.target,
      icon: (
        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
      color: 'blue'
    },
    {
      key: 'totalDonations',
      label: 'Total Donations',
      value: stats?.totalDonations?.value || mockStats.totalDonations.value,
      change: stats?.totalDonations?.change || mockStats.totalDonations.change,
      target: stats?.totalDonations?.target || mockStats.totalDonations.target,
      icon: (
        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2zm0-10h2v6h-2z"/>
        </svg>
      ),
      color: 'green',
      prefix: '$'
    },
    {
      key: 'activeVolunteers',
      label: 'Active Volunteers',
      value: stats?.activeVolunteers?.value || mockStats.activeVolunteers.value,
      change: stats?.activeVolunteers?.change || mockStats.activeVolunteers.change,
      target: stats?.activeVolunteers?.target || mockStats.activeVolunteers.target,
      icon: (
        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      color: 'orange'
    },
    {
      key: 'peopleHelped',
      label: 'People Helped',
      value: stats?.peopleHelped?.value || mockStats.peopleHelped.value,
      change: stats?.peopleHelped?.change || mockStats.peopleHelped.change,
      target: stats?.peopleHelped?.target || mockStats.peopleHelped.target,
      icon: (
        <svg className="stat-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 8c0-2.21-1.79-4-4-4S6 5.79 6 8s1.79 4 4 4 4-1.79 4-4zm-2 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM2 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4zm2 0c.2-.71 3.3-2 6-2 2.69 0 5.78 1.28 6 2H4zm13-8v6h2v-6h-2z"/>
        </svg>
      ),
      color: 'purple'
    }
  ];

  return (
    <section className="stats-section">
      <div className="stats-container">
        <h2 className="stats-title">Making a Difference in Real-Time</h2>
        <p className="stats-subtitle">Live updates from our relief operations</p>
        
        <div className="stats-grid">
          {displayedStats.map((stat) => (
            <div 
              key={stat.key} 
              className={`stat-card stat-card-${stat.color}`}
              onClick={() => console.log(`Clicked ${stat.label}`)}
            >
              <div className="stat-header">
                <div className="stat-icon-container">
                  {stat.icon}
                </div>
                <div className="stat-change">
                  <span className={`change-indicator ${stat.change >= 0 ? 'positive' : 'negative'}`}>
                    {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                  </span>
                </div>
              </div>
              
              <div className="stat-value">
                {stat.prefix}{formatNumber(stat.value)}
              </div>
              <div className="stat-label">{stat.label}</div>
              
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateProgress(stat.value, stat.target)}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  <span>Progress: {calculateProgress(stat.value, stat.target).toFixed(1)}%</span>
                  <span>Goal: {stat.prefix}{formatNumber(stat.target)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lastUpdated && (
          <div className="stats-footer">
            <div className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live Updates
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default StatsSection;