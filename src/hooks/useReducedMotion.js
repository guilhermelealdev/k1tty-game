// src/hooks/useReducedMotion.js

import { useEffect, useState } from 'react';

const OVERRIDE_KEY = 'k1tty_force_animations';

/**
 * Respeita prefers-reduced-motion, MAS permite override via localStorage.
 *
 *   localStorage.setItem('k1tty_force_animations', 'true')  → força animações
 *   localStorage.setItem('k1tty_force_animations', 'false') → respeita o SO
 *   localStorage.removeItem('k1tty_force_animations')       → respeita o SO
 *
 * Também expõe um event listener para mudanças em runtime — se você
 * setar a key no console, a UI reage na hora.
 */
function readOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(OVERRIDE_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
    return null;
  } catch {
    return null;
  }
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;

    const override = readOverride();
    if (override !== null) return !override; // força anim → não-reduced

    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const recompute = () => {
      const override = readOverride();
      if (override !== null) {
        setReduced(!override);
        return;
      }
      setReduced(mq.matches);
    };

    const onMQChange = (e) => {
      // Só aplica se não houver override
      if (readOverride() === null) setReduced(e.matches);
    };

    // Listener de mídia
    if (mq.addEventListener) mq.addEventListener('change', onMQChange);
    else mq.addListener(onMQChange);

    // Listener de storage — dispara quando outra aba muda; para a mesma
    // aba, expomos um custom event para mudanças em runtime
    const onStorage = (e) => {
      if (e.key === OVERRIDE_KEY || e.key === null) recompute();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('k1tty:motion-preference-changed', recompute);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onMQChange);
      else mq.removeListener(onMQChange);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('k1tty:motion-preference-changed', recompute);
    };
  }, []);

  return reduced;
}

/* ============================================================
   Utilitário para forçar/limpar o override em runtime.
   ============================================================ */
export function setForceAnimations(force) {
  if (typeof window === 'undefined') return;
  try {
    if (force === null) localStorage.removeItem(OVERRIDE_KEY);
    else localStorage.setItem(OVERRIDE_KEY, force ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('k1tty:motion-preference-changed'));
  } catch { /* ignora */ }
}

export function getForceAnimations() {
  return readOverride();
}