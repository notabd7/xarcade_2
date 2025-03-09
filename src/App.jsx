// src/App.jsx
import React from 'react';
import ArcadeScreen from './components/ArcadeScreen.jsx';
import GameBoyUI from './components/GameBoyUI.jsx';
import './gameboy-styles.css';

function App() {
  return (
    <div className="xarcade-app h-screen w-screen overflow-hidden bg-black">
      <div className="gameboy-wrapper h-full w-full">
        <GameBoyUI>
          <ArcadeScreen />
        </GameBoyUI>
      </div>
      <footer className="absolute bottom-0 w-full text-center py-1 text-xs text-fuchsia-500 z-10">
        <p>&copy; 2025 Xarcade - a notabd7 x sonnet production</p>
      </footer>
    </div>
  );
}

export default App;