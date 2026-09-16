// src/components/SaveSelect.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { DEFAULT_THEME_ID, getThemeById } from '../data/themes.js';
import { TOTAL_ACHIEVEMENTS } from '../data/achievements.js';
import { createAudio, playUnmuted } from '../services/unlockableAudio.js';
import MatrixBackground from './MatrixBackground.jsx';
import SpriteAvatar from './SpriteAvatar.jsx';

const UI = {
  bg: '#00272B',
  bgDeep: '#001519',
  bgGlow: '#003338',
  bgPanel: '#001a1d',
  bgHeader: '#003338',
  text: '#FFFBFA',
  command: '#C7EF00',
  border: '#95C623',
  error: '#EF6461',
  dim: '#5a7a5a',
  warning: '#E8A87C',
};

const SLOT_COUNT = 3;
const MUTE_KEY = 'k1tty_menu_muted';

const MENU_MUSIC_FILE = 'menu.mp3';
const MENU_MUSIC_SRC = `/music/${encodeURIComponent(MENU_MUSIC_FILE)}`;
const MENU_VOLUME = 0.15;
const FADE_IN_MS = 1800;
const FADE_OUT_MS = 600;

const MEOW_SRC = '/sounds/meow.mp3';
const MEOW_VOLUME = 0.12;

const BUBBLE_DURATION = 3500;
const BUBBLE_WIDTH = '150px';

const MIAU_PHRASES = [
  'oi! bem-vind@ de volta 🐱',
  'pronto pra mais uma sessão?',
  'não mexe nos meus arquivos, tá?',
  'vim te dar boas-vindas, humano',
  'você demorou...',
  'tô com sono. você também?',
  'clicou de novo? calma.',
  'queria um petisco 🐟',
  'sua vez. escolhe um save.',
  'sabe que eu não mordo, né?',
  'meow. é isso. só meow.',
  'hihi',
  'eu gosto quando você volta',
  'você limpou o terminal hoje?',
  'boa sorte com o /root 👀',
  'lembra de fazer backup!',
  'tô de olho 👀',
  'não me deixa brava, ok?',
  'promete que cuida dos gatos?',
  'já viu o fórum hoje?',
  'cuidado com o rm -rf',
  'quer conversar? tem o miau-vn',
  'eu tava dormindo. tudo bem, acorda.',
  'nem todo gato mia. alguns digitam.',
  'eu sei onde você mora 🐾',
];

/* ============================================================
   Metadados dos finais (usado nos slots preenchidos)
   ============================================================ */
const ENDING_META = {
  victory:     { icon: '⭐', label: 'Vitória' },
  miau_bom:    { icon: '🌸', label: 'Amizade com a miau' },
  miau_ruim:   { icon: '💀', label: 'Raiva da miau' },
  aniquilador: { icon: '☠️', label: 'Aniquilador' },
  os_switch:   { icon: '🔄', label: 'Troca de SO' },
};

