// src/components/TerminalAmbient.jsx

import { useEffect } from 'react';
import { createAudio, playUnmuted } from '../services/unlockableAudio.js';

const AMBIENT_SRC = '/music/terminal.mp3';
const AMBIENT_VOLUME = 0.05;
const FADE_IN_MS = 2400;
const FADE_OUT_MS = 800;

export default function TerminalAmbient() {
  useEffect(() => {
    const audio = createAudio({ src: AMBIENT_SRC, loop: true });
    const handle = playUnmuted(audio, {
      volume: AMBIENT_VOLUME,
      fadeInMs: FADE_IN_MS,
      fadeOutMs: FADE_OUT_MS,
    });
    return () => handle.stop();
  }, []);

  return null;
}