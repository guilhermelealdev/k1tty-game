// src/components/TUIViewers/MeowViewer.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../../state/GameContext.jsx';

/* ============================================================
   ASCII do gato
   ============================================================ */
const CAT_ASCII = `⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⣾⣿⣿⣷⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⣆⠀⠀
⠀⢀⣾⣿⡟⠉⠻⣿⣿⣷⡄⠀⠀⣀⣀⣀⣀⣀⠀⢀⣠⣾⣿⡿⠛⣿⣿⡄⠀
⠀⣼⣿⡟⠀⢀⣠⣤⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣏⡀⠀⠹⣿⣿⡄
⢀⣿⣿⣫⣾⣿⣿⠿⠛⠛⠉⠉⠉⠀⠀⠀⠀⠀⠉⠉⠛⠿⣿⣿⣦⣼⣿⣿⠁
⠘⠿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⡇⠀
⠀⢰⣿⣿⠁⠀⠀⠀⠀⠀⢠⣶⣦⠀⠀⠀⣀⣀⡀⠀⠀⠀⠀⠀⢻⣿⣿⠀⠀
⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠈⠛⠋⠀⠀⠀⠿⠿⠇⠀⠀⠀⠀⠀⠀⣿⣿⡇⠀
⠀⢸⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀⢀⣴⣦⡀⠀⠀⠀⠀⣼⣿⡇⠀
⠀⠘⣿⣿⣆⠀⠀⠀⠀⣾⣶⣠⣴⣿⣿⣦⣤⣾⣿⡟⠁⠀⠀⠀⣰⣿⣿⠃⠀
⠀⠀⠘⢿⣿⣦⡀⠀⠀⢻⣿⣿⡿⠟⠛⠻⠿⠛⠋⠀⠀⢀⣠⣾⣿⡿⠃⠀⠀
⠀⠀⠀⠈⠻⢿⣿⣷⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣿⣿⠿⠋⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⠻⠿⣿⣿⣿⣿⣶⣶⣾⣿⣿⣿⠿⠟⠋⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

/* ============================================================
   Upgrades de CPS (geração passiva)
   ============================================================ */
const CPS_UPGRADES = [
  { id: 'auto_pet',   name: 'Mão Robótica',       desc: 'acaricia sozinha',                    baseCost: 15,        cps: 0.5,    icon: '🤖', tier: 1 },
  { id: 'fish',       name: 'Petisco de Peixe',   desc: 'atrai vizinhos',                      baseCost: 100,       cps: 3,      icon: '🐟', tier: 1 },
  { id: 'friend',     name: 'Amigo Gato',         desc: 'companhia felina',                    baseCost: 700,       cps: 15,     icon: '🐈', tier: 2 },
  { id: 'clowder',    name: 'Colônia',            desc: 'um grupo inteiro',                    baseCost: 4000,      cps: 80,     icon: '🐈‍⬛', tier: 2 },
  { id: 'cafe',       name: 'Café dos Gatos',     desc: 'negócio autossustentável',            baseCost: 25000,     cps: 400,    icon: '☕', tier: 3 },
  { id: 'quantum',    name: 'Gato Quântico',      desc: 'em dois lugares ao mesmo tempo',      baseCost: 150000,    cps: 2000,   icon: '⚛️', tier: 3 },
  { id: 'internet',   name: 'Gato Influencer',    desc: 'milhões de seguidores',               baseCost: 1000000,   cps: 12000,  icon: '📱', tier: 4 },
  { id: 'space',      name: 'Gato Astronauta',    desc: 'manda fotos de órbita',               baseCost: 5000000,   cps: 75000,  icon: '🚀', tier: 4 },
  { id: 'dimension',  name: 'Gato Interdimensional', desc: 'em todas as realidades',           baseCost: 30000000,  cps: 400000, icon: '🌀', tier: 5 },
  { id: 'god',        name: 'Deus Gato',          desc: 'criador de todos os felinos',         baseCost: 250000000, cps: 3000000, icon: '👑', tier: 5 },
];

/* ============================================================
   Upgrades de Clique
   ============================================================ */
const CLICK_UPGRADES = [
  { id: 'strong_finger', name: 'Dedo de Ferro',        desc: '+2 por clique',           baseCost: 50,       clickBonus: 2,  clickMult: 1, icon: '💪', tier: 1 },
  { id: 'glove',         name: 'Luva de Kevlar',       desc: '+5 por clique',           baseCost: 500,      clickBonus: 5,  clickMult: 1, icon: '🥊', tier: 2 },
  { id: 'magic_hand',    name: 'Mão Mágica',           desc: 'x2 valor do clique',      baseCost: 5000,     clickBonus: 0,  clickMult: 2, icon: '✨', tier: 2 },
  { id: 'golden_claw',   name: 'Garra Dourada',        desc: '+50 por clique',          baseCost: 50000,    clickBonus: 50, clickMult: 1, icon: '🦁', tier: 3 },
  { id: 'cosmic_hand',   name: 'Mão Cósmica',          desc: 'x3 valor do clique',      baseCost: 500000,   clickBonus: 0,  clickMult: 3, icon: '🌟', tier: 4 },
  { id: 'legendary_paw', name: 'Pata Lendária',        desc: 'x10 valor do clique',     baseCost: 5000000,  clickBonus: 0,  clickMult: 10, icon: '🔥', tier: 5 },
];

const COST_GROWTH = 1.15;
const SAVE_INTERVAL = 2000;
const MEOW_SRC = '/sounds/meow.mp3';

function costOf(upgrade, owned) {
  return Math.floor(upgrade.baseCost * Math.pow(COST_GROWTH, owned));
}

function formatNumber(n) {
  if (!isFinite(n) || n < 0) return '0';
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1e6) return (n / 1e3).toFixed(2) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
  return (n / 1e12).toFixed(2) + 'T';
}

export default function MeowViewer() {
  const { state, dispatch } = useGame();
  const storageKey = `k1tty_clicker_${state.currentSave ?? 'default'}`;
  const muteKey = `k1tty_clicker_mute_${state.currentSave ?? 'default'}`;

  const [pets, setPets] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [upgrades, setUpgrades] = useState({});
  const [clicks, setClicks] = useState(0);
  const [floaters, setFloaters] = useState([]);
  const [bounceKey, setBounceKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [muted, setMuted] = useState(false);

  const catRef = useRef(null);
  const floaterId = useRef(0);
  const audioPoolRef = useRef([]);
  const poolIndexRef = useRef(0);

  // Carrega estado salvo do slot atual
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved) {
        setPets(saved.pets || 0);
        setTotalPets(saved.totalPets || 0);
        setUpgrades(saved.upgrades || {});
        setClicks(saved.clicks || 0);
      } else {
        setPets(0);
        setTotalPets(0);
        setUpgrades({});
        setClicks(0);
      }
      const savedMute = localStorage.getItem(muteKey);
      if (savedMute !== null) setMuted(savedMute === 'true');
    } catch (e) { /* ignora */ }
    setLoaded(true);
  }, [storageKey, muteKey]);

  // Pré-carrega 4 cópias do mesmo arquivo para permitir sobreposição rápida
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pool = [];
    for (let i = 0; i < 4; i++) {
      const audio = new Audio(MEOW_SRC);
      audio.preload = 'auto';
      audio.volume = 0.7;
      pool.push(audio);
    }
    audioPoolRef.current = pool;
  }, []);

  // Salva mute no localStorage quando mudar
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(muteKey, muted ? 'true' : 'false');
    } catch (e) { /* ignora */ }
  }, [muted, muteKey, loaded]);

  // Salva progresso periodicamente
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ pets, totalPets, upgrades, clicks })
        );
      } catch (e) { /* ignora */ }
    }, SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [loaded, pets, totalPets, upgrades, clicks, storageKey]);

  // Conquista: 1 trilhão de pets
  useEffect(() => {
    if (!loaded) return;
    if (pets >= 1_000_000_000_000 && !state.flags?.meowTrilionario) {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'meowTrilionario', value: true } });
    }
  }, [pets, loaded, dispatch, state.flags?.meowTrilionario]);

  const cps = useMemo(
    () => CPS_UPGRADES.reduce((sum, u) => sum + (upgrades[u.id] || 0) * u.cps, 0),
    [upgrades]
  );

  const clickBonus = useMemo(
    () => CLICK_UPGRADES.reduce((sum, u) => sum + (upgrades[u.id] || 0) * u.clickBonus, 0),
    [upgrades]
  );

  const clickMultiplier = useMemo(() => {
    return CLICK_UPGRADES.reduce(
      (mult, u) => mult * Math.pow(u.clickMult, upgrades[u.id] || 0),
      1
    );
  }, [upgrades]);

  const clickValue = (1 + clickBonus) * clickMultiplier;

  // Aplica CPS continuamente
  useEffect(() => {
    if (!loaded || cps <= 0) return;
    const interval = setInterval(() => {
      const gain = cps / 10;
      setPets(p => p + gain);
      setTotalPets(p => p + gain);
    }, 100);
    return () => clearInterval(interval);
  }, [loaded, cps]);

  const playMeow = useCallback(() => {
    if (muted) return;

    const pool = audioPoolRef.current;
    if (!pool || pool.length === 0) {
      console.warn('[meow] pool vazio');
      return;
    }

    const audio = pool[poolIndexRef.current % pool.length];
    poolIndexRef.current++;

    try {
      audio.currentTime = 0;
      audio.volume = 0.7;

      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          console.error('[meow] erro:', err.name, err.message);
        });
      }
    } catch (e) {
      console.error('[meow] exceção:', e);
    }
  }, [muted]);

  const handleCatClick = useCallback((e) => {
    setPets(p => p + clickValue);
    setTotalPets(p => p + clickValue);
    setClicks(c => c + 1);
    setBounceKey(k => k + 1);

    playMeow();

    const rect = catRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 0;
    const y = rect ? e.clientY - rect.top : 0;
    const id = ++floaterId.current;
    setFloaters(prev => [...prev, { id, x, y, value: clickValue }]);
    setTimeout(() => {
      setFloaters(prev => prev.filter(f => f.id !== id));
    }, 900);
  }, [clickValue, playMeow]);

  const buyUpgrade = useCallback((upgrade) => {
    const owned = upgrades[upgrade.id] || 0;
    const cost = costOf(upgrade, owned);
    if (pets < cost) return;
    setPets(p => p - cost);
    setUpgrades(prev => ({ ...prev, [upgrade.id]: owned + 1 }));
  }, [pets, upgrades]);

  const resetGame = useCallback(() => {
    if (!confirm('Resetar progresso do k1tty Clicker?')) return;
    setPets(0);
    setTotalPets(0);
    setUpgrades({});
    setClicks(0);
    setShowShop(false);
    try { localStorage.removeItem(storageKey); } catch (e) {}
  }, [storageKey]);

  const upgradesOwned = Object.values(upgrades).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'inherit',
      color: 'var(--color-text)',
      fontSize: '13px',
      overflow: 'hidden',
      userSelect: 'none',
      padding: '12px',
      boxSizing: 'border-box',
      gap: '10px',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        background: 'var(--color-bg-header)',
        flexShrink: 0,
      }}>
        <span style={{
          color: 'var(--color-command)',
          fontWeight: 'bold',
          fontSize: '13px',
        }}>
          🐾 k1tty Clicker
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-border)' }}>
            {cps > 0 ? `${formatNumber(cps)}/s` : '0/s'}
          </span>
          <button
            onClick={() => setMuted(m => !m)}
            title={muted ? 'Ativar som' : 'Silenciar'}
            style={{
              background: 'transparent',
              border: `1px solid ${muted ? 'var(--color-dim)' : 'var(--color-border)'}`,
              color: muted ? 'var(--color-dim)' : 'var(--color-command)',
              fontFamily: 'inherit',
              fontSize: '13px',
              padding: '2px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              lineHeight: 1,
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Contador */}
      <div style={{
        padding: '10px 12px',
        textAlign: 'center',
        flexShrink: 0,
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        background: 'var(--color-bg-panel)',
      }}>
        <div style={{
          fontSize: '26px',
          color: 'var(--color-command)',
          fontWeight: 'bold',
          lineHeight: 1.1,
        }}>
          {formatNumber(pets)}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--color-dim)', marginTop: '4px' }}>
          +{formatNumber(clickValue)} por clique
          {' · '}
          total {formatNumber(totalPets)}
          {' · '}
          {clicks} cliques
        </div>
      </div>

      {/* Botão do gato */}
      <div
        ref={catRef}
        style={{
          position: 'relative',
          height: '130px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          key={bounceKey}
          onClick={handleCatClick}
          style={{
            width: '130px',
            height: '130px',
            background: 'linear-gradient(180deg, var(--color-command) 0%, var(--color-border) 100%)',
            border: '2px solid var(--color-border)',
            borderRadius: '16px',
            padding: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.5)',
            transition: 'filter 0.1s',
            animation: 'meowButtonBounce 0.22s ease-out',
            outline: 'none',
            boxSizing: 'border-box',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 0 rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'translateY(3px)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 0 rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = '';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 0 rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = '';
          }}
        >
          <pre style={{
            margin: 0,
            padding: 0,
            color: 'var(--color-bg)',
            fontFamily: 'Fira Code, monospace',
            fontWeight: 'bold',
            fontSize: '4.8px',
            lineHeight: 1.05,
            whiteSpace: 'pre',
            letterSpacing: 0,
            textShadow: '0.25px 0 0 var(--color-bg), -0.25px 0 0 var(--color-bg), 0 0.25px 0 var(--color-bg), 0 -0.25px 0 var(--color-bg)',
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block',
          }}>
            {CAT_ASCII}
          </pre>
        </button>

        {floaters.map(f => (
          <span
            key={f.id}
            style={{
              position: 'absolute',
              left: f.x,
              top: f.y,
              color: 'var(--color-command)',
              fontWeight: 'bold',
              fontSize: '14px',
              pointerEvents: 'none',
              textShadow: '0 0 4px var(--color-command)',
              animation: 'floatUp 0.9s ease-out forwards',
            }}
          >
            +{formatNumber(f.value)}
          </span>
        ))}
      </div>

      {/* Área de resumo */}
      <div style={{
        flex: '1 1 auto',
        minHeight: '80px',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        background: 'var(--color-bg-panel)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--color-dim)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {upgradesOwned === 0
            ? 'Você ainda não tem upgrades.'
            : `${upgradesOwned} upgrade${upgradesOwned === 1 ? '' : 's'} adquirido${upgradesOwned === 1 ? '' : 's'}.`}
        </div>

        <button
          onClick={() => setShowShop(true)}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(180deg, var(--color-command) 0%, var(--color-border) 100%)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            color: 'var(--color-bg)',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'all 0.15s',
            boxShadow: '0 3px 0 rgba(0, 0, 0, 0.35), 0 5px 12px rgba(0, 0, 0, 0.4)',
            textShadow: 'none',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.boxShadow = '0 1px 0 rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.4)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 3px 0 rgba(0, 0, 0, 0.35), 0 5px 12px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 3px 0 rgba(0, 0, 0, 0.35), 0 5px 12px rgba(0, 0, 0, 0.4)';
          }}
        >
          🛒 Abrir Loja
        </button>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: 'var(--color-dim)',
        padding: '0 4px',
        flexShrink: 0,
      }}>
        <span>salvo automaticamente</span>
        <button
          onClick={resetGame}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error)',
            fontFamily: 'inherit',
            fontSize: '10px',
            padding: '3px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-error)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
        >
          resetar
        </button>
      </div>

      {/* Overlay da Loja */}
      {showShop && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-bg)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          boxSizing: 'border-box',
          gap: '10px',
        }}>
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            background: 'var(--color-bg-header)',
            flexShrink: 0,
          }}>
            <span style={{
              color: 'var(--color-command)',
              fontWeight: 'bold',
              fontSize: '13px',
            }}>
              🛒 Loja
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '11px',
                color: 'var(--color-command)',
                fontWeight: 'bold',
              }}>
                {formatNumber(pets)} 🐾
              </span>
              <button
                onClick={() => setShowShop(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-error)',
                  color: 'var(--color-error)',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-error)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-error)';
                }}
              >
                ✕ fechar
              </button>
            </div>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            background: 'var(--color-bg-panel)',
            padding: '10px',
          }}>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-border)',
              marginBottom: '6px',
              letterSpacing: '1px',
            }}>
              ▸ GERAÇÃO PASSIVA
            </div>

            {CPS_UPGRADES.map(u => (
              <UpgradeButton
                key={u.id}
                upgrade={u}
                owned={upgrades[u.id] || 0}
                pets={pets}
                onBuy={buyUpgrade}
                effectText={`+${formatNumber(u.cps)}/s`}
              />
            ))}

            <div style={{
              fontSize: '10px',
              color: 'var(--color-border)',
              marginTop: '14px',
              marginBottom: '6px',
              letterSpacing: '1px',
            }}>
              ▸ BÔNUS DE CLIQUE
            </div>

            {CLICK_UPGRADES.map(u => (
              <UpgradeButton
                key={u.id}
                upgrade={u}
                owned={upgrades[u.id] || 0}
                pets={pets}
                onBuy={buyUpgrade}
                effectText={
                  u.clickMult > 1
                    ? `x${u.clickMult} no clique`
                    : `+${u.clickBonus} por clique`
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Botão de upgrade reutilizável
   ============================================================ */
function UpgradeButton({ upgrade, owned, pets, onBuy, effectText }) {
  const cost = costOf(upgrade, owned);
  const canAfford = pets >= cost;

  return (
    <button
      onClick={() => canAfford && onBuy(upgrade)}
      disabled={!canAfford}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        marginBottom: '4px',
        background: canAfford ? 'var(--color-command-a05)' : 'transparent',
        border: `1px solid ${canAfford ? 'var(--color-command)' : 'var(--color-border-a30)'}`,
        borderRadius: '3px',
        color: canAfford ? 'var(--color-text)' : 'var(--color-dim)',
        fontFamily: 'inherit',
        fontSize: '11px',
        textAlign: 'left',
        cursor: canAfford ? 'pointer' : 'not-allowed',
        transition: 'all 0.15s',
        opacity: canAfford ? 1 : 0.6,
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        if (canAfford) {
          e.currentTarget.style.background = 'var(--color-command-a15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = canAfford ? 'var(--color-command-a05)' : 'transparent';
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>
        {upgrade.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 'bold',
          color: canAfford ? 'var(--color-command)' : 'var(--color-dim)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '11px',
        }}>
          {upgrade.name}
          {owned > 0 && (
            <span style={{ color: 'var(--color-border)', marginLeft: '4px' }}>
              ×{owned}
            </span>
          )}
        </div>
        <div style={{
          fontSize: '9px',
          color: 'var(--color-dim)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {upgrade.desc} · {effectText}
        </div>
      </div>
      <div style={{
        fontSize: '10.5px',
        fontWeight: 'bold',
        color: canAfford ? 'var(--color-command)' : 'var(--color-error)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {formatNumber(cost)} 🐾
      </div>
    </button>
  );
}