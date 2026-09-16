// src/components/TUIViewers/CreditsViewer.jsx

import React, { useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext.jsx';

export default function CreditsViewer() {
  const { dispatch } = useGame();
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.6;
      const p = audioRef.current.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay bloqueado */ });
      }
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'START_FINALE' });
    }, 25000);

    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: '#000',
      color: '#fff',
      fontFamily: 'Fira Code, monospace',
    }}>
      <audio ref={audioRef} src="/sounds/victory.mp3" loop />

      <div
        style={{
          position: 'absolute',
          bottom: '-150%',
          animation: 'scrollCredits 25s linear forwards',
          width: '100%',
          textAlign: 'center',
          padding: '0 20px',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{
          fontSize: '32px',
          marginBottom: '30px',
          color: '#C7EF00',
          textShadow: '0 0 12px #C7EF00',
        }}>
          Obrigado por jogar k1tty
        </h1>

        <p style={{ margin: '30px 0' }}>—</p>
        <p style={{ margin: '20px 0', fontSize: '16px' }}>
          Um jogo de exploração e descoberta
        </p>

        <p style={{ margin: '30px 0' }}>—</p>
        <h2 style={{ margin: '30px 0', color: '#95C623' }}>Desenvolvimento</h2>
        <p style={{ margin: '10px 0' }}>Você, o jogador curioso</p>

        <p style={{ margin: '30px 0' }}>—</p>
        <h2 style={{ margin: '30px 0', color: '#95C623' }}>Design de Puzzles</h2>
        <p style={{ margin: '10px 0' }}>O Gato Quântico</p>

        <p style={{ margin: '30px 0' }}>—</p>
        <h2 style={{ margin: '30px 0', color: '#95C623' }}>Trilha Sonora</h2>
        <p style={{ margin: '10px 0' }}>Miados Sinfônicos</p>

        <p style={{ margin: '30px 0' }}>—</p>
        <h2 style={{ margin: '30px 0', color: '#95C623' }}>Agradecimentos Especiais</h2>
        <p style={{ margin: '10px 0' }}>Todos os gatos do mundo</p>
        <p style={{ margin: '10px 0' }}>A comunidade k1tty</p>
        <p style={{ margin: '10px 0' }}>Você, por chegar até aqui</p>

        <p style={{ margin: '30px 0' }}>—</p>
        <p style={{ margin: '30px 0', fontSize: '24px', color: '#C7EF00' }}>
          Obrigado! 🐱
        </p>

        <p style={{ margin: '30px 0' }}>—</p>
        <p style={{ marginTop: '200px', fontSize: '28px', letterSpacing: '10px' }}>
          F I M
        </p>
      </div>

      <style>{`
        @keyframes scrollCredits {
          from { bottom: -150%; }
          to   { bottom: 100%; }
        }
      `}</style>
    </div>
  );
}