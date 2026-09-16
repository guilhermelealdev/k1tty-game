import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function DinoRun() {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [obstacles, setObstacles] = useState([]);
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const gameRef = useRef(null);

  const jump = useCallback(() => {
    if (isJumping || gameOver || !isRunning) return;
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, [isJumping, gameOver, isRunning]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'r' && gameOver) {
        setGameOver(false);
        setScore(0);
        setObstacles([]);
        setIsRunning(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, gameOver]);

  useEffect(() => {
    if (!isRunning || gameOver) return;

    const interval = setInterval(() => {
      // Move obstacles
      setObstacles(prev => {
        const newObstacles = prev
          .map(o => ({ ...o, x: o.x - 10 }))
          .filter(o => o.x > -20);
        
        // Check collision
        for (const obs of newObstacles) {
          if (obs.x < 60 && obs.x > 40 && !isJumping) {
            setGameOver(true);
            setIsRunning(false);
            return newObstacles;
          }
        }
        
        // Add new obstacle
        if (Math.random() < 0.1 && newObstacles.length < 3) {
          newObstacles.push({ x: 400, y: 50, id: Date.now() });
        }
        
        return newObstacles;
      });
      
      setScore(prev => prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, gameOver, isJumping]);

  if (gameOver) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>💀 Game Over!</div>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>Score: {score}</div>
        <button className="tui-button" onClick={() => {
          setGameOver(false);
          setScore(0);
          setObstacles([]);
          setIsRunning(true);
        }}>
          Pressione R ou clique para reiniciar
        </button>
      </div>
    );
  }

  return (
    <div 
      className="dino-game"
      ref={gameRef}
      onClick={jump}
      style={{ cursor: 'pointer' }}
    >
      <div className="dino-character" style={{ 
        left: 50, 
        bottom: isJumping ? 100 : 20,
        transition: 'bottom 0.3s',
      }}>
        🦖
      </div>
      {obstacles.map(obs => (
        <div key={obs.id} style={{ 
          position: 'absolute', 
          left: obs.x, 
          bottom: 20,
          fontSize: '20px',
          color: '#EF6461',
        }}>
          🌵
        </div>
      ))}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        right: 10,
        color: '#C7EF00',
        fontSize: '16px',
      }}>
        Score: {score}
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: 5, 
        left: '50%', 
        transform: 'translateX(-50%)',
        color: '#5a7a5a',
        fontSize: '10px',
      }}>
        Espaço/↑ para pular | R para reiniciar
      </div>
    </div>
  );
}