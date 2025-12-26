import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('floodaid_theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const [font, setFont] = useState(() => {
        return localStorage.getItem('floodaid_font') || 'Inter';
    });

    useEffect(() => {
        localStorage.setItem('floodaid_theme', theme);
        // Apply theme class to document element
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('floodaid_font', font);
        document.documentElement.style.setProperty('--font-family-base', font === 'Inter' ? "'Inter', sans-serif" :
            font === 'Roboto' ? "'Roboto', sans-serif" :
                "'Open Sans', sans-serif");
    }, [font]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, font, setFont }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
