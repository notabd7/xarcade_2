import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// For debugging
console.log('main.jsx is running');
console.log('Looking for root element:', document.getElementById('root'));

// Try finding the root element
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found in the DOM!');
  
  // Insert a root element as a fallback
  const fallbackRoot = document.createElement('div');
  fallbackRoot.id = 'root';
  document.body.appendChild(fallbackRoot);
  
  console.log('Created fallback root element');
  
  ReactDOM.createRoot(fallbackRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}