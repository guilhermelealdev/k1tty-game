// src/components/FinaleOverlay.jsx

import React, { useEffect, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { fetchMultipleCatImages } from '../services/catApi.js';

const GRID_SIZE = 20;
const INTRO_1_DURATION = 2800;
const INTRO_2_DURATION = 2200;
const CAT_DISPLAY_TIME = 12000;

const introContainerStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#000',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 99999,
  fontFamily: 'Fira Code, monospace',
};

export default function FinaleOverlay() {
  const { state, dispatch } = useGame();
  const [phase, setPhase] = useState('intro1');
  const [catUrls, setCatUrls] = useState([]);

  // Prefetch durante as fases de intro.
  // Não preenchemos com repetições: se vierem menos de 20 gatos únicos,
  // as células restantes ficam só com o emoji 🐱 de fundo.
  useEffect(() => {
    let cancelled = false;

    fetchMultipleCatImages(GRID_SIZE)
      .then(urls => {
        if (cancelled) return;
        setCatUrls(urls);
      })
      .catch(() => {
        if (cancelled) return;
        setCatUrls([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Progressão das fases
  useEffect(() => {
    if (phase === 'intro1') {
      const t = setTimeout(() => setPhase('intro2'), INTRO_1_DURATION);
      return () => clearTimeout(t);
    }
    if (phase === 'intro2') {
      const t = setTimeout(() => setPhase('cats'), INTRO_2_DURATION);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Volta ao menu depois dos gatos
  useEffect(() => {
    if (phase !== 'cats') return;
    const timer = setTimeout(() => {
      if (state.currentSave !== null) {
        dispatch({ type: 'SAVE_TO_SLOT', payload: state.currentSave });
      }
      setTimeout(() => {
        dispatch({ type: 'END_FINALE' });
      }, 400);
    }, CAT_DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, [phase, dispatch, state.currentSave]);

  if (phase === 'intro1') {
    return (
      <div style={introContainerStyle}>
        <div style={{
          fontSize: 'clamp(22px, 4vw, 42px)',
          color: '#C7EF00',
          textShadow: '0 0 20px #C7EF00, 0 0 40px #C7EF00',
          textAlign: 'center',
          padding: '0 20px',
          animation: 'introFadeIn 1s ease-out both',
        }}>
          Mas antes de qualquer coisa. . .
        </div>
        <style>{`
          @keyframes introFadeIn {
            from { opacity: 0; transform: translateY(20px); letter-spacing: 0.3em; }
            to   { opacity: 1; transform: translateY(0); letter-spacing: 0.05em; }
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'intro2') {
    return (
      <div style={introContainerStyle}>
        <div style={{
          fontSize: 'clamp(80px, 18vw, 220px)',
          color: '#C7EF00',
          textShadow: '0 0 30px #C7EF00, 0 0 60px #C7EF00, 0 0 90px #C7EF00',
          textAlign: 'center',
          animation: 'catFacePop 0.7s cubic-bezier(0.2, 0.8, 0.2, 1.4) both',
        }}>
          :3
        </div>
        <style>{`
          @keyframes catFacePop {
            0%   { opacity: 0; transform: scale(0.2); filter: brightness(3); }
            60%  { opacity: 1; transform: scale(1.18); filter: brightness(1.6); }
            100% { opacity: 1; transform: scale(1); filter: brightness(1); }
          }
        `}</style>
      </div>
    );
  }

  // Fase 3: grade 5×4. Cada célula tem emoji 🐱 de fundo; se houver
  // uma URL única para aquela posição, a foto cobre o emoji.
  const cells = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    cells.push(catUrls[i] || null);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        zIndex: 99999,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: '4px',
        padding: '8px',
        boxSizing: 'border-box',
        animation: 'gridFadeIn 0.6s ease-out both',
      }}
    >
      {cells.map((url, index) => (
        <div
          key={index}
          style={{
            position: 'relative',
            borderRadius: '4px',
            overflow: 'hidden',
            background: 'radial-gradient(circle at center, #003338 0%, #001a1d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(24px, 4vw, 56px)',
            animation: `fadeInCat 0.4s ease-out ${index * 0.08}s both`,
          }}
        >
          <span style={{ userSelect: 'none', opacity: url ? 0 : 1 }}>🐱</span>
          {url && (
            <img
              src={url}
              alt={`gato ${index + 1}`}
              onLoad={(e) => { e.target.style.opacity = 1; }}
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0,
                transition: 'opacity 0.4s',
              }}
            />
          )}
        </div>
      ))}
      <style>{`
        @keyframes fadeInCat {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes gridFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}