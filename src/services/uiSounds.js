// src/services/uiSounds.js
//
// Implementação com Web Audio API.
// - Buffers são decodificados uma vez no boot (fetch + decodeAudioData).
// - AudioContext é criado já suspenso e retomado no primeiro gesture.
// - play() é síncrono → zero latência, zero Promise pendente.

const SOURCES = {
  hover:    { url: '/sounds/hover.mp3',    volume: 0.01 },  // ↓ era 0.18
  selected: { url: '/sounds/selected.mp3', volume: 0.03 },  // ↓ era 0.28
  open:     { url: '/sounds/open.mp3',     volume: 0.22 },  // ↓ era 0.30
};

let audioCtx = null;
const buffers = {};
let preloadPromise = null;
let unlocked = false;

function log(...args)  { console.log('%c[uiSounds]', 'color:#C7EF00', ...args); }
function warn(...args) { console.warn('%c[uiSounds]', 'color:#EF6461', ...args); }

/* ============================================================
   AudioContext
   ============================================================ */
function ensureContext() {
  if (audioCtx) return audioCtx;
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    warn('Web Audio API não suportada neste navegador.');
    return null;
  }
  audioCtx = new Ctx();
  log(`AudioContext criado (state=${audioCtx.state})`);
  return audioCtx;
}

/* ============================================================
   Preload — roda no import do módulo
   ============================================================ */
function preload() {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const ctx = ensureContext();
    if (!ctx) return;

    await Promise.all(
      Object.entries(SOURCES).map(async ([key, cfg]) => {
        try {
          const res = await fetch(cfg.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const ab = await res.arrayBuffer();
          const buf = await ctx.decodeAudioData(ab);
          buffers[key] = buf;
          log(`✓ ${key} pronto (${buf.duration.toFixed(2)}s)`);
        } catch (e) {
          warn(`falha ao carregar ${cfg.url}: ${e.message}`);
        }
      })
    );

    log('preload completo');
  })();

  return preloadPromise;
}

/* ============================================================
   Unlock — chamado no primeiro gesture
   ============================================================ */
function unlock() {
  if (unlocked) return;
  const ctx = ensureContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume()
      .then(() => {
        unlocked = true;
        log(`✓ AudioContext resumed (state=${ctx.state}) — sons liberados`);
      })
      .catch((e) => warn('resume falhou:', e?.message || e));
  } else {
    unlocked = true;
    log(`✓ AudioContext já ativo (state=${ctx.state})`);
  }
}

/* ============================================================
   Play
   ============================================================ */
function play(key) {
  const ctx = audioCtx;
  const buf = buffers[key];
  if (!ctx || !buf) return;

  // Se ainda estiver suspenso (raro), tenta retomar em background
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const source = ctx.createBufferSource();
    source.buffer = buf;

    const gain = ctx.createGain();
    gain.gain.value = SOURCES[key].volume;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    warn(`play("${key}") exceção:`, e?.message || e);
  }
}

export function playHover()    { play('hover'); }
export function playSelected() { play('selected'); }
export function playOpen()     { play('open'); }

// compat com o import antigo
export function unlockUiSounds() { unlock(); }

/* ============================================================
   Bootstrap
   ============================================================ */
if (typeof window !== 'undefined') {
  // Dispara o preload o quanto antes
  preload();

  // Primeiro gesture destrava o contexto
  const handler = () => unlock();
  ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, handler, { capture: true, passive: true });
  });

  // Expõe o contexto pra debug manual
  window.__k1tty_getAudioCtx = () => audioCtx;
}