export default function SaveSelect({ onSelectSave, onNewSave, onDeleteSave }) {
  const [saves, setSaves] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const audioCtlRef = useRef(null);

  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
    setSaves(savedData);
  }, []);

  const withFadeOut = (fn) => (...args) => {
    const ctl = audioCtlRef.current;
    if (ctl?.fadeOutAndStop) ctl.fadeOutAndStop();
    fn(...args);
  };

  const handleSlotClick = (slot) => {
    const data = saves[slot];
    if (data) {
      withFadeOut(onSelectSave)(slot);
    } else {
      setSelectedSlot(prev => prev === slot ? null : slot);
    }
  };

  const handleNewSave = (skipTutorial) => {
    if (selectedSlot !== null) {
      withFadeOut(onNewSave)(selectedSlot, skipTutorial);
    }
  };

  const handleDelete = (slot, e) => {
    e.stopPropagation();
    if (confirmDelete === slot) {
      const newSaves = { ...saves };
      delete newSaves[slot];
      localStorage.setItem('k1tty_saves', JSON.stringify(newSaves));
      setSaves(newSaves);
      onDeleteSave(slot);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(slot);
      setTimeout(() => {
        setConfirmDelete(prev => prev === slot ? null : prev);
      }, 3000);
    }
  };

  return (
    <div className="save-select-screen">
      <MatrixBackground />
      <MenuMusic controlRef={audioCtlRef} />

      <div
        className="save-select-content-noScroll"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100vh',
          padding: '24px 20px 16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <MiauIntro />
          <SectionLabel />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
          }}>
            {Array.from({ length: SLOT_COUNT }).map((_, slot) => (
              <SaveSlot
                key={slot}
                slot={slot}
                save={saves[slot]}
                isSelected={selectedSlot === slot}
                isConfirmDelete={confirmDelete === slot}
                onSelect={() => handleSlotClick(slot)}
                onDelete={(e) => handleDelete(slot, e)}
                onNewSave={handleNewSave}
              />
            ))}
          </div>

          <Footer />
        </div>
      </div>

      <style>{`
        .save-select-content-noScroll::-webkit-scrollbar { display: none; }

        @keyframes save-header-in {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes save-slot-in {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes save-progress-in {
          from { width: 0%; }
        }
        @keyframes save-actions-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes miau-jump {
          0%   { transform: translateY(0) scale(1); }
          25%  { transform: translateY(-22px) scale(1.09); }
          50%  { transform: translateY(-5px) scale(1.02); }
          75%  { transform: translateY(-12px) scale(1.06); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes miau-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
        @keyframes bubble-in-left {
          0%   { opacity: 0; transform: translateY(-50%) translateX(8px) scale(0.6); }
          55%  { opacity: 1; transform: translateY(-50%) translateX(-3px) scale(1.08); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
        }
        @keyframes corner-slide-tl {
          from { opacity: 0; transform: translate(-6px, -6px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes corner-slide-tr {
          from { opacity: 0; transform: translate(6px, -6px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes corner-slide-bl {
          from { opacity: 0; transform: translate(-6px, 6px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes corner-slide-br {
          from { opacity: 0; transform: translate(6px, 6px); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes progress-scan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes label-glow {
          0%   { box-shadow: 0 0 4px ${UI.border}44; }
          50%  { box-shadow: 0 0 12px ${UI.border}aa; }
          100% { box-shadow: 0 0 4px ${UI.border}44; }
        }
      `}</style>
    </div>
  );
}

