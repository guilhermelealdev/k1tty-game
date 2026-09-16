// src/components/TUIViewers/MP3Player.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { getNodeByPath } from '../../utils/helpers.js';

const VOLUME = 0.35;

function displayName(filename) {
  let name = filename.replace(/\.mp3$/i, '');
  name = name.replace(/_/g, ' ');
  name = name.replace(/\bYou re\b/g, "You're");
  return name.replace(/\b\w/g, c => c.toUpperCase()).replace(/\b2\b/, '2');
}

export default function MP3Player() {
  const { state, dispatch } = useGame();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const audioRef = useRef(null);

  const musicNode = getNodeByPath(state.filesystem, '/home/k1tty/Music');
  const tracks = musicNode?.children
    ? Object.values(musicNode.children).filter(
        (f) => f.type === 'file' && /\.mp3$/i.test(f.name)
      )
    : [];

  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrack(tracks[0]);
    }
  }, [tracks, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = VOLUME;
    }
  }, []);

  // Registra a faixa tocada (conquista "dj")
  useEffect(() => {
    if (currentTrack && isPlaying) {
      dispatch({
        type: 'STAT_PUSH',
        payload: { key: 'tracksPlayed', value: currentTrack.name },
      });
    }
  }, [currentTrack, isPlaying, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const src = `/music/${encodeURIComponent(currentTrack.name)}`;
    audio.src = src;
    audio.load();
    audio.volume = VOLUME;
    setLoadError(false);
    setDuration(0);

    if (isPlaying) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[mp3player] autoplay bloqueado:', err.name);
          setIsPlaying(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[mp3player] erro ao tocar:', err.name);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const p = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
    setProgress(p);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = VOLUME;
    setDuration(audio.duration);
  }, []);

  const handleError = useCallback(() => {
    console.warn('[mp3player] falha ao carregar:', currentTrack?.name);
    setLoadError(true);
    setIsPlaying(false);
  }, [currentTrack]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const playTrack = useCallback((track) => {
    if (currentTrack?.name === track.name) {
      setIsPlaying((p) => !p);
    } else {
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
      setShowMeta(false);
    }
  }, [currentTrack]);

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
        color: 'var(--color-dim)',
        gap: '12px',
      }}>
        <div style={{ fontSize: '48px', opacity: 0.4 }}>🎵</div>
        <div style={{ fontSize: '13px' }}>Nenhuma música instalada.</div>
        <div style={{ fontSize: '11px', maxWidth: '280px', lineHeight: 1.6, fontStyle: 'italic' }}>
          Este sistema não vem com faixas de fábrica. As músicas precisam ser
          transferidas antes de serem tocadas.
        </div>
      </div>
    );
  }

  const currentDuration = duration > 0 ? (progress / 100) * duration : 0;

  return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--color-command)' }}>
        🎵 MP3 Player
      </div>

      {currentTrack && (
        <div className="tui-box" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{isPlaying ? '🎵' : '⏸'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentTrack.meta?.title || displayName(currentTrack.name)}
              </div>
              <div style={{ fontSize: '11px', color: loadError ? 'var(--color-error)' : 'var(--color-dim)' }}>
                {loadError
                  ? 'arquivo de áudio não encontrado'
                  : `${formatTime(currentDuration)} / ${formatTime(duration)}`}
              </div>
            </div>
            <button
              className="tui-button"
              style={{ fontSize: '10px', padding: '2px 8px' }}
              onClick={() => setShowMeta((v) => !v)}
            >
              {showMeta ? 'ocultar' : 'meta'}
            </button>
          </div>

          {showMeta && currentTrack.meta && (
            <div style={{
              fontSize: '10px',
              color: 'var(--color-dim)',
              borderTop: '1px dashed var(--color-border-a30)',
              paddingTop: '6px',
              marginBottom: '8px',
              lineHeight: 1.5,
            }}>
              <div><span style={{ color: 'var(--color-border)' }}>artist:</span> {currentTrack.meta.artist}</div>
              <div><span style={{ color: 'var(--color-border)' }}>album:</span> {currentTrack.meta.album}</div>
              <div><span style={{ color: 'var(--color-border)' }}>format:</span> {currentTrack.meta.format}</div>
              <div>
                <span style={{ color: 'var(--color-border)' }}>location:</span>{' '}
                <span style={{ color: 'var(--color-command)', fontWeight: 'bold' }}>
                  {currentTrack.meta.location}
                </span>
              </div>
            </div>
          )}

          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--color-bg-deep)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--color-command)',
              transition: 'width 0.3s',
            }} />
          </div>

          <div style={{ display: 'flex', gap: '5px', marginTop: '8px', justifyContent: 'center' }}>
            <button className="tui-button" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? '⏸ Pausar' : '▶ Tocar'}
            </button>
            <button className="tui-button" onClick={() => {
              setIsPlaying(false);
              setProgress(0);
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}>
              ⏹ Parar
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--color-border)',
          letterSpacing: '1px',
          marginBottom: '6px',
        }}>
          ▸ FAIXAS ({tracks.length})
        </div>
        {tracks.map((track) => {
          const isCurrent = currentTrack?.name === track.name;
          return (
            <div
              key={track.name}
              onClick={() => playTrack(track)}
              style={{
                padding: '8px 10px',
                marginBottom: '4px',
                border: `1px solid ${isCurrent ? 'var(--color-command)' : 'var(--color-border-a30)'}`,
                borderRadius: '3px',
                background: isCurrent ? 'var(--color-command-a10)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) e.currentTarget.style.background = 'var(--color-command-a05)';
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '14px' }}>
                  {isCurrent && isPlaying ? '🎵' : '🎶'}
                </span>
                <span style={{
                  color: isCurrent ? 'var(--color-command)' : 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {track.meta?.title || displayName(track.name)}
                </span>
              </div>
              <span style={{
                fontSize: '10px',
                color: 'var(--color-dim)',
                flexShrink: 0,
              }}>
                {(track.size / 1000000).toFixed(1)} MB
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}