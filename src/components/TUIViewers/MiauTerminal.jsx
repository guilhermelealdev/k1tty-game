// src/components/TUIViewers/MiauTerminal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import SpriteAvatar from '../SpriteAvatar.jsx';

const COMMAND = 'rm -rf /';
const TYPE_DELAY = 170;

const REMOVAL_LOGS = [
  '/home/k1tty/Documents',
  '/home/k1tty/Music',
  '/home/k1tty/Pictures',
  '/home/k1tty/.notes.txt',
  '/etc/logo.txt',
  '/var/log/userlog',
  '/root/secret/README.txt',
  '/root/secret/cat_photos.zip',
  '/usr/share/wallpapers',
  '/boot/vmlinuz',
  'Sistema corrompido!',
];

export default function MiauTerminal() {
  const { dispatch } = useGame();
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('typing'); // typing | confirm | typingConfirm | logs | done
  const [logs, setLogs] = useState([]);
  const scrollRef = useRef(null);

  /* 1) digita "rm -rf /" */
  useEffect(() => {
    if (phase !== 'typing') return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(COMMAND.slice(0, i));
      if (i >= COMMAND.length) {
        clearInterval(interval);
        setTimeout(() => setPhase('confirm'), 700);
      }
    }, TYPE_DELAY);
    return () => clearInterval(interval);
  }, [phase]);

  /* 2) mostra prompt de confirmação, ela digita "y" */
  useEffect(() => {
    if (phase !== 'confirm') return;
    const t = setTimeout(() => setPhase('typingConfirm'), 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'typingConfirm') return;
    const t = setTimeout(() => {
      setTyped(prev => prev + '\ny');
      setTimeout(() => setPhase('logs'), 400);
    }, 200);
    return () => clearTimeout(t);
  }, [phase]);

  /* 3) logs de remoção em sequência */
  useEffect(() => {
    if (phase !== 'logs') return;
    let i = 0;
    const interval = setInterval(() => {
      setLogs(prev => [...prev, `removendo ${REMOVAL_LOGS[i]}...`]);
      i++;
      if (i >= REMOVAL_LOGS.length) {
        clearInterval(interval);
        setPhase('done');
      }
    }, 320);
    return () => clearInterval(interval);
  }, [phase]);

  /* 4) corrompe */
  useEffect(() => {
    if (phase !== 'done') return;
        const t = setTimeout(() => {
      dispatch({ type: 'CORRUPT_SYSTEM', payload: { source: 'miau' } });
    }, 1800);
    return () => clearTimeout(t);
  }, [phase, dispatch]);

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, typed]);

  const showPrompt = phase === 'typing' || phase === 'confirm' || phase === 'typingConfirm' || phase === 'logs' || phase === 'done';
  const showConfirmLine = phase === 'confirm' || phase === 'typingConfirm' || phase === 'logs' || phase === 'done';
  const confirmTyped = phase === 'typingConfirm' || phase === 'logs' || phase === 'done';

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-deep)',
      fontFamily: 'Fira Code, monospace',
      fontSize: '12px',
      color: 'var(--color-command)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header com sprite */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-error)',
        background: 'rgba(60, 0, 0, 0.5)',
        flexShrink: 0,
      }}>
        <SpriteAvatar talking={true} size={48} alt="miau" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: 'var(--color-error)',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textShadow: 'var(--glow-intense)',
          }}>
            miau@k1tty:~
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
            ela tomou o terminal
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          padding: '12px 14px',
          overflowY: 'auto',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          minHeight: 0,
        }}
      >
        {showPrompt && (
          <div>
            <span style={{ color: 'var(--color-border)' }}>miau@k1tty</span>
            <span style={{ color: 'var(--color-dim)' }}>:</span>
            <span style={{ color: 'var(--color-command)' }}>~</span>
            <span style={{ color: 'var(--color-text)' }}>$</span>{' '}
            <span style={{ color: 'var(--color-error)' }}>{typed.split('\n')[0]}</span>
            {phase === 'typing' && (
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '1em',
                background: 'var(--color-error)',
                verticalAlign: 'text-bottom',
                marginLeft: '2px',
                animation: 'blink 1s step-end infinite',
              }} />
            )}
          </div>
        )}

        {showConfirmLine && (
          <div style={{ color: 'var(--color-warning)', marginTop: '4px' }}>
            ⚠ Isso destruirá todo o sistema! Digite "y" para confirmar:
          </div>
        )}

        {confirmTyped && (
          <div style={{ color: 'var(--color-error)' }}>
            y
          </div>
        )}

        {logs.map((log, i) => {
          const isLast = log.includes('Sistema corrompido');
          return (
            <div
              key={i}
              style={{
                color: isLast ? 'var(--color-error)' : 'var(--color-dim)',
                fontWeight: isLast ? 'bold' : 'normal',
                textShadow: isLast ? 'var(--glow-intense)' : 'none',
                animation: 'line-appear 0.18s ease-out',
              }}
            >
              {log}
            </div>
          );
        })}
      </div>

      {/* Scanline vermelha */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(239, 100, 97, 0.08) 3px, rgba(239, 100, 97, 0.08) 4px)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes line-appear {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}