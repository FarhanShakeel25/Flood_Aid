import React, { useEffect, useRef } from 'react';
import '../styles/Experience.css';
// Ensure the path to your assets folder is correct
import floodVideoSource from '../assets/Flood_Vid.mp4'; 

const Experience = ({ onComplete }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        // Prevent scrolling on the main page while video plays
        document.body.style.overflow = 'hidden';

        // Auto-end after 26.7 seconds
        const timer = setTimeout(() => {
            terminateExperience();
        }, 26700);

        // Standard listener to enable audio on first interaction
        const handleUserClick = () => {
            if (videoRef.current) {
                videoRef.current.muted = false;
            }
        };
        window.addEventListener('click', handleUserClick, { once: true });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', handleUserClick);
            document.body.style.overflow = 'auto'; // Re-enable scroll
        };
    }, []);

    const terminateExperience = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = ""; // Stop audio stream immediately
            videoRef.current.load();
        }
        onComplete();
    };

    return (
        <div className="flood-exp-stage">
            <div className="flood-exp-header">
                <h2>Flood Experience</h2>
            </div>

            <button className="flood-exp-skip-button" onClick={terminateExperience}>
                Skip Video
            </button>
            
            <div className="flood-exp-alarm-glow"></div>
            
            <div className="flood-exp-video-wrapper">
                <video 
                    ref={videoRef}
                    autoPlay 
                    muted 
                    playsInline 
                    loop 
                    className="flood-exp-video-content"
                >
                    <source src={floodVideoSource} type="video/mp4" />
                </video>
            </div>
        </div>
    );
};

export default Experience;
