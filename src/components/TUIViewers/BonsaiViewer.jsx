// src/components/TUIViewers/BonsaiViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';

const TREE_FRAMES = [
  ['             ', '             ', '             ', '      .      '].join('\n'),
  ['             ', '             ', '      .      ', '     /|\\     ', '      |      '].join('\n'),
  ['             ', '             ', '     .-.     ', '    /   \\    ', '     \\ /     ', '      |      '].join('\n'),
  ['             ', '     .-.     ', '    /   \\    ', '   /  .  \\   ', '   \\  \\  /   ', '    \\ | /    ', '     \\|/     ', '      |      '].join('\n'),
  ['             ', '     ___     ', '    /   \\    ', '   /  .  \\   ', '  /  / \\  \\  ', '  \\ /   \\ /  ', '   \\     /   ', '    \\   /    ', '     \\ /     ', '      |      '].join('\n'),
  ['      ___    ', '     /   \\   ', '    /  .  \\  ', '   /  / \\  \\ ', '  /  /   \\  \\', '  \\ /     \\ /', '   \\       / ', '    \\     /  ', '     \\   /   ', '      \\ /    ', '       |     '].join('\n'),
];

const POT = [
  '   _______   ',
  '  /       \\  ',
  ' /_________\\ ',
].join('\n');

export default function BonsaiViewer() {
  const { state, dispatch } = useGame();
  const [frame, setFrame] = useState(0);
  const [isGrowing, setIsGrowing] = useState(true);
  const completedRef = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isGrowing) return;

    // ✅ reduced motion: pula direto pro frame final
    if (reduced) {
      setFrame(TREE_FRAMES.length - 1);
      setIsGrowing(false);
      return;
    }

    const interval = setInterval(() => {
      setFrame(prev => {
        if (prev >= TREE_FRAMES.length - 1) {
          setIsGrowing(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isGrowing, reduced]);

  useEffect(() => {
    if (!isGrowing && !completedRef.current && state.flags?.bonsaiComplete !== true) {
      completedRef.current = true;
      dispatch({ type: 'SET_FLAG', payload: { flag: 'bonsaiComplete', value: true } });
    }
  }, [isGrowing, dispatch, state.flags?.bonsaiComplete]);

  const resetBonsai = () => {
    setFrame(0);
    setIsGrowing(true);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      gap: '4px',
    }}>
      <div style={{
        fontSize: '14px',
        color: 'var(--color-command)',
        letterSpacing: '2px',
        textShadow: 'var(--glow-soft)',
        marginBottom: '12px',
      }}>
        🌿 BONSAI 🌿
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: reduced ? 'none' : 'bonsai-sway 6s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}>
        <pre className="bonsai-tree">{TREE_FRAMES[frame]}</pre>
        <pre className="bonsai-pot">{POT}</pre>
      </div>

      <div style={{
        marginTop: '16px',
        fontSize: '11px',
        color: 'var(--color-dim)',
        fontStyle: 'italic',
        letterSpacing: '1px',
      }}>
        {isGrowing
          ? `crescendo... ${frame + 1}/${TREE_FRAMES.length}`
          : 'completo 🌳'}
      </div>

      <button
        className="tui-button"
        style={{ marginTop: '10px' }}
        onClick={resetBonsai}
      >
        replantar
      </button>

      <style>{`
        @keyframes bonsai-sway {
          0%, 100% { transform: rotate(-0.4deg); }
          50%      { transform: rotate(0.4deg); }
        }
      `}</style>
    </div>
  );
}