function MenuMusic({ controlRef }) {
  const audioRef = useRef(null);
  const handleRef = useRef(null);

  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(MUTE_KEY) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    const audio = createAudio({ src: MENU_MUSIC_SRC, loop: true });
    audioRef.current = audio;

    const handle = playUnmuted(audio, {
      volume: MENU_VOLUME,
      fadeInMs: FADE_IN_MS,
      fadeOutMs: FADE_OUT_MS,
    });
    handleRef.current = handle;

    if (muted) {
      handle.setMuted(true);
    }

    return () => {
      handle.stop();
      handleRef.current = null;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const h = handleRef.current;
    if (!h) return;
    h.setMuted(muted);
    try { localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false'); } catch {}
  }, [muted]);

  useEffect(() => {
    if (!controlRef) return;
    controlRef.current = {
      fadeOutAndStop: () => {
        const h = handleRef.current;
        if (h) h.stop();
      },
    };
    return () => { if (controlRef) controlRef.current = null; };
  }, [controlRef]);

  const toggleMute = () => setMuted(m => !m);

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Ativar música' : 'Silenciar música'}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.4)',
        border: `1px solid ${UI.border}`,
        color: muted ? UI.dim : UI.command,
        fontFamily: 'Fira Code, monospace',
        fontSize: '13px',
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '3px',
        cursor: 'none',
        transition: 'all 0.15s',
        padding: 0,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
        e.currentTarget.style.borderColor = UI.command;
        e.currentTarget.style.boxShadow = `0 0 8px ${UI.command}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = UI.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

function MiauIntro() {
  const [bubble, setBubble] = useState(null);
  const [jumpKey, setJumpKey] = useState(0);
  const [hovered, setHovered] = useState(false);

  const hideTimerRef = useRef(null);
  const audioPoolRef = useRef([]);
  const poolIndexRef = useRef(0);

  useEffect(() => {
    const pool = [];
    for (let i = 0; i < 3; i++) {
      const a = new Audio(MEOW_SRC);
      a.preload = 'auto';
      a.volume = MEOW_VOLUME;
      pool.push(a);
    }
    audioPoolRef.current = pool;
  }, []);

  const playMeow = useCallback(() => {
    const pool = audioPoolRef.current;
    if (!pool.length) return;
    const a = pool[poolIndexRef.current % pool.length];
    poolIndexRef.current++;
    try {
      a.currentTime = 0;
      a.volume = MEOW_VOLUME;
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {}
  }, []);

  const scheduleHide = useCallback((id) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setBubble(prev => (prev && prev.id === id ? null : prev));
    }, BUBBLE_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleClick = () => {
    const prevPhrase = bubble?.phrase;

    let nextPhrase;
    do {
      nextPhrase = MIAU_PHRASES[Math.floor(Math.random() * MIAU_PHRASES.length)];
    } while (nextPhrase === prevPhrase && MIAU_PHRASES.length > 1);

    flushSync(() => setBubble(null));

    const id = Date.now();
    flushSync(() => setBubble({ id, phrase: nextPhrase }));

    setJumpKey(k => k + 1);
    playMeow();
    scheduleHide(id);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '22px',
      marginTop: '32px',
      marginBottom: '20px',
      position: 'relative',
      animation: 'save-header-in 0.7s ease-out both',
      flexShrink: 0,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {bubble && (
          <div
            key={bubble.id}
            style={{
              position: 'absolute',
              right: 'calc(100% + 14px)',
              top: '50%',
              transform: 'translateY(-50%)',
              width: BUBBLE_WIDTH,
              padding: '8px 12px',
              background: UI.bgPanel,
              border: `1px solid ${UI.border}`,
              borderRadius: '10px',
              fontSize: '10.5px',
              color: UI.text,
              fontFamily: 'Fira Code, monospace',
              lineHeight: 1.45,
              boxShadow: `0 0 14px ${UI.command}55, 0 0 3px ${UI.border}aa inset`,
              animation: 'bubble-in-left 0.42s cubic-bezier(0.2, 0.9, 0.3, 1.4) both',
              pointerEvents: 'none',
              textAlign: 'center',
              wordBreak: 'break-word',
              zIndex: 3,
            }}
          >
            {bubble.phrase}
            <div style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: `9px solid ${UI.border}`,
            }} />
            <div style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              marginLeft: '-1px',
              width: 0,
              height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft: `8px solid ${UI.bgPanel}`,
            }} />
          </div>
        )}

        <div style={{
          position: 'absolute',
          inset: '-16px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${UI.command}22 0%, transparent 65%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div
          key={jumpKey}
          data-sound="silent"
          onClick={handleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="clica em mim :)"
          style={{
            cursor: 'none',
            userSelect: 'none',
            position: 'relative',
            zIndex: 1,
            animation: jumpKey > 0
              ? 'miau-jump 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)'
              : 'miau-breathe 3.6s ease-in-out infinite',
            filter: hovered
              ? `drop-shadow(0 0 20px ${UI.command}ff) brightness(1.1)`
              : `drop-shadow(0 0 12px ${UI.command}77)`,
            transition: 'filter 0.2s',
          }}
        >
          <SpriteAvatar talking={false} size={96} alt="k1tty" />
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '3px',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '36px',
          fontWeight: 'bold',
          letterSpacing: '7px',
          color: UI.command,
          textShadow: `0 0 10px ${UI.command}, 0 0 22px ${UI.command}aa`,
          lineHeight: 1,
          fontFamily: 'Fira Code, monospace',
        }}>
          k1tty
        </div>
        <div style={{
          fontSize: '9px',
          letterSpacing: '4px',
          color: UI.border,
          opacity: 0.9,
          fontFamily: 'Fira Code, monospace',
        }}>
          TERMINAL GAME · v1.0.0
        </div>
      </div>
    </div>
  );
}

function SectionLabel() {
  return (
    <div style={{
      width: '100%',
      marginBottom: '10px',
      flexShrink: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        width: '70%',
        height: '1px',
        background: `linear-gradient(90deg, transparent 0%, ${UI.border}aa 20%, ${UI.command} 50%, ${UI.border}aa 80%, transparent 100%)`,
        boxShadow: `0 0 6px ${UI.border}88`,
        animation: 'label-glow 3s ease-in-out infinite',
        borderRadius: '1px',
      }} />
    </div>
  );
}

function SaveSlot({ slot, save, isSelected, isConfirmDelete, onSelect, onDelete, onNewSave }) {
  const slotId = String(slot + 1).padStart(2, '0');
  const isEmpty = !save;
  const [hovered, setHovered] = useState(false);

  const showCorners = hovered || isSelected;

  const borderColor = isConfirmDelete
    ? UI.error
    : isSelected
      ? UI.command
      : isEmpty
        ? `${UI.border}55`
        : UI.border;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        border: `1px ${isEmpty ? 'dashed' : 'solid'} ${borderColor}`,
        borderRadius: '4px',
        background: isEmpty
          ? 'rgba(0, 0, 0, 0.2)'
          : `linear-gradient(180deg, ${UI.bgPanel} 0%, ${UI.bgDeep} 100%)`,
        padding: '10px 12px',
        cursor: 'none',
        transition: 'all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: isSelected
          ? `0 0 22px ${UI.command}66, 0 0 4px ${UI.command}90 inset`
          : isConfirmDelete
            ? `0 0 20px ${UI.error}66, 0 0 4px ${UI.error}90 inset`
            : hovered
              ? `0 0 12px ${UI.command}44`
              : 'none',
        animation: 'save-slot-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        animationDelay: `${slot * 0.1}s`,
        transform: hovered && !isSelected ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '3px',
        height: '100%',
        background: isEmpty
          ? `${UI.border}44`
          : isSelected
            ? UI.command
            : isConfirmDelete
              ? UI.error
              : UI.border,
        boxShadow: isSelected ? `0 0 8px ${UI.command}` : 'none',
        transition: 'background 0.2s',
        borderTopLeftRadius: '4px',
        borderBottomLeftRadius: '4px',
      }} />

      {showCorners && (
        <>
          <div style={{
            position: 'absolute',
            top: '-3px', left: '-3px',
            width: '14px', height: '14px',
            borderTop: `2px solid ${UI.command}`,
            borderLeft: `2px solid ${UI.command}`,
            boxShadow: `-1px -1px 6px ${UI.command}66`,
            animation: 'corner-slide-tl 0.25s ease-out both',
            pointerEvents: 'none',
            zIndex: 4,
          }} />
          <div style={{
            position: 'absolute',
            top: '-3px', right: '-3px',
            width: '14px', height: '14px',
            borderTop: `2px solid ${UI.command}`,
            borderRight: `2px solid ${UI.command}`,
            boxShadow: `1px -1px 6px ${UI.command}66`,
            animation: 'corner-slide-tr 0.25s ease-out both',
            pointerEvents: 'none',
            zIndex: 4,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-3px', left: '-3px',
            width: '14px', height: '14px',
            borderBottom: `2px solid ${UI.command}`,
            borderLeft: `2px solid ${UI.command}`,
            boxShadow: `-1px 1px 6px ${UI.command}66`,
            animation: 'corner-slide-bl 0.25s ease-out both',
            pointerEvents: 'none',
            zIndex: 4,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-3px', right: '-3px',
            width: '14px', height: '14px',
            borderBottom: `2px solid ${UI.command}`,
            borderRight: `2px solid ${UI.command}`,
            boxShadow: `1px 1px 6px ${UI.command}66`,
            animation: 'corner-slide-br 0.25s ease-out both',
            pointerEvents: 'none',
            zIndex: 4,
          }} />
        </>
      )}

      {isEmpty ? (
        <EmptySlotContent slotId={slotId} isSelected={isSelected} onNewSave={onNewSave} />
      ) : (
        <FilledSlotContent
          slotId={slotId}
          save={save}
          isConfirmDelete={isConfirmDelete}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function FilledSlotContent({ slotId, save, isConfirmDelete, onDelete }) {
  const progress = Math.min(100, Math.max(0, save.progress || 0));
  const packages = save.installedPackages?.length || 0;
  const achievements = save.unlockedAchievements?.length || 0;
  const commandsRun = save.stats?.commandsRun || 0;
  const theme = getThemeById(save.theme || DEFAULT_THEME_ID);
  const themeColor = theme.colors?.command || UI.command;
  const wifiOn = save.wifiConnected === true;
  const endings = save.seenEndings || [];

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <SlotBadge slotId={slotId} active />
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
          <span style={{
            color: UI.command,
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '2px',
            textShadow: `0 0 5px ${UI.command}`,
            fontFamily: 'Fira Code, monospace',
          }}>
            SESSION {slotId}
          </span>
          <span style={{ fontSize: '9px', color: UI.dim, fontStyle: 'italic' }}>
            · salva
          </span>
        </div>

        <button
          onClick={onDelete}
          title={isConfirmDelete ? 'Clique de novo pra confirmar' : 'Apagar save'}
          style={{
            background: isConfirmDelete ? UI.error : 'transparent',
            border: `1px solid ${UI.error}`,
            color: isConfirmDelete ? '#000' : UI.error,
            fontFamily: 'Fira Code, monospace',
            fontSize: '9px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '3px',
            cursor: 'none',
            transition: 'all 0.15s',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          {isConfirmDelete ? '⚠ CONFIRMAR?' : '🗑 APAGAR'}
        </button>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '8.5px',
          color: UI.dim,
          letterSpacing: '1px',
          marginBottom: '3px',
          fontFamily: 'Fira Code, monospace',
        }}>
          <span>PROGRESSO</span>
          <span style={{ color: UI.command, fontWeight: 'bold' }}>{progress}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '5px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '3px',
          overflow: 'hidden',
          border: `1px solid ${UI.border}44`,
          position: 'relative',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${UI.border} 0%, ${UI.command} 100%)`,
            boxShadow: `0 0 8px ${UI.command}aa`,
            animation: 'save-progress-in 1s ease-out both',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {progress > 4 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                animation: 'progress-scan 2.4s linear infinite',
              }} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))',
        gap: '4px',
      }}>
        <StatCard icon="📦" label="Pacotes"    value={packages} />
        <StatCard icon="🏆" label="Conquistas" value={`${achievements}/${TOTAL_ACHIEVEMENTS}`} />
        <StatCard icon="⌨️" label="Comandos"   value={commandsRun} />
        <StatCard
          icon="📶"
          label="WiFi"
          value={wifiOn ? 'On' : 'Off'}
          color={wifiOn ? UI.command : UI.dim}
        />
        <StatCard
          icon="🎨"
          label="Tema"
          value={theme.name}
          color={themeColor}
          swatch={themeColor}
        />
      </div>

      {endings.length > 0 && (
        <div style={{
          marginTop: '6px',
          paddingTop: '6px',
          borderTop: `1px dashed ${UI.border}33`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: '7.5px',
            color: UI.dim,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontFamily: 'Fira Code, monospace',
          }}>
            finais:
          </span>
          {endings.map(id => {
            const meta = ENDING_META[id];
            return (
              <span
                key={id}
                title={meta?.label || id}
                style={{
                  fontSize: '13px',
                  filter: `drop-shadow(0 0 4px ${UI.command}88)`,
                  lineHeight: 1,
                }}
              >
                {meta?.icon || '❓'}
              </span>
            );
          })}
        </div>
      )}
    </>
  );
}

