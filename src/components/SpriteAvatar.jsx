// src/components/SpriteAvatar.jsx

import React, { useEffect, useState } from 'react';

export default function SpriteAvatar({
  talking = false,
  size = 140,
  alt = 'personagem',
  style = {},
  className = '',
}) {
  const [frame, setFrame] = useState('idle');

  useEffect(() => {
    if (talking) {
      // Talking: alterna rápido entre idle e talking
      const interval = setInterval(() => {
        setFrame(prev => (prev === 'idle' ? 'talking' : 'idle'));
      }, 90);
      return () => clearInterval(interval);
    }

    // Idle: "reação" breve a cada ~8s pra parecer viva
    setFrame('idle');
    let blinkTimer = null;
    let blinkInterval = setInterval(() => {
      setFrame('talking');
      blinkTimer = setTimeout(() => setFrame('idle'), 100);
    }, 8000);

    return () => {
      clearInterval(blinkInterval);
      if (blinkTimer) clearTimeout(blinkTimer);
    };
  }, [talking]);

  const src = frame === 'talking' ? '/pictures/talking.png' : '/pictures/idle.webp';

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        imageRendering: 'pixelated',
        userSelect: 'none',
        pointerEvents: 'none',
        transition: 'transform 0.06s ease-out',
        transform: frame === 'talking' ? 'scale(1.02)' : 'scale(1)',
        ...style,
      }}
    />
  );
}