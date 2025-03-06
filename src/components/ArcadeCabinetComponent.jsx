import React, { useState, useEffect } from 'react';

const ArcadeScreen = () => {
  const [blinking, setBlinking] = useState(true);

  // Blink the "INSERT COIN" text
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking((prev) => !prev);
    }, 800);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-black">
      <div className="relative aspect-video max-w-full max-h-full bg-black p-2 border-2 border-black">
        {/* Cyan outer border */}
        <div className="absolute inset-0 border-4 border-cyan-400 opacity-70"></div>
        {/* Purple inner border */}
        <div className="absolute inset-0 m-1 border-2 border-fuchsia-500 opacity-60"></div>
        {/* Text content */}
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className="mb-8 text-4xl font-bold text-fuchsia-500 tracking-wider"
            style={{
              textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff',
            }}
          >
            XARCADE
          </div>
          <div
            className={`text-lg font-bold text-cyan-400 ${
              blinking ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff',
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            INSERT COIN
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeScreen;