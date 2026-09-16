// src/components/PreloadScreen.jsx

import React, { useEffect, useState, useRef } from 'react';
import { createAudio, playUnmuted } from '../services/unlockableAudio.js';

const LOADING_MUSIC_SRC = '/sounds/loading.mp3';
const LOADING_VOLUME = 0.20;
const FADE_IN_MS = 1500;
const FADE_OUT_MS = 500;

const SERVICES = [
  { name: 'Reached target Basic System',                          delay: 320 },
  { name: 'Started Load Kernel Modules',                          delay: 240 },
  { name: 'Started Remount Root and Kernel File Systems',         delay: 280 },
  { name: 'Started Journal Service',                              delay: 260 },
  { name: 'Started udev Kernel Device Manager',                   delay: 300 },
  { name: 'Started Flush Journal to Persistent Storage',          delay: 260 },
  { name: 'Started Create Static Device Nodes in /dev',           delay: 240 },
  { name: 'Started File System Check on Root Device',             delay: 320 },
  { name: 'Started Remount Root and Kernel File Systems',         delay: 240 },
  { name: 'Started Network Manager',                              delay: 380 },
  { name: 'Started Network Manager Script Dispatcher Service',    delay: 300 },
  { name: 'Started WPA Supplicant',                               delay: 320 },
  { name: 'Reached target Network',                               delay: 280 },
  { name: 'Reached target Network is Online',                     delay: 260 },
  { name: 'Started kitty-cache.service',                          delay: 360 },
  { name: 'Started gato-daemon.service',                          delay: 320 },
  { name: 'Started meow-scheduler.service',                       delay: 300 },
  { name: 'Started purr-service.service',                         delay: 280 },
  { name: 'Started ronronar-daemon.service',                      delay: 280 },
  { name: 'Started brinquedo.service',                            delay: 240 },
  { name: 'Started caixa_de_papelao.service',                     delay: 300 },
  { name: 'Started Update UTMP about System Boot/Shutdown',       delay: 240 },
  { name: 'Started User Login Management',                        delay: 380 },
  { name: 'Started ksh login shell',                              delay: 360 },
  { name: 'Reached target Multi-User System',                     delay: 500 },
  { name: 'Reached target Graphical Interface',                   delay: 400 },
  { name: 'Startup finished in 7.412s (kernel) + 3.208s (userspace) = 10.620s', delay: 700 },
];

const MIN_DISPLAY_MS = 5000;
const TAIL_MS = 1000;

export default function PreloadScreen({ progress, onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [dots, setDots] = useState('');
  const [blink, setBlink] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const startTimeRef = useRef(Date.now());
  const completeCalledRef = useRef(false);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const audio = createAudio({ src: LOADING_MUSIC_SRC, loop: true });
    const handle = playUnmuted(audio, {
      volume: LOADING_VOLUME,
      fadeInMs: FADE_IN_MS,
      fadeOutMs: FADE_OUT_MS,
    });
    return () => handle.stop();
  }, []);

  useEffect(() => {
    if (visibleCount >= SERVICES.length) return;
    const svc = SERVICES[visibleCount];
    const t = setTimeout(() => setVisibleCount(c => c + 1), svc.delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (completeCalledRef.current) return;

    const allShown = visibleCount >= SERVICES.length;
    if (!allShown) return;
    if (progressRef.current < 100) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const t = setTimeout(() => {
      if (completeCalledRef.current) return;
      completeCalledRef.current = true;
      setIsReady(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, TAIL_MS);
    }, remaining);

    return () => clearTimeout(t);
  }, [visibleCount, onComplete]);

  const allShown = visibleCount >= SERVICES.length;
  const current = visibleCount < SERVICES.length ? SERVICES[visibleCount] : null;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--color-bg-deep)',
      color: 'var(--color-text)',
      fontFamily: 'Fira Code, monospace',
      fontSize: '13px',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 44px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.32) 2px, rgba(0,0,0,0.32) 3px)',
        mixBlendMode: 'multiply',
        zIndex: 2,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
        zIndex: 2,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 3,
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        lineHeight: 1.55,
      }}>
        <div style={{
          color: 'var(--color-command)',
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '22px',
          textShadow: 'var(--glow-soft)',
          letterSpacing: '0.5px',
        }}>
          [  OK  ] Reached target Basic System.
        </div>

        {SERVICES.slice(0, visibleCount).map((svc, i) => {
          const isSummary = svc.name.startsWith('Startup finished');
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '4px',
                animation: 'preload-log-in 0.2s ease-out',
              }}
            >
              <span style={{
                color: isSummary ? 'var(--color-warning)' : 'var(--color-command)',
                flexShrink: 0,
                fontWeight: 'bold',
                minWidth: '68px',
                textShadow: 'var(--glow-soft)',
              }}>
                [  OK  ]
              </span>
              <span style={{
                color: isSummary ? 'var(--color-warning)' : 'var(--color-text)',
                fontWeight: isSummary ? 'bold' : 'normal',
              }}>
                {svc.name}
              </span>
            </div>
          );
        })}

        {current && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '4px',
          }}>
            <span style={{
              color: 'var(--color-warning)',
              flexShrink: 0,
              fontWeight: 'bold',
              minWidth: '68px',
              animation: 'preload-wait-pulse 1s ease-in-out infinite',
            }}>
              [ .... ]
            </span>
            <span style={{ color: 'var(--color-dim)' }}>{current.name}{dots}</span>
          </div>
        )}

        {allShown && !isReady && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '4px',
          }}>
            <span style={{
              color: 'var(--color-warning)',
              flexShrink: 0,
              fontWeight: 'bold',
              minWidth: '68px',
              animation: 'preload-wait-pulse 1s ease-in-out infinite',
            }}>
              [ .... ]
            </span>
            <span style={{ color: 'var(--color-dim)' }}>aguardando cache de imagens{dots}</span>
          </div>
        )}

        {isReady && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '4px',
            color: 'var(--color-command)',
            textShadow: 'var(--glow-soft)',
          }}>
            <span style={{
              color: 'var(--color-command)',
              flexShrink: 0,
              fontWeight: 'bold',
              minWidth: '68px',
            }}>
              [  OK  ]
            </span>
            <span>entrando no sistema</span>
          </div>
        )}
      </div>

      <div style={{
        position: 'relative',
        zIndex: 3,
        marginTop: '20px',
        paddingTop: '14px',
        borderTop: '1px dashed var(--color-border-a40)',
        fontSize: '11px',
        color: 'var(--color-dim)',
        letterSpacing: '1px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: 'var(--color-command)' }}>k1tty@boot</span>
        <span>—</span>
        <span>{isReady ? 'sessão iniciada' : 'inicializando subsistemas'}</span>
        <span style={{ flex: 1 }} />
        <span>{Math.floor(progress)}%</span>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '1em',
          background: 'var(--color-command)',
          verticalAlign: 'text-bottom',
          marginLeft: '4px',
          opacity: blink ? 1 : 0,
        }} />
      </div>

      <style>{`
        @keyframes preload-log-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes preload-wait-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}