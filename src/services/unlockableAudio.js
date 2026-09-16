// src/services/unlockableAudio.js

const FADE_TICK_MS = 30;

const gestureListeners = new Set();
let gestureInitDone = false;

function ensureGestureListener() {
  if (gestureInitDone) return;
  if (typeof window === 'undefined') return;
  gestureInitDone = true;

  const handler = (e) => {
    gestureListeners.forEach((cb) => {
      try { cb(e); } catch {}
    });
  };

  ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) =>
    window.addEventListener(evt, handler, { capture: true, passive: true })
  );
}

function onGesture(cb) {
  ensureGestureListener();
  gestureListeners.add(cb);
  return () => gestureListeners.delete(cb);
}

export function playUnmuted(audio, {
  volume,
  fadeInMs = 0,
  fadeOutMs = 0,
} = {}) {
  if (!audio) return { stop: () => {}, setMuted: () => {}, isUnmuted: () => false };

  const targetVol = typeof volume === 'number' ? volume : (audio.volume || 0.3);
  let cancelled = false;
  let fadeTimer = null;
  let unmuted = false;

  const clearFade = () => {
    if (fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  };

  const fadeTo = (from, to, ms, onEnd) => {
    clearFade();
    const steps = Math.max(1, Math.floor(ms / FADE_TICK_MS));
    let i = 0;
    audio.volume = from;
    fadeTimer = setInterval(() => {
      i++;
      if (cancelled) {
        clearFade();
        return;
      }
      const t = Math.min(1, i / steps);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (i >= steps) {
        clearFade();
        if (onEnd) onEnd();
      }
    }, FADE_TICK_MS);
  };

  const tryUnmute = () => {
    if (cancelled || unmuted) return;
    audio.muted = false;
    audio.volume = fadeInMs > 0 ? 0 : targetVol;

    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        if (cancelled) return;
        unmuted = true;
        if (fadeInMs > 0) {
          fadeTo(0, targetVol, fadeInMs);
        } else {
          audio.volume = targetVol;
        }
      }).catch(() => {
        if (cancelled) return;
        audio.muted = true;
        audio.volume = targetVol;
        const p2 = audio.play();
        if (p2 && typeof p2.catch === 'function') p2.catch(() => {});
      });
    } else {
      unmuted = true;
      audio.volume = targetVol;
    }
  };

  const startMuted = () => {
    audio.muted = true;
    audio.volume = targetVol;
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  startMuted();
  tryUnmute();

  const unsubGesture = onGesture(() => {
    if (!unmuted) tryUnmute();
  });

  const handlePause = () => {
    if (cancelled || audio.ended) return;
    if (unmuted) {
      audio.muted = true;
      unmuted = false;
      audio.volume = targetVol;
    }
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
  audio.addEventListener('pause', handlePause);

  const stop = () => {
    cancelled = true;
    unsubGesture();
    audio.removeEventListener('pause', handlePause);
    clearFade();

    if (fadeOutMs > 0) {
      const from = audio.volume;
      const steps = Math.max(1, Math.floor(fadeOutMs / FADE_TICK_MS));
      let i = 0;
      const timer = setInterval(() => {
        i++;
        const t = Math.min(1, i / steps);
        try { audio.volume = Math.max(0, from * (1 - t)); } catch {}
        if (i >= steps) {
          clearInterval(timer);
          try {
            audio.pause();
            audio.currentTime = 0;
            // NÃO limpar src nem chamar load() — evita "Invalid URI"
          } catch {}
        }
      }, FADE_TICK_MS);
    } else {
      try {
        audio.pause();
        audio.currentTime = 0;
        // NÃO limpar src nem chamar load() — evita "Invalid URI"
      } catch {}
    }
  };

  const setMuted = (m) => {
    if (cancelled) return;
    if (m) {
      audio.muted = true;
      unmuted = false;
      audio.volume = targetVol;
    } else {
      tryUnmute();
    }
  };

  return {
    stop,
    setMuted,
    isUnmuted: () => unmuted,
    getAudio: () => audio,
  };
}

export function createAudio({ src, loop = true } = {}) {
  const audio = new Audio();
  audio.src = src;
  audio.loop = loop;
  audio.preload = 'auto';
  audio.muted = true;
  audio.volume = 0;
  return audio;
}