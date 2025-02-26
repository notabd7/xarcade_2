import React from 'react';
import ArcadeCabinetComponent from './components/ArcadeCabinetComponent.jsx'; // Note: using your existing filename with 's'

function App() {
  return (
    <div className="xarcade-app">
      <header>
        <h1 className="neon-text">XARCADE</h1>
      </header>
      <main>
        <ArcadeCabinetComponent />
      </main>
      <footer>
        <p>&copy; 2025 Xarcade - Retro Gaming Experience</p>
      </footer>
    </div>
  );
}

export default App;