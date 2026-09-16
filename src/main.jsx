// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { handleZoomDelta, resetZoom, ZOOM_STEP } from './utils/zoom.js';
import './index.css';

// Bloqueio global de QUALQUER forma de zoom do navegador.
// Ctrl+wheel e Ctrl +/-/0 são sempre interceptados. O zoom customizado
// só é aplicado quando o jogo está ativo (via handleZoomDelta).
(function blockNativeZoom() {
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY < 0) handleZoomDelta(ZOOM_STEP);
      else if (e.deltaY > 0) handleZoomDelta(-ZOOM_STEP);
    }
  };

  const handleKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key;
    const code = e.keyCode;

    if (key === '+' || key === '=' || code === 187 || code === 107) {
      e.preventDefault();
      e.stopPropagation();
      handleZoomDelta(ZOOM_STEP);
    } else if (key === '-' || key === '_' || code === 189 || code === 109) {
      e.preventDefault();
      e.stopPropagation();
      handleZoomDelta(-ZOOM_STEP);
    } else if (key === '0' || code === 48 || code === 96) {
      e.preventDefault();
      e.stopPropagation();
      resetZoom();
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length > 1) e.preventDefault();
  };
  const handleTouchMove = (e) => {
    if (e.touches.length > 1) e.preventDefault();
  };
  const handleGesture = (e) => e.preventDefault();

  // capture: true garante que rodamos antes do navegador processar
  window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  window.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
  window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
  document.addEventListener('gesturestart', handleGesture, { passive: false, capture: true });
  document.addEventListener('gesturechange', handleGesture, { passive: false, capture: true });
  document.addEventListener('gestureend', handleGesture, { passive: false, capture: true });
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);