// src/components/OSSwitchOverlay.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../state/GameContext.jsx';

/* ============================================================
   ASCII do d0ggy OS (cachorrinho).
   Array de linhas evita qualquer problema de escape.
   ============================================================ */
const DOGGY_ASCII_LINES = [
  '         __',
  '        /  \\',
  '       / ..|\\',
  '      (_\\  |_)',
  "      /  \\@'",
  '     /     \\',
  '_   /  `   |',
  '\\/  \\  | _\\',
  ' \\   /_ || \\_',
  '  \\____)|_) \\_)',
];

const WARN_COLOR = '#cba6f7';
const ASCII_COLOR = '#95C623';

const BOOT_LINES = [
  { t: 'Desligando k1tty OS...',                     delay: 500 },
  { t: '',                                            delay: 220 },
  { t: '[  OK  ] Unmounting /home/k1tty',             delay: 300 },
  { t: '[  OK  ] Unmounting /var',                    delay: 280 },
  { t: '[  OK  ] Stopping gato-daemon.service',       delay: 300 },
  { t: '[  OK  ] Stopping purr-service.service',      delay: 280 },
  { t: '[  OK  ] Stopping meow-scheduler.service',    delay: 300 },
  { t: '[  OK  ] Stopping ronronar-daemon.service',   delay: 280 },
  { t: '[  OK  ] Reached target Shutdown.',           delay: 500 },
  { t: '',                                            delay: 600 },
  { t: 'k1tty OS encerrado.',                         delay: 800 },
  { t: '',                                            delay: 500 },
  { t: '> Inserindo disco de instalação: d0ggy.iso',  delay: 800 },
  { t: '> Montando /dev/sr0 em /media/d0ggy...',      delay: 500 },
  { t: '[  OK  ] Imagem reconhecida: d0ggy OS 1.0',   delay: 500 },
  { t: '',                                            delay: 500 },
  { t: 'Carregando d0ggy OS 1.0 "Good Boy"...',       delay: 700 },
  { t: '',                                            delay: 300 },
  // Bloco ASCII completo (renderizado como um único <pre>)
  { t: DOGGY_ASCII_LINES.join('\n'),                  delay: 1000, ascii: true },
  { t: '',                                            delay: 400 },
  { t: '[  OK  ] Kernel d0ggy carregado',             delay: 400 },
  { t: '[  OK  ] Woof daemon iniciado',               delay: 400 },
  { t: '[  OK  ] Buscando gravetos...',               delay: 500 },
  { t: '[  OK  ] Sistema operacional trocado',        delay: 500 },
  { t: '',                                            delay: 500 },
  { t: 'k1tty OS foi substituído por d0ggy OS.',     delay: 900, warn: true },
  { t: 'Seus arquivos foram preservados.',            delay: 700, warn: true },
  { t: 'Nada é realmente perdido.',                   delay: 700, warn: true },
  { t: '',                                            delay: 500 },
  { t: 'Boa sorte no d0ggy OS. woof.',                delay: 900, warn: true },
];

export default function OSSwitchOverlay() {
  const { dispatch } = useGame();
  const [visibleCount, setVisibleCount] = useState(0);
  const [blink, setBlink] = useState(true);
  const finishedRef = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (visibleCount >= BOOT_LINES.length) return;
    const line = BOOT_LINES[visibleCount];
    const t = setTimeout(() => setVisibleCount(c => c + 1), line.delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (visibleCount < BOOT_LINES.length) return;
    if (finishedRef.current) return;
    finishedRef.current = true;

    const t = setTimeout(() => {
      dispatch({ type: 'END_OS_SWITCH' });
    }, 2400);
    return () => clearTimeout(t);
  }, [visibleCount, dispatch]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000',
      color: '#c0c0c0',
      fontFamily: 'Fira Code, monospace',
      fontSize: '12px',
      lineHeight: 1.55,
      padding: '24px 32px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      zIndex: 99999,
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)',
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)',
        zIndex: 2,
      }} />

      <div
        ref={scrollRef}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {BOOT_LINES.slice(0, visibleCount).map((line, i) => {
          if (line.ascii) {
            return (
              <pre
                key={i}
                style={{
                  margin: 0,
                  padding: '4px 0',
                  color: ASCII_COLOR,
                  whiteSpace: 'pre',
                  fontFamily: 'Fira Code, monospace',
                  fontSize: '13px',
                  lineHeight: 1.15,
                  textShadow: '0 0 6px rgba(149, 198, 35, 0.5)',
                }}
              >
                {line.t}
              </pre>
            );
          }
          return (
            <div
              key={i}
              style={{
                color: line.warn ? WARN_COLOR : '#c0c0c0',
                fontWeight: line.warn ? 'bold' : 'normal',
              }}
            >
              {line.t}
            </div>
          );
        })}
        {visibleCount < BOOT_LINES.length && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '1em',
            background: '#c0c0c0',
            verticalAlign: 'text-bottom',
            opacity: blink ? 1 : 0,
          }} />
        )}
      </div>
    </div>
  );
}