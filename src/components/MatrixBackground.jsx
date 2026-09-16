// src/components/MatrixBackground.jsx
// ============================================================
// Algoritmo ORIGINAL do MatrixBackground, restaurado.
// As correções técnicas (não visuais) que ficam:
//   1. Não consulta mais `useReducedMotion` (o rain sempre anima)
//   2. ResizeObserver + retries de tamanho (canvas não fica 0×0)
//   3. Chars via escapes unicode (evita corrupção de encoding)
// ============================================================

import React, { useEffect, useRef } from 'react';

const CHARS = (
  '\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3' +
  '\u30B5\u30B7\u30B9\u30BB\u30BD\u30BF\u30C1\u30C4\u30C6\u30C8' +
  '\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D2\u30D5\u30D8\u30DB' +
  '\u30DE\u30DF\u30E0\u30E1\u30E2\u30E4\u30E6\u30E8\u30E9\u30EA' +
  '\u30EB\u30EC\u30ED\u30EF\u30F2\u30F3' +
  '0123456789ABCDEF'
).split('');

const FONT_SIZE = 14;
const FRAME_MS = 50;

// Paletas originais
const PALETTES = {
  green: {
    base: '#95C623',
    lead: '#C7EF00',
    glow: 'rgba(199, 239, 0, 0.75)',
  },
  cyan: {
    base: '#00b8a0',
    lead: '#7affcc',
    glow: 'rgba(0, 255, 200, 0.75)',
  },
};

export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const parent = canvas.parentElement;

    const measure = () => {
      const pw = parent?.clientWidth || 0;
      const ph = parent?.clientHeight || 0;
      const ww = window.innerWidth || 0;
      const wh = window.innerHeight || 0;
      return { w: Math.max(1, pw || ww), h: Math.max(1, ph || wh) };
    };

    let drops = [];

    /* ============================================================
       ALGORITMO ORIGINAL
       - Cada drop tem y em linhas (com offset aleatório inicial)
       - speed entre 0.35 e 1.2
       - Chance de 22% de ser ciano, 78% verde
       ============================================================ */
    const rebuildDrops = () => {
      const columns = Math.ceil(canvas.width / FONT_SIZE);
      drops = Array.from({ length: columns }, () => ({
        y: Math.random() * (canvas.height / FONT_SIZE),
        speed: 0.35 + Math.random() * 0.85,
        palette: Math.random() < 0.78 ? 'green' : 'cyan',
      }));
    };

    const draw = () => {
      // Fade original
      ctx.fillStyle = 'rgba(0, 21, 25, 0.085)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px 'Fira Code', ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * FONT_SIZE;
        const y = Math.floor(drop.y) * FONT_SIZE;
        const palette = PALETTES[drop.palette];
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];

        // Glow original
        ctx.shadowBlur = 6;
        ctx.shadowColor = palette.glow;

        ctx.fillStyle = palette.base;
        ctx.fillText(char, x, y);

        // Lead char (12% de chance) — original
        if (Math.random() > 0.88) {
          ctx.fillStyle = palette.lead;
          ctx.fillText(char, x, y);
        }

        ctx.shadowBlur = 0;

        // Reset original: 2.5% de chance por frame, com chance de trocar paleta
        if (y > canvas.height && Math.random() > 0.975) {
          drop.y = 0;
          if (Math.random() > 0.7) {
            drop.palette = Math.random() < 0.78 ? 'green' : 'cyan';
          }
        }

        drop.y += drop.speed;
      }
    };

    const resize = () => {
      const { w, h } = measure();
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      rebuildDrops();
      draw();
    };

    // Setup com tentativas em cascata (a única correção estrutural)
    resize();
    const t1 = setTimeout(resize, 50);
    const t2 = setTimeout(resize, 200);
    const t3 = setTimeout(resize, 500);

    // Loop principal via setInterval (não é suspenso sem foco)
    const ticker = setInterval(() => {
      resize();
      draw();
    }, FRAME_MS);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && parent) {
      ro = new ResizeObserver(resize);
      ro.observe(parent);
    }

    window.addEventListener('resize', resize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(ticker);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.42,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
        background: 'transparent',
      }}
    />
  );
}