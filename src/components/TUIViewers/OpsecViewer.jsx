// src/components/TUIViewers/OpsecViewer.jsx

import React, { useEffect } from 'react';
import { useGame } from '../../state/GameContext.jsx';

export default function OpsecViewer() {
  const { dispatch } = useGame();

  useEffect(() => {
    dispatch({ type: 'SET_FLAG', payload: { flag: 'sawOpsec', value: true } });
  }, [dispatch]);

  return (
    <img
      src="/pictures/opsec.webp"
      alt="OP SEC"
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        objectFit: 'contain',
        userSelect: 'none',
      }}
      draggable={false}
    />
  );
}