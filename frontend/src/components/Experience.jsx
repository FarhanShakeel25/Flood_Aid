import React, { useEffect, useRef, useState } from "react";
import "../styles/Experience.css";

const Experience = ({ onComplete }) => {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      handleStartExit();
    }, 26700);

    const handleUserClick = () => {
      // Added check to ensure videoRef and videoRef.current exist
      if (videoRef && videoRef.current) {
        videoRef.current.muted = false;
        // Use a standard play promise check for production stability
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            /* Autoplay was prevented, which is fine */
          });
        }
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
    setIsExiting(true);
    setTimeout(() => {
      terminateExperience();
    }, 1000);
  };

  const terminateExperience = () => {
    // Defensive check for production unmounting
    if (videoRef?.current) {
      try {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      } catch (err) {
        console.warn("Video cleanup skipped:", err);
      }
    }
    onComplete();
  };

  return (
    <div className={`flood-exp-stage ${isExiting ? "exit-active" : ""}`}>
      <div
        style={{
          opacity: videoReady && !isExiting ? 1 : 0,
          transition: "opacity 0.8s ease",
          visibility: videoReady ? "visible" : "hidden", // Added for production stability
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
          <source src="/Flood_Vid.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default Experience;
