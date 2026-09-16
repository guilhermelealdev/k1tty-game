import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

export default function MatrixViewer() {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isRunning) return;
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, [isRunning, reduced]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} className="matrix-canvas" />
      <button
        className="tui-button"
        style={{ position: 'absolute', top: 5, right: 5 }}
        onClick={() => setIsRunning(!isRunning)}
        disabled={reduced}
        title={reduced ? 'Desativado (prefers-reduced-motion)' : ''}
      >
        {isRunning && !reduced ? 'Pausar' : 'Iniciar'}
      </button>
    </div>
  );
}