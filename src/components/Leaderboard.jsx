import React from 'react';

// Sample leaderboard data
const leaderboardData = [
  { rank: 1, player: 'PLAYER1', score: 10000 },
  { rank: 2, player: 'PLAYER2', score: 9500 },
  { rank: 3, player: 'PLAYER3', score: 9000 },
  { rank: 4, player: 'PLAYER4', score: 8500 },
  { rank: 5, player: 'PLAYER5', score: 8000 },
  { rank: 6, player: 'PLAYER6', score: 7500 },
  { rank: 7, player: 'PLAYER7', score: 7000 },
  { rank: 8, player: 'PLAYER8', score: 6500 },
  { rank: 9, player: 'PLAYER9', score: 6000 },
  { rank: 10, player: 'PLAYER10', score: 5500 },
];

const Leaderboard = () => {
  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">TOP SCORES</h2>
      <ul className="leaderboard-list">
        {leaderboardData.map((entry) => (
          <li key={entry.rank} className="leaderboard-item">
            <span>{entry.rank}. {entry.player}</span>
            <span>{entry.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;