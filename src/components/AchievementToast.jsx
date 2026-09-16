// src/components/AchievementToast.jsx

import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { getAchievementById } from '../data/achievements.js';

const TOAST_VISIBLE_MS = 3400;   // tempo totalmente visível
const TOAST_EXIT_MS = 550;       // duração da animação de saída

export default function AchievementToast() {
  const { state, dispatch } = useGame();
  const queue = state.pendingUnlocks || [];
  const pending = queue[0] || null;

  const audioRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  // Agenda saída + shift da fila
  useEffect(() => {
    if (!pending) return;

    setIsExiting(false);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, TOAST_VISIBLE_MS);

    const shiftTimer = setTimeout(() => {
      dispatch({ type: 'SHIFT_PENDING_UNLOCK' });
    }, TOAST_VISIBLE_MS + TOAST_EXIT_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(shiftTimer);
    };
  }, [pending, dispatch]);

  // Toca som de conquista reusando meow.mp3
  useEffect(() => {
    if (!pending) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/meow.mp3');
        audioRef.current.preload = 'auto';
      }
      const audio = audioRef.current;
      audio.volume = 0.35;
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* autoplay bloqueado */ });
      }
    } catch (e) { /* ignora */ }
  }, [pending]);

  // Cleanup: pausa e libera o áudio ao desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = '';
          audioRef.current.load();
        } catch {}
        audioRef.current = null;
      }
    };
  }, []);

  if (!pending) return null;

  const achievement = getAchievementById(pending);
  if (!achievement) return null;

  const queuedAfter = Math.max(0, queue.length - 1);

  return (
    <div
      // key força remount → animação de entrada replay pra cada conquista
      key={pending}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100000,
        minWidth: '280px',
        maxWidth: '360px',
        padding: '12px 16px 14px',
        background: 'var(--color-bg-panel)',
        border: '1px solid var(--color-command)',
        borderRadius: '4px',
        boxShadow:
          '0 0 20px rgba(0, 0, 0, 0.6), ' +
          '0 0 12px var(--color-command-a40), ' +
          '0 0 3px var(--color-command) inset',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'Fira Code, monospace',
        pointerEvents: 'none',
        overflow: 'hidden',
        animation: isExiting
          ? `achievementExit ${TOAST_EXIT_MS}ms cubic-bezier(0.5, 0, 0.9, 0.5) forwards`
          : 'achievementEnter 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.35) both',
        willChange: 'transform, opacity',
      }}
    >
      {/* Ícone */}
      <span style={{
        fontSize: '32px',
        lineHeight: 1,
        filter: 'drop-shadow(0 0 6px var(--color-command))',
        flexShrink: 0,
        animation: 'achievementIconEnter 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.3) both',
        display: 'inline-block',
      }}>
        {achievement.icon}
      </span>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-command)',
          letterSpacing: '2px',
          textShadow: '0 0 4px var(--color-command)',
          marginBottom: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>🏆 CONQUISTA DESBLOQUEADA</span>
          {queuedAfter > 0 && (
            <span style={{
              fontSize: '9px',
              padding: '1px 6px',
              borderRadius: '8px',
              border: '1px solid var(--color-command-a40)',
              color: 'var(--color-command)',
              opacity: 0.8,
              letterSpacing: '0.5px',
            }}>
              +{queuedAfter}
            </span>
          )}
        </div>
        <div style={{
          fontSize: '13px',
          fontWeight: 'bold',
          color: 'var(--color-text)',
          marginBottom: '2px',
        }}>
          {achievement.name}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-dim)',
          lineHeight: 1.4,
        }}>
          {achievement.desc}
        </div>
      </div>

      {/* Barra de progresso (tempo restante) */}
      {!isExiting && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--color-command) 0%, var(--color-border) 100%)',
          boxShadow: '0 0 6px var(--color-command)',
          animation: `achievementProgress ${TOAST_VISIBLE_MS}ms linear forwards`,
          pointerEvents: 'none',
        }} />
      )}

      <style>{`
        @keyframes achievementEnter {
          0% {
            opacity: 0;
            transform: translateX(120%) scale(0.85) rotate(3deg);
          }
          60% {
            opacity: 1;
            transform: translateX(-6px) scale(1.03) rotate(-1.5deg);
          }
          85% {
            transform: translateX(2px) scale(0.995) rotate(0.5deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0deg);
          }
        }

        @keyframes achievementExit {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: translateX(-4px) scale(1.02) rotate(1deg);
          }
          100% {
            opacity: 0;
            transform: translateX(130%) scale(0.85) rotate(-4deg);
          }
        }

        @keyframes achievementIconEnter {
          0%   { transform: scale(0.4) rotate(-25deg); opacity: 0; }
          45%  { transform: scale(1.35) rotate(12deg); opacity: 1; }
          70%  { transform: scale(0.92) rotate(-4deg); }
          88%  { transform: scale(1.05) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes achievementProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}