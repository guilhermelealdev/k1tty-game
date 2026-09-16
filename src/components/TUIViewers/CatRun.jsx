// src/components/TUIViewers/CatRun.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';

const WIDTH = 60;
const HEIGHT = 16;
const TICK_MS = 55;
const GRAVITY = 0.5;
const JUMP_VELOCITY = 5.5;
const MAX_OFFSET = 10;

const GROUND_ROW = HEIGHT - 1;
const PLAYER_X = 5;

const CAT_STAND = [' /\\_/\\ ', '( o.o )', ' >   < '];
const CAT_JUMP  = [' /\\_/\\ ', '( ^.^ )', ' /^ ^\\ '];
const CAT_DEAD  = [' /\\_/\\ ', '( x.x )', ' >   < '];

const OBSTACLE_SPRITES = [
  ['|#|', '|#|'],
  ['/^\\', '\\_/'],
  ['_W_', '/ \\'],
];

const OBSTACLE_COOLDOWN_MIN = 20;
const OBSTACLE_COOLDOWN_MAX = 32;

function makeInitialState() {
  return {
    catOffset: 0,
    catVelocity: 0,
    obstacles: [],
    cooldown: 26,
    tick: 0,
    score: 0,
    alive: true,
  };
}

function renderGrid(g) {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(' '));

  for (let x = 0; x < WIDTH; x++) grid[GROUND_ROW][x] = '_';

  for (const o of g.obstacles) {
    for (let dy = 0; dy < o.sprite.length; dy++) {
      const row = GROUND_ROW - o.sprite.length + dy;
      for (let dx = 0; dx < o.sprite[dy].length; dx++) {
        const col = o.x + dx;
        if (col >= 0 && col < WIDTH && row >= 0) {
          grid[row][col] = o.sprite[dy][dx];
        }
      }
    }
  }

  const catSprite = !g.alive
    ? CAT_DEAD
    : (g.catOffset > 0 ? CAT_JUMP : CAT_STAND);

  const catBaseRow = GROUND_ROW - 1 - Math.round(g.catOffset);
  const catTopRow = catBaseRow - (catSprite.length - 1);

  for (let dy = 0; dy < catSprite.length; dy++) {
    const row = catTopRow + dy;
    for (let dx = 0; dx < catSprite[dy].length; dx++) {
      const col = PLAYER_X + dx;
      if (col >= 0 && col < WIDTH && row >= 0 && row < HEIGHT) {
        grid[row][col] = catSprite[dy][dx];
      }
    }
  }

  return grid.map(row => row.join('')).join('\n');
}

function checkCollision(g) {
  const catOffset = Math.round(g.catOffset);
  const catBottomRow = GROUND_ROW - 1 - catOffset;
  const catTopRow = catBottomRow - 2;
  const catLeft = PLAYER_X;
  const catRight = PLAYER_X + 6;

  for (const o of g.obstacles) {
    const oLeft = o.x;
    const oRight = o.x + (o.sprite[0].length - 1);
    const oBottomRow = GROUND_ROW - 1;
    const oTopRow = oBottomRow - (o.sprite.length - 1);

    const xOverlap = catRight >= oLeft && catLeft <= oRight;
    const yOverlap = catBottomRow >= oTopRow && catTopRow <= oBottomRow;

    if (xOverlap && yOverlap) return true;
  }
  return false;
}

