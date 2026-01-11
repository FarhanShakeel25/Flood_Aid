import React, { useEffect, useRef, useState } from 'react';
import '../styles/Experience.css';

// Importing from assets as requested
import floodVideoMP4 from '../assets/Flood_Vid.webm'; 
import posterImg from '../assets/poster.jpg';

const Experience = ({ onComplete }) => {
    const videoRef = useRef(null);
    const [videoReady, setVideoReady] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';

        // Timer for the 26.7s duration
        const exitTimer = setTimeout(() => {
            handleStartExit();
        }, 26700);

        // Click handler to enable audio
        const handleUserClick = () => {
            if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.play().catch(() => {});
            }
        };
        window.addEventListener('click', handleUserClick, { once: true });

        return () => {
            clearTimeout(exitTimer);
            window.removeEventListener('click', handleUserClick);
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleStartExit = () => {
        setIsExiting(true); // Triggers CSS Fade-out
        setTimeout(() => {
            terminateExperience();
        }, 1000); // 1 second delay for cinematic effect
    };

    const terminateExperience = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = ""; 
        }
        onComplete();
    };

    return (
        <div className={`flood-exp-stage ${isExiting ? 'exit-active' : ''}`}>
            {/* UI Layer: Fades out when exiting */}
            <div style={{ opacity: videoReady && !isExiting ? 1 : 0, transition: 'opacity 0.8s ease' }}>
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
                    poster={posterImg} // Using the imported asset
                    onLoadedData={() => setVideoReady(true)}
                    className="flood-exp-video-content"
                >
                    <source src={floodVideoMP4} type="video/mp4" />
                </video>
            </div>
        </div>
    );
};

export default Experience;