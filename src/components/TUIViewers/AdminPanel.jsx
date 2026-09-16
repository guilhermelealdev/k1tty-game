// src/components/TUIViewers/AdminPanel.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { executeTestAll, executeFullGameTest, executeWhatnowAllStages } from '../../commands/commands.js';
import { PACKAGE_IDS } from '../../data/packages.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';
import { THEMES, DEFAULT_THEME_ID } from '../../data/themes.js';

const ADMIN_PASSWORD = 'Penny';

/* ============================================================
   Primitivos de UI
   ============================================================ */

function ActionButton({ label, onClick, color, filled, wide, small, disabled }) {
  const c = color || 'var(--color-command)';
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: small ? '5px 12px' : '8px 14px',
        background: filled ? c : 'transparent',
        border: `1px solid ${disabled ? 'var(--color-dim)' : c}`,
        color: disabled ? 'var(--color-dim)' : (filled ? 'var(--color-bg)' : c),
        fontFamily: 'Fira Code, monospace',
        fontSize: small ? '11px' : '12px',
        fontWeight: 'bold',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        letterSpacing: '0.3px',
        flex: wide ? '1 1 100%' : '1 1 auto',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = c;
        e.currentTarget.style.color = 'var(--color-bg)';
        e.currentTarget.style.boxShadow = `0 0 10px ${c}88`;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = filled ? c : 'transparent';
        e.currentTarget.style.color = filled ? 'var(--color-bg)' : c;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {label}
    </button>
  );
}

