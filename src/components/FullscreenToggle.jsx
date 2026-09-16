// src/components/FullscreenToggle.jsx

import React, { useState, useEffect, useCallback } from 'react';

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sincroniza o estado com a realidade (ex: se o usuário sair com ESC)
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);
    document.addEventListener('MSFullscreenChange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('MSFullscreenChange', handleChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      const request =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (request) {
        request.call(elem).catch((err) => {
          console.warn('[fullscreen] falha ao entrar:', err.message);
        });
      }
    } else {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

      if (exit) {
        exit.call(document).catch((err) => {
          console.warn('[fullscreen] falha ao sair:', err.message);
        });
      }
    }
  }, []);

  // Atalho de teclado: F11 ou Ctrl+F
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F11' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [toggleFullscreen]);

  return (
    <button
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Sair da tela cheia (F11)' : 'Tela cheia (F11)'}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 2147483647,
        width: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        border: '1px solid var(--color-border, #95C623)',
        borderRadius: '4px',
        color: 'var(--color-command, #C7EF00)',
        fontFamily: 'Fira Code, monospace',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backdropFilter: 'blur(4px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
        e.currentTarget.style.boxShadow = '0 0 10px var(--color-command, #C7EF00)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.55)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {isFullscreen ? '⤢' : '⛶'}
    </button>
  );
}