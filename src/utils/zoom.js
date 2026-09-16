// src/utils/zoom.js

// Mecânica de zoom escopada APENAS à área do jogo (terminal + janelas).
// Fora do escopo, os atalhos são apenas bloqueados (não alteram nada).
// Não persiste em localStorage.

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.8;
export const ZOOM_STEP = 0.1;

let currentZoom = 1;
let activeScope = null;

function clampZoom(value) {
  // Guarda contra NaN / Infinity / valores não-numéricos
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, n)) * 100) / 100;
}

function applyZoom() {
  currentZoom = clampZoom(currentZoom);

  if (activeScope) {
    activeScope.style.setProperty('--zoom', currentZoom.toString());
  }

  window.dispatchEvent(
    new CustomEvent('k1tty:zoom-changed', { detail: { zoom: currentZoom } })
  );
}

export function getZoom() {
  return currentZoom;
}

export function hasActiveScope() {
  return activeScope !== null;
}

// Chame a partir de main.jsx quando o usuário acionar Ctrl+wheel ou Ctrl +/-.
// Se não houver escopo ativo, não faz nada (o preventDefault já ocorreu no listener global).
export function handleZoomDelta(delta) {
  if (!activeScope) return;
  const d = Number(delta);
  if (!Number.isFinite(d)) return;
  currentZoom = clampZoom(currentZoom + d);
  applyZoom();
}

export function resetZoom() {
  if (!activeScope) return;
  currentZoom = 1;
  applyZoom();
}

export function attachZoom(scopeElement) {
  if (!scopeElement) return;
  if (activeScope && activeScope !== scopeElement) {
    activeScope.style.removeProperty('--zoom');
  }
  activeScope = scopeElement;
  currentZoom = 1;
  applyZoom();
}

export function detachZoom() {
  if (activeScope) {
    activeScope.style.removeProperty('--zoom');
    activeScope = null;
  }
  currentZoom = 1;
}