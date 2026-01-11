import React, { useEffect, useRef, useState } from "react";
import "../styles/Experience.css";

const Experience = ({ onComplete }) => {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // New state for fade-out

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      handleStartExit();
    }, 26700);

    const handleUserClick = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener("click", handleUserClick, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleUserClick);
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleStartExit = () => {
    setIsExiting(true); // Trigger CSS fade-out
    // Wait 1 second for the animation to finish before unmounting
    setTimeout(() => {
      terminateExperience();
    }, 1000);
  };

  const terminateExperience = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.load();
    }
    onComplete();
  };

  return (
    <div className={`flood-exp-stage ${isExiting ? "exit-active" : ""}`}>
      <div
        style={{
          opacity: videoReady && !isExiting ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        <div className="flood-exp-header">
          <h2>Flood Experience</h2>
        </div>

        <button className="flood-exp-skip-button" onClick={handleStartExit}>
          Skip
        </button>

        <div className="flood-exp-alarm-glow"></div>
      </div>

      <div className="flood-exp-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          poster="/poster.jpg"
          onLoadedData={() => setVideoReady(true)}
          className="flood-exp-video-content"
        >
          <source src="/Flood_Vid.webm" type="video/webm" />
        </video>
      </div>
    </div>
  );
};

export default Experience;
