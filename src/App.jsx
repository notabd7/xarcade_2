import React from 'react';
import ArcadeScreen from './components/ArcadeScreen.jsx';

function App() {
  return (
    <div className="xarcade-app h-screen flex flex-col overflow-hidden bg-black">
      <main className="flex-1">
        <ArcadeScreen />
      </main>
      <footer className="text-center py-1 text-xs text-fuchsia-500">
        <p>&copy; 2025 Xarcade - a notabd7 x sonnet production</p>

      </footer>
    </div>
  );
}

export default App;