// src/components/PokemonEntry.jsx

import React, { useState, useEffect, useRef } from 'react';
import { TYPE_ICONS, TYPE_PT } from '../services/pokeApi.js';

/* Cores por tipo (usadas nas badges) */
const TYPE_COLORS = {
  normal:   '#a8a878',
  fire:     '#f08030',
  water:    '#6890f0',
  electric: '#f8d030',
  grass:    '#78c850',
  ice:      '#98d8d8',
  fighting: '#c03028',
  poison:   '#a040a0',
  ground:   '#e0c068',
  flying:   '#a890f0',
  psychic:  '#f85888',
  bug:      '#a8b820',
  rock:     '#b8a038',
  ghost:    '#705898',
  dragon:   '#7038f8',
  dark:     '#705848',
  steel:    '#b8b8d0',
  fairy:    '#ee99ac',
};

function StatBar({ value, max = 150, color = 'var(--color-command)' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '10px',
      fontFamily: 'Fira Code, monospace',
    }}>
      <span style={{ minWidth: '38px', color: 'var(--color-dim)' }}>{value}</span>
      <div style={{
        flex: 1,
        height: '6px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '3px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          transition: 'width 0.4s ease-out',
        }} />
      </div>
    </div>
  );
}

export default function PokemonEntry({ data }) {
  const audioRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [data?.id]);

  const replayCry = () => {
    try {
      const audio = new Audio(data.cry);
      audio.volume = 0.5;
      audioRef.current = audio;
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch { /* ignora */ }
  };

  if (!data) return null;

  const idStr = String(data.id).padStart(4, '0');
  const nameUpper = data.name.toUpperCase();

  return (
    <div style={{
      display: 'flex',
      gap: '18px',
      padding: '12px 0 18px',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      fontFamily: 'Fira Code, monospace',
    }}>
      {/* Coluna esquerda: sprite + cry */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        minWidth: '140px',
      }}>
        <div style={{
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle at center, var(--color-command-a10) 0%, transparent 70%)',
          border: '1px solid var(--color-border-a35)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <img
            src={data.sprite}
            alt={data.name}
            onLoad={() => setLoaded(true)}
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{
              width: '110px',
              height: '110px',
              imageRendering: 'pixelated',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.3s',
              userSelect: 'none',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))',
            }}
          />
          {!loaded && (
            <span style={{
              position: 'absolute',
              fontSize: '11px',
              color: 'var(--color-dim)',
              letterSpacing: '2px',
              animation: 'poke-blink 1.2s step-end infinite',
            }}>
              carregando...
            </span>
          )}
        </div>

        <button
          onClick={replayCry}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-command)',
            fontFamily: 'inherit',
            fontSize: '10px',
            padding: '3px 12px',
            borderRadius: '3px',
            cursor: 'pointer',
            letterSpacing: '1px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-command-a15)';
            e.currentTarget.style.borderColor = 'var(--color-command)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          🔊 tocar cry
        </button>

        <div style={{
          fontSize: '9px',
          color: 'var(--color-dim)',
          letterSpacing: '2px',
        }}>
          #{idStr}
        </div>
      </div>

      {/* Coluna direita: info */}
      <div style={{
        flex: 1,
        minWidth: '260px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Nome + badges */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            color: 'var(--color-command)',
            fontWeight: 'bold',
            fontSize: '18px',
            letterSpacing: '1px',
            textShadow: 'var(--glow-soft)',
          }}>
            {nameUpper}
          </span>

          {data.isLegendary && (
            <span style={{
              background: 'linear-gradient(180deg, #ffd700, #b8860b)',
              color: '#000',
              fontSize: '9px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '10px',
              letterSpacing: '1px',
              boxShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
            }}>
              ✦ LENDÁRIO
            </span>
          )}
          {data.isMythical && (
            <span style={{
              background: 'linear-gradient(180deg, #ff71ce, #b967ff)',
              color: '#000',
              fontSize: '9px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '10px',
              letterSpacing: '1px',
              boxShadow: '0 0 8px rgba(255, 113, 206, 0.5)',
            }}>
              ✦ MÍTICO
            </span>
          )}
        </div>

        {/* Tipos */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {data.types.map(t => (
            <span
              key={t}
              style={{
                background: TYPE_COLORS[t] || '#666',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '3px 10px',
                borderRadius: '12px',
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {TYPE_ICONS[t]} {TYPE_PT[t] || t}
            </span>
          ))}
        </div>

        {/* Metadados */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '4px 16px',
          fontSize: '11px',
          color: 'var(--color-text)',
          borderTop: '1px dashed var(--color-border-a30)',
          borderBottom: '1px dashed var(--color-border-a30)',
          padding: '8px 0',
        }}>
          <div><span style={{ color: 'var(--color-border)' }}>Categoria: </span>{data.genus}</div>
          <div><span style={{ color: 'var(--color-border)' }}>Altura: </span>{data.height.toFixed(1)} m</div>
          <div><span style={{ color: 'var(--color-border)' }}>Peso: </span>{data.weight.toFixed(1)} kg</div>
          <div><span style={{ color: 'var(--color-border)' }}>Exp: </span>{data.baseExp ?? '—'}</div>
        </div>

        {/* Habilidades */}
        <div style={{ fontSize: '11px' }}>
          <span style={{ color: 'var(--color-border)' }}>Habilidades: </span>
          <span style={{ color: 'var(--color-text)' }}>
            {data.abilities.join(' · ')}
          </span>
        </div>

        {/* Stats */}
        <div>
          <div style={{
            fontSize: '10px',
            color: 'var(--color-border)',
            letterSpacing: '1px',
            marginBottom: '5px',
            textTransform: 'uppercase',
          }}>
            ▸ Stats base
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '3px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-dim)', minWidth: '44px' }}>HP</span>
              <StatBar value={data.stats.hp} color="#ff6b6b" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-dim)', minWidth: '44px' }}>ATAQUE</span>
              <StatBar value={data.stats.attack} color="#ffa94d" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-dim)', minWidth: '44px' }}>DEFESA</span>
              <StatBar value={data.stats.defense} color="#74c0fc" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-dim)', minWidth: '44px' }}>SP.ATK</span>
              <StatBar value={data.stats['special-attack']} color="#b197fc" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-dim)', minWidth: '44px' }}>SP.DEF</span>
              <StatBar value={data.stats['special-defense']} color="#63e6be" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-dim)', minWidth: '44px' }}>VELOC.</span>
              <StatBar value={data.stats.speed} color="#ffd43b" />
            </div>
          </div>
        </div>

        {/* Flavor */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--color-border-a30)',
          borderLeft: '3px solid var(--color-command)',
          borderRadius: '3px',
          padding: '8px 12px',
          fontSize: '11px',
          fontStyle: 'italic',
          color: 'var(--color-text)',
          lineHeight: 1.6,
        }}>
          "{data.flavor}"
        </div>

        <div style={{
          fontSize: '9px',
          color: 'var(--color-dim)',
          letterSpacing: '1px',
          textAlign: 'right',
        }}>
          fonte: pokeapi.co
        </div>
      </div>

      <style>{`
        @keyframes poke-blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}