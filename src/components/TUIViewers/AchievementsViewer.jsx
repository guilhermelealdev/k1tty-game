import React, { useMemo } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, TOTAL_ACHIEVEMENTS } from '../../data/achievements.js';

export default function AchievementsViewer() {
  const { state } = useGame();
  const unlocked = state.unlockedAchievements || [];

  const byCategory = useMemo(() => {
    const map = {};
    for (const cat of Object.keys(ACHIEVEMENT_CATEGORIES)) {
      map[cat] = ACHIEVEMENTS.filter(a => a.category === cat);
    }
    return map;
  }, []);

  const unlockedCount = unlocked.length;
  const percent = TOTAL_ACHIEVEMENTS > 0
    ? Math.floor((unlockedCount / TOTAL_ACHIEVEMENTS) * 100)
    : 0;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-panel)',
      fontFamily: 'inherit',
      color: 'var(--color-text)',
      fontSize: '12px',
      overflow: 'hidden',
    }}>
      {/* Header com contador */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-header)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '8px',
        }}>
          <span style={{
            color: 'var(--color-command)',
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: 'var(--glow-soft)',
          }}>
            🏆 Conquistas
          </span>
          <span style={{
            color: 'var(--color-command)',
            fontWeight: 'bold',
            fontSize: '13px',
          }}>
            {unlockedCount} / {TOTAL_ACHIEVEMENTS}
          </span>
        </div>

        {/* Barra de progresso */}
        <div style={{
          height: '6px',
          background: 'var(--color-bg-deep)',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid var(--color-border-a30)',
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-command) 100%)',
            boxShadow: '0 0 8px var(--color-command-a50)',
            transition: 'width 0.4s ease-out',
          }} />
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-dim)',
          marginTop: '4px',
          textAlign: 'right',
        }}>
          {percent}% concluído
        </div>
      </div>

      {/* Lista por categoria */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px 14px',
      }}>
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([catId, catMeta]) => {
          const list = byCategory[catId] || [];
          if (list.length === 0) return null;

          const catUnlocked = list.filter(a => unlocked.includes(a.id)).length;

          return (
            <div key={catId} style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: `1px dashed ${catMeta.color}55`,
              }}>
                <span style={{
                  color: catMeta.color,
                  fontWeight: 'bold',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>
                  ▸ {catMeta.label}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--color-dim)',
                }}>
                  {catUnlocked}/{list.length}
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}>
                {list.map(a => {
                  const isUnlocked = unlocked.includes(a.id);
                  // Esconde conquistas com `hidden: true` OU que sejam da categoria "enigma"
                  const shouldHide = (a.hidden === true || a.category === 'enigma') && !isUnlocked;
                  const showIcon = shouldHide ? '❔' : a.icon;
                  const showName = shouldHide ? '???' : a.name;
                  const showDesc = shouldHide ? '???' : a.desc;

                  return (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 10px',
                        border: `1px solid ${isUnlocked ? catMeta.color : 'var(--color-border-a30)'}`,
                        borderRadius: '3px',
                        background: isUnlocked ? `${catMeta.color}10` : 'transparent',
                        opacity: isUnlocked ? 1 : 0.55,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        fontSize: '22px',
                        lineHeight: 1,
                        filter: isUnlocked
                          ? `drop-shadow(0 0 4px ${catMeta.color}88)`
                          : 'grayscale(1)',
                        opacity: isUnlocked ? 1 : 0.5,
                        minWidth: '26px',
                        textAlign: 'center',
                      }}>
                        {showIcon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 'bold',
                          color: isUnlocked ? catMeta.color : 'var(--color-dim)',
                          fontSize: '11.5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          letterSpacing: shouldHide ? '2px' : '0',
                        }}>
                          {showName}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--color-dim)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          letterSpacing: shouldHide ? '2px' : '0',
                          fontStyle: shouldHide ? 'italic' : 'normal',
                        }}>
                          {showDesc}
                        </div>
                      </div>
                      {isUnlocked && (
                        <span style={{
                          color: catMeta.color,
                          fontSize: '14px',
                          flexShrink: 0,
                        }}>
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}