function EmptySlotContent({ slotId, isSelected, onNewSave }) {
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: isSelected ? '10px' : '2px',
      }}>
        <SlotBadge slotId={slotId} active={isSelected} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
          <span style={{
            color: isSelected ? UI.command : UI.dim,
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '2px',
            transition: 'color 0.2s',
            fontFamily: 'Fira Code, monospace',
          }}>
            SESSION {slotId}
          </span>
          <span style={{ fontSize: '9px', color: UI.dim, fontStyle: 'italic' }}>· vazia</span>
        </div>
        <span style={{
          fontSize: '9px',
          color: isSelected ? UI.command : UI.dim,
          letterSpacing: '1px',
          fontFamily: 'Fira Code, monospace',
        }}>
          {isSelected ? '▾' : '▸ iniciar'}
        </span>
      </div>

      {isSelected && (
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          paddingTop: '10px',
          borderTop: `1px dashed ${UI.border}44`,
          animation: 'save-actions-in 0.3s ease-out both',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onNewSave(true); }}
            style={{ ...newGameButtonStyle, cursor: 'none' }}
          >
            ▶ SEM TUTORIAL
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onNewSave(false); }}
            style={{ ...newGameButtonStyle, borderColor: UI.warning, color: UI.warning, cursor: 'none' }}
          >
            ★ COM TUTORIAL
          </button>
        </div>
      )}
    </>
  );
}

