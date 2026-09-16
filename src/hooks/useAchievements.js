// src/hooks/useAchievements.js

import { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { isAchieved } from '../data/achievementChecks.js';

export function useAchievements() {
  const { state, dispatch } = useGame();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (checkingRef.current) return;
    if (state.currentSave === null) return;

    const unlocked = state.unlockedAchievements || [];
    const newly = [];

    for (const a of ACHIEVEMENTS) {
      if (unlocked.includes(a.id)) continue;
      if (isAchieved(a.id, state)) {
        newly.push(a.id);
      }
    }

    if (newly.length === 0) return;

    checkingRef.current = true;
    newly.forEach(id => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id });
    });
    setTimeout(() => { checkingRef.current = false; }, 0);
  }, [
    state.currentSave,
    state.flags,
    state.stats,
    state.installedPackages,
    state.theme,
    state.wifiConnected,
    state.tutorialCompleted,
    state.systemCorrupted,
    state.progress,
    state.unlockedAchievements,
    dispatch,
  ]);
}