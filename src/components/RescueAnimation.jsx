import React from 'react';

const RescueAnimation = ({ isAnimating }) => {
  return (
    <div className={`animation-scene ${isAnimating ? 'active' : ''}`}>
      {/* Water Waves */}
      <div className="water-waves"></div>
      <div className="water-waves wave2"></div>
      
      {/* Person in Water */}
      <div className={`person-in-water ${isAnimating ? 'rescued' : ''}`}>
        <div className="person-body">
          <div className="person-head">
            <div className="person-eyes">
              <div className="eye left"></div>
              <div className="eye right"></div>
            </div>
            <div className="person-mouth"></div>
          </div>
          <div className="person-torso"></div>
          <div className="person-arms">
            <div className="arm left"></div>
            <div className="arm right"></div>
          </div>
        </div>
        <div className="water-splashes">
          <div className="splash"></div>
          <div className="splash"></div>
          <div className="splash"></div>
        </div>
      </div>

      {/* Rescue Boat */}
      <div className={`rescue-boat ${isAnimating ? 'arrive' : ''}`}>
        <div className="boat-body">
          <div className="boat-cabin">
            <div className="boat-window"></div>
            <div className="boat-window"></div>
          </div>
          <div className="boat-deck">
            <div className="rescuer">
              <div className="rescuer-head"></div>
              <div className="rescuer-body"></div>
              <div className="rescuer-arm"></div>
            </div>
            <div className="life-ring">🛟</div>
          </div>
          <div className="boat-flag">
            <div className="flag-pole"></div>
            <div className="flag">
              <span className="flag-text">AID</span>
            </div>
          </div>
        </div>
        <div className="boat-wake">
          <div className="wake-line"></div>
          <div className="wake-line"></div>
          <div className="wake-line"></div>
        </div>
      </div>

      {/* Rain Effect */}
      <div className="rain-container">
        {[...Array(60)].map((_, i) => (
          <div 
            key={i} 
            className="raindrop" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.4 + Math.random() * 0.4}s`,
              opacity: Math.random() * 0.5 + 0.3
            }}
          ></div>
        ))}
      </div>

      {/* Lightning Flash */}
      {isAnimating && (
        <div className="lightning-flash"></div>
      )}

      {/* Clouds */}
      <div className="clouds">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
      </div>
    </div>
  );
};

export default RescueAnimation;