const newGameButtonStyle = {
  flex: '1 1 140px',
  padding: '7px 12px',
  background: 'transparent',
  border: `1px solid ${UI.command}`,
  color: UI.command,
  fontFamily: 'Fira Code, monospace',
  fontSize: '10.5px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  borderRadius: '3px',
  cursor: 'none',
  transition: 'all 0.15s',
};

function SlotBadge({ slotId, active }) {
  return (
    <div style={{
      width: '28px',
      height: '28px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${active ? UI.command : UI.border}`,
      borderRadius: '3px',
      background: active
        ? `linear-gradient(180deg, ${UI.command}22 0%, transparent 100%)`
        : 'transparent',
      color: active ? UI.command : UI.border,
      fontFamily: 'Fira Code, monospace',
      fontSize: '11px',
      fontWeight: 'bold',
      letterSpacing: '1px',
      boxShadow: active ? `0 0 10px ${UI.command}66` : 'none',
      transition: 'all 0.2s',
    }}>
      {slotId}
    </div>
  );
}

function StatCard({ icon, label, value, color, swatch }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1px',
      padding: '4px 6px',
      background: 'rgba(0, 0, 0, 0.3)',
      border: `1px solid ${UI.border}33`,
      borderRadius: '3px',
      minWidth: 0,
    }}>
      <span style={{
        fontSize: '7.5px',
        color: UI.dim,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        fontFamily: 'Fira Code, monospace',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.2,
      }}>
        {label}
      </span>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '10.5px',
        fontWeight: 'bold',
        color: color || UI.text,
        fontFamily: 'Fira Code, monospace',
        lineHeight: 1.3,
        minWidth: 0,
      }}>
        <span style={{ fontSize: '9px', flexShrink: 0 }}>{icon}</span>
        {swatch && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '2px',
            background: swatch,
            boxShadow: `0 0 5px ${swatch}`,
            flexShrink: 0,
          }} />
        )}
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {value}
        </span>
      </span>
    </div>
  );
}

function Footer() {
  return (
    <div style={{
      marginTop: '10px',
      paddingTop: '8px',
      borderTop: `1px solid ${UI.border}33`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      width: '100%',
      fontFamily: 'Fira Code, monospace',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: '8.5px',
        color: UI.dim,
        letterSpacing: '2px',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        <span style={{ color: UI.border }}>k1tty Systems © 2025</span>
        {' · '}
        <span>save files v1.0</span>
      </div>
      <div style={{
        fontSize: '8.5px',
        color: UI.dim,
        letterSpacing: '2px',
        textAlign: 'center',
        opacity: 0.7,
      }}>
        <span style={{ color: UI.command }}>Ctrl + roda</span> para ajustar zoom
      </div>
    </div>
  );
}