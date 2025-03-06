import React from 'react';
import ArcadeScreen from './components/ArcadeScreen.jsx';

function App() {
  return (
    <div className="xarcade-app">
      {/* <header>
        <h1 className="neon-text">XARCADE</h1>
      </header> */}
      <main>
        <ArcadeScreen />
      </main>
      <footer>
        <p>&copy; 2025 Xarcade - Retro Gaming Experience</p>
      </footer>
    </div>
  );
}

export default App;