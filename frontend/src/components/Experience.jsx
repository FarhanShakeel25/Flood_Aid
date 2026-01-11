import React, { useEffect, useState } from 'react';
import '../styles/Experience.css';

const Experience = ({ onComplete }) => {
    const [videoReady, setVideoReady] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Prevent scroll
        document.body.style.overflow = 'hidden';

        // SAFETY: If the video hasn't loaded in 5 seconds, just show the skip button/header anyway
        const safetyTimer = setTimeout(() => {
            setVideoReady(true);
        }, 5000);

        // Auto-end after video duration
        const exitTimer = setTimeout(() => {
            handleStartExit();
        }, 26700);

        const handleGlobalClick = () => {
            const vid = document.getElementById('flood-video-player');
            if (vid) {
                vid.muted = false;
                vid.play().catch(() => {});
            }
        };

        window.addEventListener('click', handleGlobalClick, { once: true });

        return () => {
            clearTimeout(safetyTimer);
            clearTimeout(exitTimer);
            window.removeEventListener('click', handleGlobalClick);
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleStartExit = () => {
        setIsExiting(true);
        // Trigger the home page load after the 1s fade-out
        setTimeout(onComplete, 1000); 
    };

    return (
        <div className={`flood-exp-stage ${isExiting ? 'exit-active' : ''}`}>
            {/* UI Overlay */}
            <div style={{ 
                opacity: videoReady && !isExiting ? 1 : 0, 
                transition: 'opacity 0.8s ease',
                pointerEvents: isExiting ? 'none' : 'auto',
                zIndex: 10
            }}>
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
                    /* If poster.jpg is in public, use /poster.jpg */
                    poster="/poster.jpg" 
                    onLoadedData={() => setVideoReady(true)}
                    className="flood-exp-video-content"
                >
                    {/* These MUST be in your 'public' folder */}
                    <source src="/Flood_Vid.webm" type="video/webm" />
                    <source src="/Flood_Vid.mp4" type="video/mp4" />
                </video>
            </div>
        </div>
    );
};

export default Experience;