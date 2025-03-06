import React, { useState } from 'react';

// Game data with GIFs
const games = [
  {
    id: 'game1',
    title: 'Enders Game',
    //description: 'Classic arcade shooter. Defend Earth from alien invaders!',
    imageUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGZ5eDlqa2R3b3FmZW5iem1laHU0ODE5Y2ZpaDEycXU5dnd1bXlmcSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2QDNEIwuqlSFjWYo/giphy.gif',
    available: true,
  },
  {
    id: 'game2',
    title: 'Pac-Man',
    description: 'Navigate mazes and collect dots while avoiding ghosts.',
    imageUrl: 'https://media.tenor.com/tKU0dI2GrWEAAAAC/pacman-video-game.gif',
    available: true,
  },
  
];

const GameCard = ({ game, onSelect }) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-lg border-2 border-fuchsia-500 
                 bg-black h-64 transform transition-all duration-300 
                 ${game.available ? 'hover:scale-105 cursor-pointer' : 'opacity-60'}`}
      onClick={() => game.available && onSelect(game)}
    >
      <div className="p-4 h-full flex flex-col">
        <h3 className="text-xl text-fuchsia-500 font-bold mb-2">{game.title}</h3>
        <div className="relative h-32 mb-2 overflow-hidden border border-cyan-400">
          {/* Using img tag directly for GIFs */}
          <img 
            src={game.imageUrl} 
            alt={game.title} 
            className="w-full h-full object-cover"
          />
          {!game.available && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <span className="text-cyan-400 font-bold">COMING SOON</span>
            </div>
          )}
        </div>
        <p className="text-xs text-cyan-400">{game.description}</p>
      </div>
    </div>
  );
};

export default function GameMenu({ onGameSelect }) {
  const [selectedGame, setSelectedGame] = useState(null);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    if (onGameSelect) onGameSelect(game);
  };

  return (
    <div className="p-8 bg-black min-h-full overflow-y-auto">
      <h2 className="text-4xl text-fuchsia-500 text-center mb-8 font-bold tracking-wider"
          style={{ textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff' }}>
        SELECT GAME
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <GameCard 
            key={game.id} 
            game={game} 
            onSelect={handleGameSelect} 
          />
        ))}
      </div>
    </div>
  );
}