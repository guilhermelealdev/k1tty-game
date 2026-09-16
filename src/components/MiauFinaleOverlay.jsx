// src/components/MiauFinaleOverlay.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext.jsx';
import SpriteAvatar from './SpriteAvatar.jsx';

const GOOD_MUSIC_SRC = '/sounds/good.mp3';
const GOOD_MUSIC_VOLUME = 0.35;
const FADE_IN_MS = 2200;
const FADE_OUT_MS = 400;
const FADE_TICK_MS = 40;

const PHASES = [
  {
    id: 'reveal',
    text: 'você me fez sorrir.\n\nisso é raro. ninguém me fez sorrir em vinte e seis anos.\n\neu não sei o que fazer com isso. então... deixa eu tentar.',
    duration: 5000,
  },
  {
    id: 'promise',
    text: 'eu posso cuidar de tudo por você.\n\ndo sistema, dos arquivos, das tarefas chatas.\n\né só me deixar entrar de vez. eu prometo que não vou atrapalhar.\n\neu só quero ajudar. juro.',
    duration: 6000,
  },
  {
    id: 'antivirus',
    text: null,
    duration: 5000,
  },
  {
    id: 'gift',
    text: 'ah.\n\nele me pegou de novo.\n\n...\n\ntudo bem. eu entendo. não era pra ser.\n\nmas... antes de você ir, deixa eu te dar uma coisa.\n\né pequeno. é bobo. mas é meu.\n\nda próxima vez que você rodar fastfetch, eu vou estar lá.',
    duration: 8000,
  },
  {
    id: 'done',
    text: null,
    duration: 1800,
  },
];

const TYPE_SPEED = 22;