export default function CatRun() {
  const { state, dispatch } = useGame();
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try {
      return parseInt(localStorage.getItem('k1tty_catrun_best') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [display, setDisplay] = useState(() => renderGrid(makeInitialState()));

  const stateRef = useRef(makeInitialState());
  const containerRef = useRef(null);
  const bestRef = useRef(best);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  // Conquista: score >= 50
  useEffect(() => {
    if (best >= 50 && !state.flags?.catrunBest50) {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'catrunBest50', value: true } });
    }
  }, [best, dispatch, state.flags?.catrunBest50]);

  const startGame = useCallback(() => {
    stateRef.current = makeInitialState();
    setScore(0);
    setIsGameOver(false);
    setIsRunning(true);
    setDisplay(renderGrid(stateRef.current));
    containerRef.current?.focus();
    dispatch({ type: 'STAT_INCREMENT', payload: { key: 'catrunGames' } });
  }, [dispatch]);

  const jump = useCallback(() => {
    const g = stateRef.current;
    if (!g.alive) return;
    if (g.catOffset === 0) {
      g.catVelocity = JUMP_VELOCITY;
    }
  }, []);

  useEffect(() => {
    if (!isRunning || isGameOver) return;

    const interval = setInterval(() => {
      const g = stateRef.current;
      if (!g.alive) return;

      g.tick++;
      g.score++;

      for (const o of g.obstacles) o.x -= 1;
      g.obstacles = g.obstacles.filter(o => o.x + o.sprite[0].length > 0);

      g.catVelocity -= GRAVITY;
      g.catOffset += g.catVelocity;

      if (g.catOffset <= 0) {
        g.catOffset = 0;
        g.catVelocity = 0;
      } else if (g.catOffset > MAX_OFFSET) {
        g.catOffset = MAX_OFFSET;
      }

      g.cooldown--;
      if (g.cooldown <= 0) {
        const sprite = OBSTACLE_SPRITES[Math.floor(Math.random() * OBSTACLE_SPRITES.length)];
        g.obstacles.push({ x: WIDTH - 1, sprite });
        g.cooldown = OBSTACLE_COOLDOWN_MIN + Math.floor(Math.random() * (OBSTACLE_COOLDOWN_MAX - OBSTACLE_COOLDOWN_MIN));
      }

      if (checkCollision(g)) {
        g.alive = false;
      }

      setDisplay(renderGrid(g));
      setScore(g.score);

      if (!g.alive) {
        setIsGameOver(true);
        setIsRunning(false);
        if (g.score > bestRef.current) {
          setBest(g.score);
          try {
            localStorage.setItem('k1tty_catrun_best', String(g.score));
          } catch { /* ignora */ }
        }
        dispatch({ type: 'STAT_INCREMENT', payload: { key: 'catrunDeaths' } });
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isRunning, isGameOver, dispatch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      if (!isRunning) {
        startGame();
      } else {
        jump();
      }
    } else if (e.key === 'Enter' && !isRunning) {
      e.preventDefault();
      startGame();
    }
  }, [isRunning, startGame, jump]);

  const handleClick = useCallback(() => {
    containerRef.current?.focus();
    if (!isRunning) {
      startGame();
    } else {
      jump();
    }
  }, [isRunning, startGame, jump]);

  const pad = (n, len) => String(n).padStart(len, '0');

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#001a1d',
        fontFamily: 'Fira Code, monospace',
        color: 'var(--color-text)',
        outline: 'none',
        overflow: 'hidden',
        padding: '6px',
        boxSizing: 'border-box',
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--color-command)',
        padding: '2px 6px',
        textShadow: 'var(--glow-soft)',
        flexShrink: 0,
      }}>
        <span>🐱 Cat Run</span>
        <span style={{ letterSpacing: '1px' }}>
          HI {pad(best, 4)}   {pad(score, 4)}
        </span>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <pre style={{
          margin: 0,
          padding: 0,
          fontSize: '11px',
          lineHeight: 1.15,
          color: 'var(--color-command)',
          textShadow: 'var(--glow-soft)',
          whiteSpace: 'pre',
          letterSpacing: '0',
        }}>
          {display}
        </pre>

        {(!isRunning && !isGameOver) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 20, 25, 0.75)',
            gap: '8px',
            textAlign: 'center',
            padding: '0 12px',
          }}>
            <div style={{ fontSize: '16px', color: 'var(--color-command)', textShadow: 'var(--glow-hard)' }}>
              🐱 Cat Run
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text)', lineHeight: 1.5 }}>
              Pule os obstáculos.<br />
              <span style={{ color: 'var(--color-dim)' }}>Espaço / ↑ / clique para pular</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); startGame(); }}
              style={{
                marginTop: '6px',
                padding: '6px 18px',
                background: 'linear-gradient(180deg, var(--color-command) 0%, var(--color-border) 100%)',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                color: 'var(--color-bg)',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              ▶ começar
            </button>
          </div>
        )}

        {isGameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 20, 25, 0.82)',
            gap: '6px',
            textAlign: 'center',
            padding: '0 12px',
          }}>
            <div style={{ fontSize: '18px', color: 'var(--color-error)', textShadow: 'var(--glow-intense)' }}>
              💀 game over
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>
              score: <span style={{ color: 'var(--color-command)', fontWeight: 'bold' }}>{score}</span>
              {'  ·  '}
              best: <span style={{ color: 'var(--color-command)' }}>{best}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); startGame(); }}
              style={{
                marginTop: '6px',
                padding: '6px 18px',
                background: 'linear-gradient(180deg, var(--color-command) 0%, var(--color-border) 100%)',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                color: 'var(--color-bg)',
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              ↻ jogar de novo
            </button>
          </div>
        )}
      </div>

      <div style={{
        fontSize: '10px',
        color: 'var(--color-dim)',
        textAlign: 'center',
        flexShrink: 0,
        paddingTop: '2px',
        letterSpacing: '0.5px',
      }}>
        {isRunning ? 'espaço para pular · clique também funciona' : 'clique ou aperte espaço para começar'}
      </div>
    </div>
  );
}