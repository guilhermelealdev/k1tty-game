// src/components/MiauFastfetch.jsx

import React, { useEffect, useState } from 'react';

export default function MiauFastfetch({ line }) {
  const [pose, setPose] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        setPose('idle');
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1200));
        if (cancelled) return;
        setPose('talking');
        await new Promise(r => setTimeout(r, 500 + Math.random() * 600));
      }
    };
    loop();

    return () => { cancelled = true; };
  }, []);

  const src = pose === 'talking' ? '/pictures/talking.png' : '/pictures/idle.webp';

  return (
    <div style={{
      display: 'flex',
      gap: '22px',
      padding: '10px 0 16px',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      <img
        src={src}
        alt="miau"
        draggable={false}
        style={{
          width: '140px',
          height: '140px',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          flexShrink: 0,
          filter: 'drop-shadow(0 0 8px var(--color-command-a40))',
          animation: 'miau-fastfetch-bounce 3s ease-in-out infinite',
          transition: 'transform 0.08s ease-out',
          transform: pose === 'talking' ? 'scale(1.03)' : 'scale(1)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        flex: 1,
        minWidth: '240px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <div style={{
          fontSize: '12px',
          lineHeight: 1.55,
          color: 'var(--color-text)',
          fontFamily: 'Fira Code, monospace',
        }}>
          <div><span style={{ color: 'var(--color-command)', display: 'inline-block', minWidth: '80px' }}>Usuário:</span> k1tty@k1tty</div>
          <div><span style={{ color: 'var(--color-command)', display: 'inline-block', minWidth: '80px' }}>Host:</span> k1tty</div>
          <div><span style={{ color: 'var(--color-command)', display: 'inline-block', minWidth: '80px' }}>Sistema:</span> k1tty Linux 1.0.0</div>
          <div><span style={{ color: 'var(--color-command)', display: 'inline-block', minWidth: '80px' }}>Kernel:</span> 6.6.6-k1tty-miau</div>
          <div><span style={{ color: 'var(--color-command)', display: 'inline-block', minWidth: '80px' }}>Shell:</span> ksh (k1tty shell)</div>
          <div><span style={{ color: 'var(--color-command)', display: 'inline-block', minWidth: '80px' }}>Companhia:</span> miau 🐱</div>
        </div>

        <div style={{
          position: 'relative',
          background: 'var(--color-bg-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--color-text)',
          fontStyle: 'italic',
          lineHeight: 1.5,
          boxShadow: '0 0 12px var(--color-command-a15)',
          marginLeft: '6px',
          fontFamily: 'Fira Code, monospace',
        }}>
          <div style={{
            position: 'absolute',
            left: '-9px',
            top: '14px',
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '9px solid var(--color-border)',
          }} />
          <div style={{
            position: 'absolute',
            left: '-7px',
            top: '14px',
            width: 0,
            height: 0,
            borderTop: '7px solid transparent',
            borderBottom: '7px solid transparent',
            borderRight: '9px solid var(--color-bg-panel)',
          }} />
          <span style={{ color: 'var(--color-command)', marginRight: '6px', fontStyle: 'normal' }}>
            miau:
          </span>
          {line}
        </div>
      </div>

      <style>{`
        @keyframes miau-fastfetch-bounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}