// src/App.jsx
import React from 'react';
import ArcadeScreen from './components/ArcadeScreen.jsx';
import ArcadeCabinet3D from './components/ArcadeCabinet3D.jsx';

function App() {
  return (
    <div className="xarcade-app h-screen overflow-hidden bg-black">
      <ArcadeCabinet3D>
        <ArcadeScreen />
      </ArcadeCabinet3D>
      <footer className="absolute bottom-0 w-full text-center py-1 text-xs text-fuchsia-500">
        <p>&copy; 2025 Xarcade - a notabd7 x sonnet production</p>
      </footer>
    </div>
  );
}

export default App;