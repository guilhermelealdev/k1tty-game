// src/components/WindowSounds.jsx

import { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { playOpen } from '../services/uiSounds.js';

export default function WindowSounds() {
  const { state } = useGame();
  const prevRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    const current = new Set(state.openWindows.map((w) => w.id));

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevRef.current = current;
      return;
    }

    let hasNew = false;
    for (const id of current) {
      if (!prevRef.current.has(id)) {
        hasNew = true;
        break;
      }
    }

    if (hasNew) playOpen();
    prevRef.current = current;
  }, [state.openWindows]);

  return null;
}