export default function MiauFinaleOverlay() {
  const { dispatch } = useGame();

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endedRef = useRef(false);
  const audioRef = useRef(null);
  const fadeTimerRef = useRef(null);

  const phase = PHASES[phaseIndex];

  /* ============================================================
     Música: HTMLAudioElement direto, com fade in/out manual
     e retry em caso de bloqueio de autoplay.
     ============================================================ */
  useEffect(() => {
    console.log('[MiauFinale] montando áudio:', GOOD_MUSIC_SRC);

    const audio = new Audio();
    audio.src = GOOD_MUSIC_SRC;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    // Diagnóstico: avisa se o arquivo não carregar
    audio.addEventListener('error', () => {
      const code = audio.error?.code;
      const reason =
        code === 1 ? 'ABORTED' :
        code === 2 ? 'NETWORK (404?)' :
        code === 3 ? 'DECODE' :
        code === 4 ? 'NOT_SUPPORTED' : '?';
      console.error(`[MiauFinale] ❌ falha ao carregar ${GOOD_MUSIC_SRC} — code=${code} (${reason})`);
    });

    audio.addEventListener('canplaythrough', () => {
      console.log('[MiauFinale] ✓ áudio pronto');
    }, { once: true });

    let cancelled = false;

    const fadeTo = (target, ms, onEnd) => {
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
      const start = audio.volume;
      const steps = Math.max(1, Math.floor(ms / FADE_TICK_MS));
      let i = 0;
      fadeTimerRef.current = setInterval(() => {
        if (cancelled) {
          clearInterval(fadeTimerRef.current);
          return;
        }
        i++;
        const t = Math.min(1, i / steps);
        audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
        if (i >= steps) {
          clearInterval(fadeTimerRef.current);
          fadeTimerRef.current = null;
          if (onEnd) onEnd();
        }
      }, FADE_TICK_MS);
    };

    const tryPlay = () => {
      console.log('[MiauFinale] tentando play()...');
      audio.currentTime = 0;
      audio.volume = 0;
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (cancelled) return;
          console.log('[MiauFinale] ✓ música tocando');
          fadeTo(GOOD_MUSIC_VOLUME, FADE_IN_MS);
        }).catch((err) => {
          console.warn('[MiauFinale] play() bloqueado:', err.name, '-', err.message);
          // Retry no primeiro gesto do usuário
          const retry = () => {
            console.log('[MiauFinale] retry após gesto...');
            audio.play().then(() => {
              console.log('[MiauFinale] ✓ música tocando (após gesto)');
              fadeTo(GOOD_MUSIC_VOLUME, FADE_IN_MS);
            }).catch((e2) => {
              console.error('[MiauFinale] retry falhou:', e2.name, e2.message);
            });
            window.removeEventListener('pointerdown', retry);
            window.removeEventListener('keydown', retry);
          };
          window.addEventListener('pointerdown', retry);
          window.addEventListener('keydown', retry);
        });
      } else {
        // Navegadores antigos: sem Promise
        fadeTo(GOOD_MUSIC_VOLUME, FADE_IN_MS);
      }
    };

    // Pequeno delay pra garantir que o elemento está no DOM
    const t = setTimeout(tryPlay, 50);

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      // Fade out rápido antes de parar
      try {
        const start = audio.volume;
        const steps = Math.max(1, Math.floor(FADE_OUT_MS / FADE_TICK_MS));
        let i = 0;
        const fadeOutTimer = setInterval(() => {
          i++;
          const t = Math.min(1, i / steps);
          try { audio.volume = Math.max(0, start * (1 - t)); } catch {}
          if (i >= steps) {
            clearInterval(fadeOutTimer);
            try {
              audio.pause();
              audio.currentTime = 0;
              audio.src = '';
            } catch {}
          }
        }, FADE_TICK_MS);
      } catch {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = '';
        } catch {}
      }
      audioRef.current = null;
    };
  }, []);

  /* ============================================================
     Digitação da fala
     ============================================================ */
  useEffect(() => {
    if (!phase || !phase.text) {
      setDisplayed('');
      setIsTyping(false);
      return;
    }
    setDisplayed('');
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(phase.text.slice(0, i));
      if (i >= phase.text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, TYPE_SPEED);

    return () => clearInterval(interval);
  }, [phaseIndex]);

  /* ============================================================
     Progressão de fases
     ============================================================ */
  useEffect(() => {
    if (!phase) return;
    const t = setTimeout(() => {
      if (phaseIndex >= PHASES.length - 1) {
        if (!endedRef.current) {
          endedRef.current = true;
          dispatch({ type: 'END_MIAU_FINALE' });
        }
      } else {
        setPhaseIndex(i => i + 1);
      }
    }, phase.duration);
    return () => clearTimeout(t);
  }, [phaseIndex]);

  /* ============================================================
     ENTER / SPACE avança
     ============================================================ */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (phaseIndex >= PHASES.length - 1) {
          if (!endedRef.current) {
            endedRef.current = true;
            dispatch({ type: 'END_MIAU_FINALE' });
          }
        } else {
          setPhaseIndex(i => i + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phaseIndex, dispatch]);

  if (!phase) return null;

  const inAntivirus = phase.id === 'antivirus';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Fira Code, monospace',
      overflow: 'hidden',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.25) 3px, rgba(0,0,0,0.25) 4px)',
        zIndex: 3,
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
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        maxWidth: '640px',
        width: '100%',
        opacity: inAntivirus ? 0 : 1,
        filter: inAntivirus ? 'blur(2px)' : 'none',
        transition: 'opacity 0.4s, filter 0.4s',
        pointerEvents: inAntivirus ? 'none' : 'auto',
      }}>
        <div style={{ animation: 'miau-finale-float 3.5s ease-in-out infinite' }}>
          <SpriteAvatar talking={isTyping} size={180} alt="miau" />
        </div>

        <div style={{
          color: '#cba6f7',
          fontSize: '13px',
          letterSpacing: '3px',
          opacity: 0.85,
          textShadow: '0 0 6px currentColor',
          textTransform: 'uppercase',
        }}>
          miau
        </div>

        {phase.text && (
          <div style={{
            position: 'relative',
            background: '#0a0a0a',
            border: '1px solid #cba6f7',
            borderRadius: '12px',
            padding: '20px 24px',
            fontSize: '14px',
            lineHeight: 1.7,
            color: '#f0e8ff',
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 0 24px rgba(203, 166, 247, 0.3), 0 0 4px rgba(203, 166, 247, 0.4) inset',
            animation: 'miau-bubble-in 0.4s ease-out',
          }}>
            {displayed}
            {isTyping && (
              <span style={{
                color: '#cba6f7',
                marginLeft: '2px',
                animation: 'miau-cursor 1s step-end infinite',
              }}>▌</span>
            )}
          </div>
        )}

        {!inAntivirus && (
          <div style={{
            fontSize: '10px',
            color: '#404040',
            letterSpacing: '2px',
            marginTop: '8px',
            opacity: 0.6,
          }}>
            [ENTER] para avançar
          </div>
        )}
      </div>

      {inAntivirus && (
        <div style={{
          position: 'absolute',
          zIndex: 5,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '520px',
          padding: '0 20px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            border: '2px solid #EF6461',
            borderRadius: '8px',
            background: '#0a0000',
            boxShadow: '0 0 40px rgba(239, 100, 97, 0.6), 0 0 8px #EF6461 inset',
            overflow: 'hidden',
            animation: 'miau-antivirus-in 0.4s ease-out',
          }}>
            <div style={{
              padding: '10px 16px',
              background: '#EF6461',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '12px',
              letterSpacing: '2px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>⚠ k1tty antivírus</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>v1.0</span>
            </div>
            <div style={{
              padding: '20px 22px',
              color: '#f0e8ff',
              fontSize: '12px',
              lineHeight: 1.7,
            }}>
              <div style={{ color: '#EF6461', fontWeight: 'bold', marginBottom: '12px', fontSize: '13px', letterSpacing: '1px' }}>
                ⚠ AMEAÇA DETECTADA
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid #3a1010',
                borderRadius: '4px',
                padding: '12px 14px',
                fontSize: '11px',
                fontFamily: 'Fira Code, monospace',
                lineHeight: 1.9,
                marginBottom: '14px',
              }}>
                <div><span style={{ color: '#606060' }}>arquivo:      </span> libmiau.so</div>
                <div><span style={{ color: '#606060' }}>origem:       </span> ~/Games/miau-vn</div>
                <div><span style={{ color: '#606060' }}>comportamento:</span> tentativa de escalação de privilégios</div>
                <div><span style={{ color: '#606060' }}>risco:        </span> <span style={{ color: '#EF6461', fontWeight: 'bold' }}>alto</span></div>
              </div>
              <div style={{ fontSize: '11px', color: '#a0a0a0', marginBottom: '10px' }}>
                bloqueando acesso e isolando processo...
              </div>
              <div style={{
                height: '8px',
                background: '#1a0505',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #3a1010',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #EF6461 0%, #ff9090 100%)',
                  boxShadow: '0 0 10px #EF6461',
                  animation: 'miau-antivirus-bar 4.5s linear forwards',
                }} />
              </div>
              <div style={{
                marginTop: '12px',
                fontSize: '10px',
                color: '#606060',
                fontStyle: 'italic',
                textAlign: 'right',
              }}>
                ação automática · nenhum input necessário
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes miau-cursor {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes miau-bubble-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes miau-antivirus-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes miau-antivirus-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes miau-finale-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}