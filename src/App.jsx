import React from 'react';
import ArcadeCabinetComponent from './components/ArcadeCabinetComponent.jsx';

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
        <p className="copyright">&copy; 2025 notabd7 x sonnet</p>
      </footer>
    </div>
  );
}

export default App;