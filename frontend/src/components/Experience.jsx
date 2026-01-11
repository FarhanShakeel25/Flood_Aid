import React, { useEffect, useState } from "react";
import "../styles/Experience.css";

const Experience = ({ onComplete }) => {
  const [videoReady, setVideoReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Timer for auto-exit
    const timer = setTimeout(() => {
      handleStartExit();
    }, 26700);

    // Global click handler to unmute the specific video ID
    const handleGlobalClick = () => {
      const vid = document.getElementById("flood-video-player");
      if (vid) {
        vid.muted = false;
        vid.play().catch(() => {});
      }
    };

    window.addEventListener("click", handleGlobalClick, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleGlobalClick);
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleStartExit = () => {
    setIsExiting(true);
    setTimeout(onComplete, 1000);
  };

  return (
    <div className={`flood-exp-stage ${isExiting ? "exit-active" : ""}`}>
      {/* Overlay UI */}
      <div
        style={{
          opacity: videoReady && !isExiting ? 1 : 0,
          transition: "opacity 0.8s ease",
          pointerEvents: isExiting ? "none" : "auto",
        }}
      >
        <div className="flood-exp-header">
          <h2>Flood Experience</h2>
        </div>

        <button className="flood-exp-skip-button" onClick={handleStartExit}>
          Skip Video
        </button>

        <div className="flood-exp-alarm-glow"></div>
      </div>

      <div className="flood-exp-video-wrapper">
        <video
          id="flood-video-player"
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          poster="/poster.jpg"
          onLoadedData={() => setVideoReady(true)}
          className="flood-exp-video-content"
          style={{ background: "black" }}
        >
          <source src="/Flood_Vid.webm" type="video/webm" />
          <source src="/Flood_Vid.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default Experience;