function Toggle({ label, isActive, onToggle, color }) {
  const c = color || 'var(--color-command)';
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '9px 12px',
      borderBottom: '1px solid rgba(149, 198, 35, 0.1)',
      gap: '10px',
      background: isActive ? 'rgba(199, 239, 0, 0.04)' : 'transparent',
      transition: 'background 0.15s',
    }}>
      <span style={{
        fontSize: '12px',
        color: isActive ? 'var(--color-text)' : 'var(--color-dim)',
        flex: 1,
        minWidth: 0,
        lineHeight: 1.4,
      }}>
        {label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        style={{
          padding: '5px 18px',
          border: `1px solid ${isActive ? c : 'var(--color-dim)'}`,
          background: isActive ? c : 'transparent',
          color: isActive ? 'var(--color-bg)' : 'var(--color-dim)',
          cursor: 'pointer',
          fontFamily: 'Fira Code, monospace',
          fontSize: '11px',
          fontWeight: 'bold',
          borderRadius: '4px',
          transition: 'all 0.15s',
          outline: 'none',
          minWidth: '68px',
          letterSpacing: '1px',
          boxShadow: isActive ? `0 0 8px ${c}55` : 'none',
        }}
      >
        {isActive ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

function SectionCard({ title, color, children, collapsible = true, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = color || 'var(--color-command)';

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.25)',
      border: `1px solid ${c}40`,
      borderRadius: '6px',
      marginBottom: '10px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div
        onClick={() => collapsible && setOpen(o => !o)}
        style={{
          padding: '10px 14px',
          background: `linear-gradient(180deg, ${c}15 0%, transparent 100%)`,
          borderBottom: open ? `1px solid ${c}30` : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: 'none',
        }}
      >
        <span style={{
          color: c,
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '1.5px',
          textShadow: `0 0 4px ${c}88`,
        }}>
          {title}
        </span>
        {collapsible && (
          <span style={{
            color: c,
            fontSize: '11px',
            opacity: 0.7,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}>
            ▾
          </span>
        )}
      </div>
      {open && (
        <div style={{ padding: '12px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Tela de login — refeita
   ============================================================ */
function AdminLogin({ onSuccess }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Foco inicial com pequeno delay (às vezes o browser precisa)
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input) return;

    if (input === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError('Access denied.');
      setInput('');
      setShakeKey(k => k + 1);
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at center, #001a1d 0%, #000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: 'Fira Code, monospace',
      color: 'var(--color-text)',
      overflow: 'hidden',
    }}>
      {/* Scanlines sutis */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
        zIndex: 0,
      }} />

      <div
        key={shakeKey}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '440px',
          animation: shakeKey > 0 ? 'adminShake 0.4s ease-out' : 'adminFadeIn 0.4s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            border: '1px solid var(--color-error)',
            borderRadius: '3px',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--color-error)',
            textShadow: '0 0 6px var(--color-error)',
            marginBottom: '16px',
            fontWeight: 'bold',
          }}>
            ⚠ RESTRICTED AREA
          </div>
          <div style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'var(--color-command)',
            letterSpacing: '6px',
            textShadow: '0 0 12px var(--color-command)',
            marginBottom: '6px',
          }}>
            k1tty
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--color-dim)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            authentication required
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-border)',
            letterSpacing: '1px',
            marginBottom: '8px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: focused ? 'var(--color-command)' : 'var(--color-dim)',
              boxShadow: focused ? '0 0 8px var(--color-command)' : 'none',
              transition: 'all 0.2s',
            }} />
            <span>password</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            border: `2px solid ${error
              ? 'var(--color-error)'
              : focused
                ? 'var(--color-command)'
                : 'var(--color-border)'}`,
            borderRadius: '6px',
            padding: '14px 16px',
            gap: '10px',
            transition: 'all 0.2s',
            boxShadow: error
              ? '0 0 20px rgba(239, 100, 97, 0.4), 0 0 6px var(--color-error) inset'
              : focused
                ? '0 0 20px var(--color-command-a30), 0 0 4px var(--color-command-a20) inset'
                : 'none',
          }}>
            <span style={{
              color: focused ? 'var(--color-command)' : 'var(--color-dim)',
              fontSize: '18px',
              flexShrink: 0,
              transition: 'color 0.2s',
            }}>
              🔒
            </span>
            <input
              ref={inputRef}
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError('');
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--color-command)',
                fontFamily: 'Fira Code, monospace',
                fontSize: '16px',
                padding: '0',
                letterSpacing: '4px',
                caretColor: 'var(--color-command)',
                minWidth: 0,
              }}
            />
          </div>
        </form>

        {/* Erro */}
        <div style={{
          marginTop: '14px',
          minHeight: '20px',
          fontSize: '12px',
          color: 'var(--color-error)',
          textAlign: 'center',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textShadow: error ? '0 0 8px var(--color-error)' : 'none',
          transition: 'all 0.2s',
        }}>
          {error && `✗ ${error}`}
        </div>

        {/* Hint */}
        {!error && (
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: 'var(--color-dim)',
            textAlign: 'center',
            letterSpacing: '1px',
            opacity: 0.5,
          }}>
            pressione <span style={{ color: 'var(--color-border)' }}>Enter</span> para continuar
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '16px',
          borderTop: '1px dashed rgba(149, 198, 35, 0.15)',
          fontSize: '10px',
          color: 'var(--color-dim)',
          textAlign: 'center',
          letterSpacing: '1px',
          lineHeight: 1.8,
          opacity: 0.6,
        }}>
          k1tty systems · v1.0<br />
          <span style={{ color: 'var(--color-error)', opacity: 0.7 }}>
            tentativas não autorizadas serão registradas
          </span>
        </div>
      </div>

      <style>{`
        @keyframes adminShake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   AdminPanel principal
   ============================================================ */

export default function AdminPanel() {
  const { state, dispatch } = useGame();
  const [authenticated, setAuthenticated] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [fullTestResult, setFullTestResult] = useState(null);
  const [fullTestStats, setFullTestStats] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [achievementFilter, setAchievementFilter] = useState('all');
  const [whatnowResult, setWhatnowResult] = useState(null);

  // Esquece autenticação ao trocar de save
  useEffect(() => {
    setAuthenticated(false);
  }, [state.currentSave]);

  const flashCopyFeedback = (msg) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const copyToClipboard = async (text, label = 'texto') => {
    if (!text) { flashCopyFeedback('✗ nada para copiar'); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand falhou');
      }
      flashCopyFeedback(`✓ ${label} copiado`);
    } catch { flashCopyFeedback('✗ falha ao copiar'); }
  };

  /* ---------- Ações ---------- */

  const handleWhatnowAllStages = () => {
  const result = executeWhatnowAllStages(state);
  setWhatnowResult(result.output);
};

  const handleUnlockAllPackages = () => {
    PACKAGE_IDS.forEach(pkg => {
      if (!state.installedPackages.includes(pkg)) {
        dispatch({ type: 'INSTALL_PACKAGE', payload: pkg });
      }
    });
    dispatch({ type: 'SET_WIFI_CONNECTED', payload: true });
  };

  const handleUnlockAllAchievements = () => {
    ACHIEVEMENTS.forEach(a => {
      if (!(state.unlockedAchievements || []).includes(a.id)) {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: a.id });
      }
    });
  };

  const handleResetAchievements = () => {
    dispatch({ type: 'CLEAR_PENDING_UNLOCKS' });
    dispatch({ type: 'RESET_PROGRESS' });
  };

  const handleTriggerAchievement = (id) => {
    dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id });
  };

  const handleClearTerminal = () => dispatch({ type: 'CLEAR_HISTORY' });
  const handleCloseGame = () => dispatch({ type: 'REBOOT_FORCE' });
  const handleToggleWifi = () => dispatch({ type: 'SET_WIFI_CONNECTED', payload: !state.wifiConnected });

  const handleCycleTheme = () => {
    const idx = THEMES.findIndex(t => t.id === (state.theme || DEFAULT_THEME_ID));
    const next = THEMES[(idx + 1) % THEMES.length];
    dispatch({ type: 'SET_THEME', payload: next.id });
  };

  const handleRandomTheme = () => {
    const t = THEMES[Math.floor(Math.random() * THEMES.length)];
    dispatch({ type: 'SET_THEME', payload: t.id });
  };

  const handleResetTheme = () => dispatch({ type: 'SET_THEME', payload: DEFAULT_THEME_ID });
  const handleSetProgress = (value) => dispatch({ type: 'SET_PROGRESS', payload: value });

  const handleTriggerVictory = () => dispatch({ type: 'OPEN_WINDOW', payload: 'credits' });
  const handleTriggerCatsOnly = () => dispatch({ type: 'START_FINALE' });

  const handleTriggerMiauFinale = () => {
    const adminWindow = state.openWindows.find(w => w.type === 'admin');
    if (adminWindow) dispatch({ type: 'CLOSE_WINDOW', payload: adminWindow.id });
    setTimeout(() => dispatch({ type: 'START_MIAU_FINALE' }), 300);
  };

  const handleTriggerMiauRage = () => {
    dispatch({ type: 'MIAU_RAGE_END' });
    dispatch({ type: 'CORRUPT_SYSTEM', payload: { source: 'miau' } });
  };

  const handleTriggerCorruption = () => {
    dispatch({ type: 'CORRUPT_SYSTEM', payload: { source: 'user' } });
  };

  const handleTriggerOSSwitch = () => {
    const adminWindow = state.openWindows.find(w => w.type === 'admin');
    if (adminWindow) dispatch({ type: 'CLOSE_WINDOW', payload: adminWindow.id });
    setTimeout(() => dispatch({ type: 'START_OS_SWITCH' }), 300);
  };

  const isRequirementOn = (flagName) => state.flags?.[flagName] !== false;
  const toggleRequirement = (flagName) => {
    const currentlyOn = isRequirementOn(flagName);
    dispatch({ type: 'SET_FLAG', payload: { flag: flagName, value: !currentlyOn } });
  };

  const isFlagOn = (flagName) => state.flags?.[flagName] === true;
  const toggleFlag = (flagName) => {
    dispatch({ type: 'SET_FLAG', payload: { flag: flagName, value: !isFlagOn(flagName) } });
  };

  const handleTestAll = () => {
    const result = executeTestAll(state);
    setTestResult(result.output);
  };

  const handleFullTest = () => {
    const result = executeFullGameTest(state);
    setFullTestResult(result.output);
    setFullTestStats(result.stats);
  };

  const handleNukeEverything = () => {
    if (!confirm('⚠️ Isso apaga TODOS os saves e reseta o jogo. Continuar?')) return;
    try {
      localStorage.removeItem('k1tty_saves');
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('k1tty_')) localStorage.removeItem(k);
      });
    } catch {}
    dispatch({ type: 'REBOOT_FORCE' });
    setTimeout(() => window.location.reload(), 200);
  };

  /* ---------- Derivados ---------- */

  const unlockedCount = (state.unlockedAchievements || []).length;
  const totalAchievements = ACHIEVEMENTS.length;

  const achievementsFiltered = useMemo(() => {
    if (achievementFilter === 'unlocked') {
      return ACHIEVEMENTS.filter(a => (state.unlockedAchievements || []).includes(a.id));
    }
    if (achievementFilter === 'locked') {
      return ACHIEVEMENTS.filter(a => !(state.unlockedAchievements || []).includes(a.id));
    }
    return ACHIEVEMENTS;
  }, [achievementFilter, state.unlockedAchievements]);

  const flagEntries = Object.entries(state.flags || {});

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'linear-gradient(180deg, var(--color-bg-deep) 0%, var(--color-bg) 100%)',
      fontFamily: 'Fira Code, monospace',
      fontSize: '12px',
      color: 'var(--color-text)',
    }}>
      <div style={{
        maxWidth: '880px',
        margin: '0 auto',
        padding: '16px 18px 40px',
        position: 'relative',
      }}>

        {/* Toast de feedback */}
        {copyFeedback && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 20px',
            background: copyFeedback.startsWith('✓')
              ? 'rgba(199,239,0,0.15)'
              : 'rgba(239,100,97,0.15)',
            border: `1px solid ${copyFeedback.startsWith('✓') ? 'var(--color-command)' : 'var(--color-error)'}`,
            borderRadius: '4px',
            color: copyFeedback.startsWith('✓') ? 'var(--color-command)' : 'var(--color-error)',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 100,
            boxShadow: copyFeedback.startsWith('✓')
              ? '0 0 20px rgba(199,239,0,0.3)'
              : '0 0 20px rgba(239,100,97,0.3)',
            animation: 'adminToastIn 0.25s ease-out',
          }}>
            {copyFeedback}
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--color-border)',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--color-command)',
              boxShadow: '0 0 10px var(--color-command)',
              animation: 'adminPulse 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: 'var(--color-command)',
                letterSpacing: '3px',
                textShadow: '0 0 8px var(--color-command)',
              }}>
                ADMIN PANEL
              </div>
              <div style={{
                fontSize: '10px',
                color: 'var(--color-dim)',
                letterSpacing: '2px',
                marginTop: '2px',
              }}>
                k1tty systems · v1.0 · autenticado
              </div>
            </div>
          </div>

          <button
            onClick={() => setAuthenticated(false)}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              fontFamily: 'inherit',
              fontSize: '11px',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-error)';
              e.currentTarget.style.color = 'var(--color-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-error)';
            }}
          >
            🔒 log out
          </button>
        </div>

        {/* Grid de stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          marginBottom: '16px',
        }}>
          <StatCard label="Progresso" value={`${state.progress}%`} color="var(--color-command)" />
          <StatCard label="WiFi" value={state.wifiConnected ? 'on' : 'off'} color={state.wifiConnected ? 'var(--color-command)' : 'var(--color-error)'} />
          <StatCard label="Pacotes" value={`${state.installedPackages.length}/${PACKAGE_IDS.length}`} />
          <StatCard label="Conquistas" value={`${unlockedCount}/${totalAchievements}`} color="#ffb86c" />
          <StatCard label="Snapshots" value={`${state.snapshots.length}/5`} />
          <StatCard label="Tema" value={state.theme || 'neon'} />
          <StatCard label="Janelas" value={state.openWindows.length} />
          <StatCard label="Save" value={`slot ${state.currentSave}`} />
        </div>

        {/* ============================================================
            SEÇÕES
            ============================================================ */}

        {/* Ações rápidas */}
        <SectionCard title="▸ AÇÕES RÁPIDAS" color="var(--color-command)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <ActionButton label="📦 Instalar todos" onClick={handleUnlockAllPackages} />
            <ActionButton label="🏆 Desbloquear conquistas" onClick={handleUnlockAllAchievements} color="#ffb86c" />
            <ActionButton label="📶 Toggle WiFi" onClick={handleToggleWifi} />
            <ActionButton label="🎨 Próximo tema" onClick={handleCycleTheme} />
            <ActionButton label="🎲 Tema aleatório" onClick={handleRandomTheme} />
            <ActionButton label="↻ Resetar tema" onClick={handleResetTheme} color="var(--color-dim)" />
            <ActionButton label="⌧ Limpar terminal" onClick={handleClearTerminal} color="var(--color-dim)" />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed rgba(149, 198, 35, 0.15)',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--color-dim)', letterSpacing: '1px' }}>PROGRESSO:</span>
            {[0, 25, 50, 75, 100].map(v => (
              <ActionButton
                key={v}
                label={`${v}%`}
                onClick={() => handleSetProgress(v)}
                small
                color={state.progress === v ? 'var(--color-command)' : 'var(--color-border)'}
                filled={state.progress === v}
              />
            ))}
          </div>
        </SectionCard>

        {/* Conquistas */}
        <SectionCard title="▸ CONQUISTAS" color="#ffb86c">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <ActionButton label="🏆 Desbloquear TODAS" onClick={handleUnlockAllAchievements} color="#ffb86c" filled />
            <ActionButton label="↺ Resetar conquistas" onClick={handleResetAchievements} color="var(--color-error)" />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {['all', 'unlocked', 'locked'].map(f => (
              <ActionButton
                key={f}
                label={f === 'all'
                  ? `Todas (${totalAchievements})`
                  : f === 'unlocked'
                    ? `Destravadas (${unlockedCount})`
                    : `Bloqueadas (${totalAchievements - unlockedCount})`}
                onClick={() => setAchievementFilter(f)}
                small
                color={achievementFilter === f ? '#ffb86c' : 'var(--color-border)'}
                filled={achievementFilter === f}
              />
            ))}
          </div>

          <div style={{
            maxHeight: '280px',
            overflowY: 'auto',
            border: '1px solid rgba(255, 184, 108, 0.2)',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.3)',
          }}>
            {achievementsFiltered.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--color-dim)',
                fontStyle: 'italic',
              }}>
                {achievementFilter === 'unlocked' ? 'nenhuma conquista destravada' : 'nenhuma conquista bloqueada'}
              </div>
            ) : (
              achievementsFiltered.map(a => {
                const isUnlocked = (state.unlockedAchievements || []).includes(a.id);
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 10px',
                      borderBottom: '1px solid rgba(255, 184, 108, 0.08)',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{
                      fontSize: '16px',
                      flexShrink: 0,
                      filter: isUnlocked ? 'none' : 'grayscale(1)',
                      opacity: isUnlocked ? 1 : 0.6,
                    }}>
                      {a.icon}
                    </span>
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      color: isUnlocked ? 'var(--color-command)' : 'var(--color-dim)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {a.name}
                      <span style={{
                        color: 'var(--color-dim)',
                        marginLeft: '8px',
                        fontSize: '9px',
                        opacity: 0.7,
                      }}>
                        {a.category}
                      </span>
                    </span>
                    <button
                      onClick={() => handleTriggerAchievement(a.id)}
                      style={{
                        background: isUnlocked ? 'transparent' : 'rgba(255, 184, 108, 0.1)',
                        border: `1px solid ${isUnlocked ? 'var(--color-dim)' : '#ffb86c'}`,
                        color: isUnlocked ? 'var(--color-dim)' : '#ffb86c',
                        fontFamily: 'inherit',
                        fontSize: '10px',
                        padding: '2px 10px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isUnlocked ? '✓ repetir' : '+ dar'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        {/* Finais e eventos */}
        <SectionCard title="▸ FINAIS E EVENTOS" color="var(--color-error)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
            <ActionButton label="⭐ Créditos (victory)" onClick={handleTriggerVictory} color="var(--color-command)" />
            <ActionButton label="🌸 Final bom da miau" onClick={handleTriggerMiauFinale} color="#cba6f7" />
            <ActionButton label="🔄 Trocar de SO" onClick={handleTriggerOSSwitch} color="#88c0d0" />
            <ActionButton label="▶ Pular para os gatos" onClick={handleTriggerCatsOnly} color="var(--color-command)" />
            <ActionButton label="💀 Raiva da miau" onClick={handleTriggerMiauRage} color="#cba6f7" />
            <ActionButton label="☠️ Corromper sistema" onClick={handleTriggerCorruption} color="var(--color-error)" />
          </div>
        </SectionCard>

        {/* Requisitos */}
        <SectionCard title="▸ REQUISITOS" color="var(--color-border)">
          <Toggle
            label="Exigir sudo para apt"
            isActive={isRequirementOn('aptRequiresSudo')}
            onToggle={() => toggleRequirement('aptRequiresSudo')}
          />
          <Toggle
            label="Exigir internet para apt"
            isActive={isRequirementOn('aptRequiresWifi')}
            onToggle={() => toggleRequirement('aptRequiresWifi')}
          />
          <Toggle
            label="Exigir Bluetooth para músicas"
            isActive={isRequirementOn('musicRequiresBluetooth')}
            onToggle={() => toggleRequirement('musicRequiresBluetooth')}
          />
        </SectionCard>

        {/* Flags de debug */}
        <SectionCard title="▸ FLAGS DE DEBUG" color="var(--color-border)" defaultOpen={false}>
          <Toggle
            label="Pular senhas de puzzle (sudo, m30w, TOKEN)"
            isActive={isFlagOn('skipPuzzlePasswords')}
            onToggle={() => toggleFlag('skipPuzzlePasswords')}
            color="#ffb86c"
          />
          <Toggle
            label="Pular pareamento Bluetooth"
            isActive={isFlagOn('skipBluetooth')}
            onToggle={() => toggleFlag('skipBluetooth')}
            color="#ffb86c"
          />
          <Toggle
            label="Marcar 'encontrei o /root'"
            isActive={isFlagOn('openedSecret')}
            onToggle={() => toggleFlag('openedSecret')}
          />
          <Toggle
            label="Marcar 'finais desbloqueados'"
            isActive={isFlagOn('finalUnlocked')}
            onToggle={() => toggleFlag('finalUnlocked')}
          />
          <Toggle
            label="Marcar 'fastfetch da miau'"
            isActive={isFlagOn('miauFastfetchUnlocked')}
            onToggle={() => toggleFlag('miauFastfetchUnlocked')}
            color="#cba6f7"
          />

          {flagEntries.length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(149, 198, 35, 0.15)' }}>
              <div style={{ fontSize: '10px', color: 'var(--color-border)', letterSpacing: '1px', marginBottom: '6px' }}>
                FLAGS ATIVAS ({flagEntries.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {flagEntries.map(([key, value]) => (
                  <span key={key} style={{
                    padding: '2px 8px',
                    border: `1px solid ${value ? 'var(--color-command)' : 'var(--color-dim)'}40`,
                    color: value ? 'var(--color-command)' : 'var(--color-dim)',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontFamily: 'Fira Code, monospace',
                    background: value ? 'rgba(199,239,0,0.05)' : 'transparent',
                  }}>
                    {key}: {value === true ? 'ON' : value === false ? 'OFF' : String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Diagnóstico */}
        <SectionCard title="▸ DIAGNÓSTICO" color="var(--color-command)">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
  <ActionButton label="🧪 Testar jogo completo" onClick={handleFullTest} color="var(--color-command)" filled />
  <ActionButton label="> Testar comandos base" onClick={handleTestAll} color="var(--color-command)" />
  <ActionButton label="📋 Print todos os whatnow" onClick={handleWhatnowAllStages} color="#88c0d0" />
</div>

{whatnowResult && (
  <div style={{ marginTop: '12px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
      gap: '10px',
    }}>
      <span style={{ fontSize: '11px', color: '#88c0d0', letterSpacing: '1px', fontWeight: 'bold' }}>
        ▸ WHATNOW — TODOS OS ESTÁGIOS
      </span>
      <button
        onClick={() => copyToClipboard(whatnowResult, 'whatnow completo')}
        style={{
          background: 'transparent',
          border: '1px solid #88c0d0',
          color: '#88c0d0',
          fontFamily: 'inherit',
          fontSize: '10px',
          padding: '3px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
      >
        📋 copiar
      </button>
    </div>
    <pre style={{
      fontSize: '11px',
      color: 'var(--color-text)',
      whiteSpace: 'pre-wrap',
      overflowY: 'auto',
      maxHeight: '400px',
      background: 'rgba(0,0,0,0.5)',
      padding: '10px 12px',
      borderRadius: '4px',
      lineHeight: 1.5,
      border: '1px solid rgba(136, 192, 208, 0.3)',
      fontFamily: 'Fira Code, monospace',
    }}>
      {whatnowResult}
    </pre>
  </div>
)}

          {fullTestStats && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: fullTestStats.totalFail === 0 ? 'rgba(199,239,0,0.08)' : 'rgba(239,100,97,0.12)',
              border: `1px solid ${fullTestStats.totalFail === 0 ? 'var(--color-command)' : 'var(--color-error)'}`,
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              color: fullTestStats.totalFail === 0 ? 'var(--color-command)' : 'var(--color-error)',
              fontWeight: 'bold',
              fontSize: '12px',
              flexWrap: 'wrap',
            }}>
              <span>
                {fullTestStats.totalFail === 0
                  ? `✓ ${fullTestStats.totalOk} OK · ${fullTestStats.totalWarn} avisos`
                  : `✗ ${fullTestStats.totalFail} falhas · ${fullTestStats.totalOk} OK`}
              </span>
              {fullTestResult && (
                <button
                  onClick={() => copyToClipboard(fullTestResult, 'resultado completo')}
                  style={{
                    background: 'transparent',
                    border: '1px solid currentColor',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: '10px',
                    padding: '3px 10px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  📋 copiar
                </button>
              )}
            </div>
          )}

          {fullTestResult && (
            <pre style={{
              marginTop: '10px',
              fontSize: '11px',
              color: 'var(--color-text)',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              maxHeight: '320px',
              background: 'rgba(0,0,0,0.5)',
              padding: '10px 12px',
              borderRadius: '4px',
              lineHeight: 1.5,
              border: '1px solid rgba(149, 198, 35, 0.2)',
              fontFamily: 'Fira Code, monospace',
            }}>
              {fullTestResult}
            </pre>
          )}

          {testResult && (
            <>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: 'var(--color-dim)',
                letterSpacing: '1px',
                gap: '10px',
              }}>
                <span>▸ TESTE DE COMANDOS BASE</span>
                <button
                  onClick={() => copyToClipboard(testResult, 'resultado de comandos')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-command)',
                    fontFamily: 'inherit',
                    fontSize: '10px',
                    padding: '3px 10px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  📋 copiar
                </button>
              </div>
              <pre style={{
                marginTop: '6px',
                fontSize: '11px',
                color: 'var(--color-text)',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                maxHeight: '200px',
                background: 'rgba(0,0,0,0.5)',
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(149, 198, 35, 0.2)',
                fontFamily: 'Fira Code, monospace',
              }}>
                {testResult}
              </pre>
            </>
          )}
        </SectionCard>

        {/* Sudo + debug */}
        <SectionCard title="▸ SUDO + DEBUG" color="var(--color-border)" defaultOpen={false}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              gap: '8px',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--color-dim)', letterSpacing: '1px' }}>SENHA DO SUDO</span>
              <button
                onClick={() => copyToClipboard(state.sudoPassword, 'senha do sudo')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-command)',
                  fontFamily: 'inherit',
                  fontSize: '10px',
                  padding: '3px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                📋 copiar
              </button>
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--color-text)',
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px dashed rgba(149, 198, 35, 0.25)',
              borderRadius: '4px',
              fontFamily: 'Fira Code, monospace',
              userSelect: 'all',
              wordBreak: 'break-all',
              letterSpacing: '1px',
            }}>
              {state.sudoPassword}
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              gap: '8px',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--color-dim)', letterSpacing: '1px' }}>DEBUG SNAPSHOT</span>
              <button
                onClick={() => copyToClipboard(
                  JSON.stringify({
                    flags: state.flags,
                    installedPackages: state.installedPackages,
                    unlockedAchievements: state.unlockedAchievements,
                    progress: state.progress,
                    wifiConnected: state.wifiConnected,
                    theme: state.theme,
                    currentDirectory: state.currentDirectory,
                    currentSave: state.currentSave,
                    fsSize: JSON.stringify(state.filesystem).length,
                    seenEndings: state.seenEndings,
                  }, null, 2),
                  'debug info'
                )}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-command)',
                  fontFamily: 'inherit',
                  fontSize: '10px',
                  padding: '3px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                📋 copiar
              </button>
            </div>
            <pre style={{
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '140px',
              color: 'var(--color-dim)',
              background: 'rgba(0,0,0,0.4)',
              padding: '8px 12px',
              borderRadius: '4px',
              margin: 0,
              fontFamily: 'Fira Code, monospace',
              border: '1px solid rgba(149, 198, 35, 0.15)',
              lineHeight: 1.5,
            }}>
{JSON.stringify({
  flags: Object.keys(state.flags || {}).length,
  pacotes: state.installedPackages.length,
  conquistas: unlockedCount,
  progresso: state.progress + '%',
  finais: state.seenEndings || [],
  fsSize: JSON.stringify(state.filesystem).length + 'B',
}, null, 2)}
            </pre>
          </div>
        </SectionCard>

        {/* Zona de perigo */}
        <SectionCard title="▸ ZONA DE PERIGO" color="var(--color-error)" defaultOpen={false}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <ActionButton label="✕ Fechar jogo (reboot)" onClick={handleCloseGame} color="var(--color-warning)" />
            <ActionButton label="☠️ Apagar TODOS os saves" onClick={handleNukeEverything} color="var(--color-error)" filled />
          </div>
          <div style={{
            marginTop: '10px',
            fontSize: '10px',
            color: 'var(--color-dim)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            "Apagar TODOS os saves" limpa o localStorage inteiro do k1tty e recarrega a página.
          </div>
        </SectionCard>
      </div>

      <style>{`
        @keyframes adminToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes adminPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   StatCard (pequeno card de métrica)
   ============================================================ */
function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: '8px 12px',
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(149, 198, 35, 0.15)',
      borderRadius: '5px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: 0,
    }}>
      <span style={{
        fontSize: '9px',
        color: 'var(--color-dim)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        opacity: 0.8,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '13px',
        fontWeight: 'bold',
        color: color || 'var(--color-command)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: 'Fira Code, monospace',
      }}>
        {value}
      </span>
    </div>
  );
}