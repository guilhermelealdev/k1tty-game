// src/components/TUIViewers/KittensViewer.jsx

import React from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { THEMES, DEFAULT_THEME_ID } from '../../data/themes.js';

export default function KittensViewer() {
  const { state, dispatch } = useGame();
  const activeTheme = state.theme || DEFAULT_THEME_ID;

  const handleApply = (themeId) => {
    dispatch({ type: 'SET_THEME', payload: themeId });
    dispatch({ type: 'STAT_PUSH', payload: { key: 'themesUsed', value: themeId } });
  };

  const handleReset = () => {
    dispatch({ type: 'SET_THEME', payload: DEFAULT_THEME_ID });
    dispatch({ type: 'STAT_PUSH', payload: { key: 'themesUsed', value: DEFAULT_THEME_ID } });
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'inherit',
      fontSize: '12px',
      color: 'var(--color-text)',
      background: 'var(--color-bg-panel)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-header)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          color: 'var(--color-command)',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
          fontSize: '13px',
          textShadow: 'var(--glow-soft)',
        }}>
          🐱 kittens · temas
        </span>
        <span style={{
          fontSize: '10px',
          color: 'var(--color-dim)',
        }}>
          {THEMES.length} disponíveis
        </span>
      </div>

      {/* Intro */}
      <div style={{
        padding: '10px 14px',
        fontSize: '11px',
        color: 'var(--color-dim)',
        borderBottom: '1px dashed rgba(149, 198, 35, 0.25)',
        lineHeight: 1.55,
        flexShrink: 0,
      }}>
        Ajuste a paleta do seu terminal e das janelas. As mudanças
        são aplicadas em tempo real e ficam salvas no seu save.
      </div>

      {/* Lista de temas */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {THEMES.map(theme => {
          const isActive = theme.id === activeTheme;
          return (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={isActive}
              onApply={() => handleApply(theme.id)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-header)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: 'var(--color-dim)',
        flexShrink: 0,
      }}>
        <span>tema atual: <span style={{ color: 'var(--color-command)' }}>{activeTheme}</span></span>
        <button
          onClick={handleReset}
          disabled={activeTheme === DEFAULT_THEME_ID}
          style={{
            background: 'transparent',
            border: `1px solid ${activeTheme === DEFAULT_THEME_ID ? 'var(--color-dim)' : 'var(--color-warning)'}`,
            color: activeTheme === DEFAULT_THEME_ID ? 'var(--color-dim)' : 'var(--color-warning)',
            fontFamily: 'inherit',
            fontSize: '10px',
            padding: '3px 10px',
            borderRadius: '3px',
            cursor: activeTheme === DEFAULT_THEME_ID ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            opacity: activeTheme === DEFAULT_THEME_ID ? 0.5 : 1,
          }}
        >
          restaurar padrão
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Card individual de tema com preview visual
   ============================================================ */
function ThemeCard({ theme, isActive, onApply }) {
  const c = theme.colors;

  return (
    <div
      style={{
        border: `1px solid ${isActive ? c.command : 'var(--color-border)'}`,
        borderRadius: '4px',
        background: c.bgPanel,
        padding: '10px 12px',
        transition: 'all 0.2s',
        cursor: 'pointer',
        boxShadow: isActive
          ? `0 0 12px ${hexToRgba(c.command, 0.35)}, 0 0 4px ${hexToRgba(c.command, 0.2)} inset`
          : 'none',
      }}
      onClick={onApply}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = c.border;
          e.currentTarget.style.boxShadow = `0 0 8px ${hexToRgba(c.border, 0.25)}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Cabeçalho do card */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        <div style={{
          color: c.command,
          fontWeight: 'bold',
          fontSize: '13px',
          letterSpacing: '0.5px',
          textShadow: `0 0 4px ${hexToRgba(c.command, 0.6)}`,
        }}>
          {theme.name}
          {isActive && (
            <span style={{
              marginLeft: '8px',
              fontSize: '10px',
              color: c.border,
              fontWeight: 'normal',
              letterSpacing: '1px',
            }}>
              ● ATIVO
            </span>
          )}
        </div>
        {!isActive && (
          <span style={{
            fontSize: '10px',
            color: c.dim,
            fontStyle: 'italic',
          }}>
            clique para aplicar
          </span>
        )}
      </div>

      {/* Descrição */}
      <div style={{
        fontSize: '10.5px',
        color: c.dim,
        marginBottom: '10px',
        lineHeight: 1.5,
      }}>
        {theme.description}
      </div>

      {/* Preview: amostra de cores */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '10px',
      }}>
        <ColorSwatch color={c.bg} title="bg" />
        <ColorSwatch color={c.bgPanel} title="panel" />
        <ColorSwatch color={c.bgHeader} title="header" />
        <ColorSwatch color={c.text} title="text" />
        <ColorSwatch color={c.command} title="command" />
        <ColorSwatch color={c.border} title="border" />
        <ColorSwatch color={c.error} title="error" />
        <ColorSwatch color={c.dim} title="dim" />
        <ColorSwatch color={c.warning} title="warning" />
      </div>

      {/* Preview: mini terminal fake */}
      <div style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '3px',
        padding: '8px 10px',
        fontFamily: 'Fira Code, monospace',
        fontSize: '10.5px',
        lineHeight: 1.5,
        overflow: 'hidden',
      }}>
        <div style={{ color: c.command, textShadow: `0 0 3px ${hexToRgba(c.command, 0.5)}` }}>
          <span style={{ fontWeight: 'bold' }}>k1tty@k1tty</span>
          <span style={{ color: c.border }}>:</span>
          <span style={{ color: c.command }}>~</span>
          <span style={{ color: c.text }}>$</span>{' '}
          <span style={{ color: c.command }}>ls -a</span>
        </div>
        <div style={{ color: c.text, marginTop: '2px' }}>
          .notes.txt{'  '}Documents{'  '}Music{'  '}Pictures
        </div>
        <div style={{ color: c.error, marginTop: '2px' }}>
          [ERRO] permissão negada
        </div>
      </div>
    </div>
  );
}

/* Amostra pequena de cor com tooltip */
function ColorSwatch({ color, title }) {
  return (
    <div
      title={`${title}: ${color}`}
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '3px',
        background: color,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.4) inset',
        flexShrink: 0,
      }}
    />
  );
}

/* Utilitário: hex para rgba */
function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}