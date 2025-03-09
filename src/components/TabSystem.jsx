import React, { useState, useEffect } from 'react';
import GameCarousel from './GameCarousel';
import Leaderboard from './Leaderboard';

const TabSystem = () => {
  const [activeTab, setActiveTab] = useState('menu');

  // Handle shoulder button presses to switch tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'q' || e.key === 'Q') { // L button
        setActiveTab('menu');
      } else if (e.key === 'e' || e.key === 'E') { // R button
        setActiveTab('leaderboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle click events on the L and R buttons
  useEffect(() => {
    const lButton = document.querySelector('.l-button');
    const rButton = document.querySelector('.r-button');

    const handleLButtonClick = () => setActiveTab('menu');
    const handleRButtonClick = () => setActiveTab('leaderboard');

    if (lButton) lButton.addEventListener('click', handleLButtonClick);
    if (rButton) rButton.addEventListener('click', handleRButtonClick);

    return () => {
      if (lButton) lButton.removeEventListener('click', handleLButtonClick);
      if (rButton) rButton.removeEventListener('click', handleRButtonClick);
    };
  }, []);

  return (
    <div className="tab-system">
      <div className="tab-headers">
        <div className={`tab-header ${activeTab === 'menu' ? 'active' : ''}`}>
          MENU
        </div>
        <div className={`tab-header ${activeTab === 'leaderboard' ? 'active' : ''}`}>
          LEADERBOARD
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'menu' && <GameCarousel />}
        {activeTab === 'leaderboard' && <Leaderboard />}
      </div>
      
      <div className="navigation-hints">
        L/R Buttons to switch tabs • D-Pad Left/Right to navigate games • A to select
      </div>
    </div>
  );
};

export default TabSystem;