// src/components/BootScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import { createAudio, playUnmuted } from '../services/unlockableAudio.js';

const LOADING_MUSIC_SRC = '/sounds/loading.mp3';
const LOADING_VOLUME = 0.20;
const FADE_IN_MS = 1800;
const FADE_OUT_MS = 500;

const bootLines = [
  'k1tty BIOS v1.0.0 — (C) 2025 k1tty Systems',
  'Verificando memória.......................... 16384 MB OK',
  'Detectando periféricos....................... OK',
  '',
  'k1tty Linux 1.0.0 (k1tty)',
  '',
  '[*] Iniciando kernel......................... OK',
  '[*] Carregando módulos (gato, ronronar)...... OK',
  '[*] Montando sistema de arquivos............. OK',
  '[*] Iniciando serviços de rede............... OK',
  '[*] Carregando perfil do usuário............. OK',
  '[*] Inicializando terminal................... OK',
  '',
  'Bem-vindo ao k1tty!',
];

export default function BootScreen({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = createAudio({ src: LOADING_MUSIC_SRC, loop: true });
    audioRef.current = audio;

    const handle = playUnmuted(audio, {
      volume: LOADING_VOLUME,
      fadeInMs: FADE_IN_MS,
      fadeOutMs: FADE_OUT_MS,
    });

    return () => {
      handle.stop();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (visibleLines >= bootLines.length) return;

    const targetLine = bootLines[visibleLines];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex <= targetLine.length) {
        setCurrentText(targetLine.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setVisibleLines(prev => prev + 1);
          setCurrentText('');
        }, 130);
      }
    }, 18);

    return () => clearInterval(typeInterval);
  }, [visibleLines]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (visibleLines >= bootLines.length) {
      const completeTimeout = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(completeTimeout);
    }
  }, [visibleLines, onComplete]);

  return (
    <div className="boot-screen">
      <div className="boot-text">
        {bootLines.slice(0, visibleLines).map((line, i) => (
          <div key={i}>{line || ' '}</div>
        ))}
        {visibleLines < bootLines.length && (
          <div>
            {currentText}
            {showCursor && <span className="cursor-blink" />}
          </div>
        )}
      </div>
    </div>
  );
}