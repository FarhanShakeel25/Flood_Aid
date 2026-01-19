import React, { useEffect, useRef, useState } from 'react';
import '../styles/Experience.css';

import floodVideoWebM from '../assets/Flood_Vid.webm'; 
import posterImg from '../assets/poster.jpg';

const Experience = ({ onComplete }) => {
    const videoRef = useRef(null);
    const [videoReady, setVideoReady] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [showForcePlay, setShowForcePlay] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        // Timer for auto-exit (26.7s)
        const exitTimer = setTimeout(() => handleStartExit(), 26700);

        // If video hasn't started playing in 3 seconds, show the Force Play button
        const forcePlayTimer = setTimeout(() => {
            if (videoRef.current && videoRef.current.paused) {
                setShowForcePlay(true);
            }
        }, 3000);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(forcePlayTimer);
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleStartExit = () => {
        setIsExiting(true);
        setTimeout(onComplete, 1000); 
    };

    const handleForcePlay = () => {
        if (videoRef.current) {
            videoRef.current.muted = false; // Unmute immediately on click
            videoRef.current.play()
                .then(() => {
                    setShowForcePlay(false);
                    setVideoReady(true);
                })
                .catch(err => console.error("Playback failed:", err));
        }
    };

    return (
        <div className={`flood-exp-stage ${isExiting ? 'exit-active' : ''}`}>
            
            {/* Force Play Overlay - Appears only if autoplay fails */}
            {showForcePlay && (
                <div className="flood-exp-force-play-overlay">
                    <button className="play-trigger-button" onClick={handleForcePlay}>
                        <span className="play-icon">▶</span>
                        START EXPERIENCE
                    </button>
                    <p>Click to enable audio & video</p>
                </div>
            )}

            {/* Main UI Layer */}
            <div className={`flood-exp-ui ${videoReady && !showForcePlay ? 'is-visible' : ''}`}>
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
                    poster={posterImg} 
                    onPlay={() => {
                        setVideoReady(true);
                        setShowForcePlay(false);
                    }}
                    className="flood-exp-video-content"
                >
                    <source src={floodVideoWebM} type="video/webm" />
                </video>
            </div>
        </div>
    );
};

export default Experience;