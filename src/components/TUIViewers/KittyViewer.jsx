// src/components/TUIViewers/KittyViewer.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { fetchCatImage } from '../../services/catApi.js';

export default function KittyViewer() {
  const { state, dispatch } = useGame();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCat = useCallback(() => {
    setLoading(true);
    setError(false);
    setImageUrl(null);

    // Cache do preload
    const cached = state?.apiCache?.catImage;
    if (cached) {
      setImageUrl(cached);
      try {
        dispatch({ type: 'STAT_PUSH', payload: { key: 'catPhotosSeen', value: cached } });
      } catch { /* ignora */ }
      setLoading(false);
      return;
    }

    fetchCatImage()
      .then((url) => {
        if (url) {
          setImageUrl(url);
          try {
            dispatch({ type: 'STAT_PUSH', payload: { key: 'catPhotosSeen', value: url } });
          } catch { /* ignora */ }
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [dispatch, state?.apiCache?.catImage]);

  useEffect(() => {
    loadCat();
  }, [loadCat]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-deep)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        minHeight: 0,
      }}>
        {loading && (
          <div style={{
            color: 'var(--color-command)',
            fontSize: '13px',
            letterSpacing: '2px',
            animation: 'kitty-blink 1s step-end infinite',
          }}>
            buscando gato...
          </div>
        )}

        {!loading && error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--color-dim)',
          }}>
            <span style={{ fontSize: '64px', opacity: 0.4 }}>🐱</span>
            <span style={{ fontSize: '11px', letterSpacing: '1px' }}>
              não foi possível buscar uma foto
            </span>
          </div>
        )}

        {!loading && !error && imageUrl && (
          <img
            key={imageUrl}
            src={imageUrl}
            alt="gato"
            onError={() => { setError(true); setImageUrl(null); }}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              border: '1px solid var(--color-border-a50)',
              borderRadius: '4px',
              boxShadow: '0 0 20px var(--color-command-a15)',
              animation: 'kitty-fade-in 0.4s ease-out',
            }}
            draggable={false}
          />
        )}
      </div>

      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--color-border-a30)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--color-dim)',
        flexShrink: 0,
      }}>
        <span>🐱 cat api · foto aleatória</span>
        <button
          onClick={loadCat}
          disabled={loading}
          className="tui-button"
          style={{ fontSize: '10px', padding: '2px 10px' }}
        >
          ↻ outro gato
        </button>
      </div>

      <style>{`
        @keyframes kitty-fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes kitty-blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}