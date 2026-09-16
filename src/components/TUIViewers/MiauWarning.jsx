// src/components/TUIViewers/MiauWarning.jsx

import React, { useState, useEffect, useMemo } from 'react';
import SpriteAvatar from '../SpriteAvatar.jsx';

const MESSAGES = [
  'SISTEMA INFECTADO',
  'VOCÊ NÃO DEVIA TER FEITO ISSO',
  'EU ESTOU EM TODO LUGAR',
  'PROCESSANDO CORRUPÇÃO...',
  'NÃO TENTE FECHAR NADA',
  'VAI DOER UM POUCO',
  '99% DOS SEUS ARQUIVOS FORAM MOVIDOS',
  'VOCÊ ACHOU QUE ME CONHECIA',
  'ADEUS, k1tty',
  'EU AVISEI',
  'VOCÊ NÃO ESTÁ SOZINHA',
  'SEU TERMINAL É MEU AGORA',
];

export default function MiauWarning() {
  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    []
  );

  const [blink, setBlink] = useState(true);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 400);
    return () => clearInterval(t);
  }, []);

  // Fundo pisca em vermelho
  useEffect(() => {
    const t = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }, 900);
    return () => clearInterval(t);
  }, []);

  // Tremor ocasional
  useEffect(() => {
    const t = setInterval(() => {
      setShake(true);
      setTimeout(() => setShake(false), 120);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '10px',
      background: flash
        ? 'rgba(120, 0, 0, 0.85)'
        : 'rgba(30, 0, 0, 0.6)',
      border: '1px solid var(--color-error)',
      boxShadow: flash
        ? '0 0 24px var(--color-error) inset, 0 0 18px var(--color-error)'
        : '0 0 12px var(--color-error-a40) inset',
      animation: shake ? 'warning-shake 0.12s linear' : 'none',
      overflow: 'hidden',
      position: 'relative',
      transition: 'background 0.15s, box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
        <SpriteAvatar talking={true} size={56} alt="miau" />
        <div style={{
          fontSize: '11px',
          color: 'var(--color-error)',
          fontWeight: 'bold',
          textShadow: 'var(--glow-intense)',
          letterSpacing: '0.5px',
          lineHeight: 1.4,
          maxWidth: '160px',
        }}>
          {message}
        </div>
      </div>

      <div style={{
        fontSize: '10px',
        color: 'var(--color-error)',
        opacity: blink ? 1 : 0.3,
        letterSpacing: '3px',
        transition: 'opacity 0.15s',
        zIndex: 2,
      }}>
        ⚠ ⚠ ⚠
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(239, 100, 97, 0.18) 3px, rgba(239, 100, 97, 0.18) 4px)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'warning-scan 2s linear infinite',
      }} />

      <style>{`
        @keyframes warning-shake {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-2px, 1px); }
          50%  { transform: translate(2px, -1px); }
          75%  { transform: translate(-1px, -2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes warning-scan {
          0%   { background-position: 0 0; }
          100% { background-position: 0 12px; }
        }
      `}</style>
    </div>
  );
}