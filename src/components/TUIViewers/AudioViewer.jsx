import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { getNodeByPath } from '../../utils/helpers.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

export default function AudioViewer() {
  const { state } = useGame();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isAnalyzing) return;
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();

    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--color-bg-panel').trim() || '#001a1d';
    const lineColor = styles.getPropertyValue('--color-command').trim() || '#C7EF00';

    const interval = setInterval(() => {
      const newWaveform = Array.from({ length: 50 }, () => Math.random() * 40 + 10);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < newWaveform.length; i++) {
        const x = (i / newWaveform.length) * canvas.width;
        const y = canvas.height / 2 + (newWaveform[i] - 25);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }, 100);

    return () => clearInterval(interval);
  }, [isAnalyzing, reduced]);

  const musicNode = getNodeByPath(state.filesystem, '/home/k1tty/Music');
  const tracks = musicNode?.children ? Object.values(musicNode.children).filter(f => f.type === 'file') : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <button className="tui-button" onClick={() => setIsAnalyzing(!isAnalyzing)} disabled={reduced}>
          {isAnalyzing && !reduced ? '⏹ Parar análise' : '▶ Analisar áudio'}
        </button>
        <span style={{ fontSize: '12px', color: 'var(--color-dim)' }}>
          {reduced ? 'desativado (prefers-reduced-motion)' : isAnalyzing ? 'Analisando...' : 'Parado'}
        </span>
      </div>

      <div style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-dim)' }}>
        Arquivos disponíveis em /home/k1tty/Music: {tracks.length}
      </div>
    </div>
  );
}