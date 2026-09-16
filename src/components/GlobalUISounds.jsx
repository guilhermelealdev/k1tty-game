// src/components/GlobalUISounds.jsx

import { useEffect } from 'react';
import { playHover, playSelected } from '../services/uiSounds.js';

/* ============================================================
   Detecção de "elemento interativo".

   Cobre 3 casos:
     1) Tags/roles/atributos explícitos (button, a, summary, etc.)
     2) Elementos com `data-sound="interactive"` (opt-in manual)
     3) QUALQUER elemento React com onClick / onMouseDown / onPointerDown
        → isso pega divs soltas: save-slots, cards, linhas de tabela, etc.

   Escape hatch: se QUALQUER ancestral tiver `data-sound="silent"`,
   o som é suprimido (hover E click). Isso é usado no sprite da miau
   na tela de saves, que tem som próprio (meow).
   ============================================================ */

function hasReactHandler(el, names) {
  if (!el || el.nodeType !== 1) return false;

  const keys = Object.keys(el);
  let key = null;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$')) {
      key = k;
      break;
    }
  }
  if (!key) return false;

  const props = el[key];
  if (!props) return false;

  for (let i = 0; i < names.length; i++) {
    if (typeof props[names[i]] === 'function') return true;
  }
  return false;
}

const EXPLICIT_SELECTOR = [
  'button',
  'a[href]',
  'summary',
  'details',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'select',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="option"]',
  '[data-sound="interactive"]',
  '[data-interactive]',
].join(', ');

function isInteractive(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.matches && el.matches(EXPLICIT_SELECTOR)) return true;
  if (hasReactHandler(el, ['onClick', 'onMouseDown', 'onPointerDown'])) return true;
  return false;
}

function findInteractiveAncestor(startEl) {
  let cur = startEl;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    if (isInteractive(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

/** Sobe a árvore e retorna o primeiro `data-sound="silent"` encontrado. */
function findSilentAncestor(startEl) {
  let cur = startEl;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    if (
      cur.getAttribute &&
      cur.getAttribute('data-sound') === 'silent'
    ) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

export default function GlobalUISounds() {
  useEffect(() => {
    let lastHovered = null;

    const onOver = (e) => {
      // Se está sobre (ou dentro de) algo "silent", não toca nada.
      if (findSilentAncestor(e.target)) {
        lastHovered = null;
        return;
      }

      const el = findInteractiveAncestor(e.target);
      if (!el) {
        lastHovered = null;
        return;
      }
      if (el === lastHovered) return;
      lastHovered = el;
      playHover();
    };

    const onOut = (e) => {
      if (!lastHovered) return;
      const rel = e.relatedTarget;
      if (rel && lastHovered.contains(rel)) return; // ainda dentro
      lastHovered = null;
    };

    const onClick = (e) => {
      // Click em algo silent → ignora.
      if (findSilentAncestor(e.target)) return;

      const el = findInteractiveAncestor(e.target);
      if (!el) return;
      playSelected();
    };

    // useCapture=true pega antes de qualquer stopPropagation
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('click', onClick, true);

    return () => {
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}