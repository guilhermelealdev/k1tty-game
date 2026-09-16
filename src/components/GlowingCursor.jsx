// src/components/GlowingCursor.jsx

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const PARTICLE_POOL = 48;
const PULSE_POOL = 6;

export default function GlowingCursor({
  color = '#C7EF00',
  size = 5,
  hoverDotSize = 8,
  ringSize = 26,
  hoverRingSize = 46,
  bracketGap = 7,
  hoverBracketGap = 14,
  bracketSize = 5,
  hoverBracketSize = 8,
  auraSize = 130,
}) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const auraRef = useRef(null);
  const bracketRef = useRef(null);
  const pulseRefs = useRef([]);
  const particleRefs = useRef([]);
  const particlePool = useRef([]);

  const hoveringRef = useRef(false);
  const pressedRef = useRef(false);
  const visibleRef = useRef(false);

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const reduced = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add('has-custom-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    const bracket = { x: target.x, y: target.y };
    const aura = { x: target.x, y: target.y };

    // molas (valores animados)
    const ringSpring = { val: 1, vel: 0 };
    const dotSpring = { val: 1, vel: 0 };
    const auraSpring = { val: 1, vel: 0 };
    const gapSpring = { val: bracketGap, vel: 0 };
    const bSizeSpring = { val: bracketSize, vel: 0 };

    particlePool.current = Array.from({ length: PARTICLE_POOL }, () => ({
      active: false,
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1,
      size: 2,
    }));

    let rafId = null;
    let firstMove = false;
    let pulseId = 0;
    let lastTime = performance.now();
    let wasHovering = false;
    let wasPressed = false;
    let bracketRot = 0;

    // ---------- helpers ----------
    const stepSpring = (s, targetVal, stiffness, damping, dt) => {
      const v = s.vel + (targetVal - s.val) * stiffness * dt;
      const v2 = v * Math.pow(damping, dt);
      s.vel = v2;
      s.val += v2 * dt;
    };

    const targetRingScale = () => {
      if (pressedRef.current) return 0.7;
      return hoveringRef.current ? hoverRingSize / ringSize : 1;
    };

    const targetDotScale = () => {
      const base = hoveringRef.current ? hoverDotSize / size : 1;
      return pressedRef.current ? base * 0.82 : base;
    };

    const targetAuraScale = () => {
      if (pressedRef.current) return 0.75;
      return hoveringRef.current ? 1.25 : 1;
    };

    const targetGap = () => {
      if (pressedRef.current) return bracketGap * 0.5;
      return hoveringRef.current ? hoverBracketGap : bracketGap;
    };

    const targetBracketSize = () => {
      const base = hoveringRef.current ? hoverBracketSize : bracketSize;
      return pressedRef.current ? base * 0.8 : base;
    };

    const spawnParticles = (count, speed, maxLifeRange = [380, 720]) => {
      if (reduced) return;
      const pool = particlePool.current;
      for (let i = 0; i < count; i++) {
        const p = pool.find((x) => !x.active);
        if (!p) return;
        const angle = Math.random() * Math.PI * 2;
        const sp = speed * (0.55 + Math.random() * 0.9);
        p.active = true;
        p.x = target.x;
        p.y = target.y;
        p.vx = Math.cos(angle) * sp;
        p.vy = Math.sin(angle) * sp;
        p.life = 0;
        p.maxLife =
          maxLifeRange[0] + Math.random() * (maxLifeRange[1] - maxLifeRange[0]);
        p.size = 1.5 + Math.random() * 2;
      }
    };

    const spawnPulse = () => {
      if (reduced) return;
      const el = pulseRefs.current[pulseId % PULSE_POOL];
      if (!el) {
        pulseId++;
        return;
      }
      el.style.transition = 'none';
      el.style.transform =
        `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(0.3)`;
      el.style.opacity = '0.9';
      void el.offsetWidth;
      el.style.transition =
        'transform 0.6s cubic-bezier(0.2, 0.7, 0.3, 1), opacity 0.6s ease-out';
      el.style.transform =
        `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(2.8)`;
      el.style.opacity = '0';
      pulseId++;
    };

    const setVisibleSafe = (v) => {
      if (visibleRef.current === v) return;
      visibleRef.current = v;
      setVisible(v);
    };

    const setHoveringSafe = (v) => {
      if (hoveringRef.current === v) return;
      hoveringRef.current = v;
      setHovering(v);
    };

    const setPressedSafe = (v) => {
      if (pressedRef.current === v) return;
      pressedRef.current = v;
      setPressed(v);
      document.body.classList.toggle('cursor-clicking', v);
    };

    // ---------- eventos ----------
    const onPointerMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;

      // menu de contexto aberto? volta o cursor custom
      if (document.body.classList.contains('cursor-native')) {
        document.body.classList.remove('cursor-native');
      }

      if (!firstMove) {
        firstMove = true;
        ring.x = aura.x = bracket.x = target.x;
        ring.y = aura.y = bracket.y = target.y;
      }
      setVisibleSafe(true);
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      setPressedSafe(true);
      spawnPulse();
    };

    const onPointerUp = () => setPressedSafe(false);
    const onPointerCancel = () => setPressedSafe(false);

    const onLeave = () => setVisibleSafe(false);
    const onEnter = () => setVisibleSafe(true);

    const onBlur = () => {
      setPressedSafe(false);
      setVisibleSafe(false);
    };

    const onContextMenu = () => {
      document.body.classList.add('cursor-native');
      setPressedSafe(false);
      setVisibleSafe(false);
    };

    const onOver = (e) => {
      const el = e.target;
      if (!el || !(el instanceof Element)) {
        setHoveringSafe(false);
        return;
      }
      const interactive = el.closest(
        'button, a, input, textarea, select, [role="button"], [data-cursor="hover"]'
      );
      setHoveringSafe(!!interactive);
    };

    // impede o drag nativo (que congela o cursor ao segurar em links/imagens)
    const onDragStart = (e) => {
      const el = e.target;
      if (el instanceof Element && el.closest('[data-cursor-drag="allow"]')) return;
      e.preventDefault();
    };

    // ---------- loop ----------
    const tick = (now) => {
      const dtMs = Math.min(50, now - lastTime);
      const dt = Math.max(0.001, dtMs / 16.667);
      lastTime = now;

      const isHovering = hoveringRef.current;
      const isPressed = pressedRef.current;

      if (wasHovering !== isHovering) {
        if (isHovering) spawnParticles(7, 0.6, [340, 620]);
        else spawnParticles(12, 1.0, [420, 780]);
        wasHovering = isHovering;
      }

      if (wasPressed !== isPressed) {
        if (isPressed) spawnParticles(16, 1.25, [380, 700]);
        else spawnParticles(8, 0.7, [300, 560]);
        wasPressed = isPressed;
      }

      // ---- dot (segue o ponteiro 1:1, com escala suave) ----
      stepSpring(dotSpring, targetDotScale(), 0.22, 0.7, dt);
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${dotSpring.val})`;
      }

      // ---- aura (atraso maior, dá profundidade) ----
      aura.x += (target.x - aura.x) * 0.12 * dt;
      aura.y += (target.y - aura.y) * 0.12 * dt;
      stepSpring(auraSpring, targetAuraScale(), 0.12, 0.76, dt);
      if (auraRef.current) {
        auraRef.current.style.transform =
          `translate3d(${aura.x}px, ${aura.y}px, 0) translate(-50%, -50%) scale(${auraSpring.val})`;
      }

      // ---- anel ----
      ring.x += (target.x - ring.x) * 0.18 * dt;
      ring.y += (target.y - ring.y) * 0.18 * dt;
      stepSpring(ringSpring, targetRingScale(), 0.2, 0.7, dt);
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${ringSpring.val})`;
      }

      // ---- brackets ----
      bracket.x += (target.x - bracket.x) * 0.22 * dt;
      bracket.y += (target.y - bracket.y) * 0.22 * dt;
      bracketRot += (isPressed ? 4.5 : isHovering ? 2.4 : 0.4) * dt;

      stepSpring(gapSpring, targetGap(), 0.16, 0.7, dt);
      stepSpring(bSizeSpring, targetBracketSize(), 0.16, 0.7, dt);

      if (bracketRef.current) {
        bracketRef.current.style.transform =
          `translate3d(${bracket.x}px, ${bracket.y}px, 0) translate(-50%, -50%) rotate(${bracketRot}deg)`;
        bracketRef.current.style.setProperty('--gap', `${gapSpring.val}px`);
        bracketRef.current.style.setProperty('--bracket-size', `${bSizeSpring.val}px`);
      }

      // ---- partículas ----
      if (!reduced) {
        const pool = particlePool.current;
        const refs = particleRefs.current;
        for (let i = 0; i < pool.length; i++) {
          const p = pool[i];
          const el = refs[i];
          if (!el) continue;

          if (!p.active) {
            if (el.style.opacity !== '0') el.style.opacity = '0';
            continue;
          }

          p.life += dtMs;
          if (p.life >= p.maxLife) {
            p.active = false;
            el.style.opacity = '0';
            continue;
          }

          const friction = Math.pow(0.93, dt);
          p.vx *= friction;
          p.vy *= friction;
          p.vy += 0.035 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const t = p.life / p.maxLife;
          const opacity = 1 - t * t;
          const scale = (1 - t * 0.7) * (p.size / 2.4);

          el.style.transform =
            `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${scale})`;
          el.style.opacity = String(opacity);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('dragstart', onDragStart, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('contextmenu', onContextMenu);

    rafId = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove('has-custom-cursor');
      document.body.classList.remove('cursor-clicking');
      document.body.classList.remove('cursor-native');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('dragstart', onDragStart, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('contextmenu', onContextMenu);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    enabled,
    reduced,
    size,
    hoverDotSize,
    ringSize,
    hoverRingSize,
    bracketGap,
    hoverBracketGap,
    bracketSize,
    hoverBracketSize,
  ]);

  if (!enabled) return null;

  const alpha = (n) => {
    const v = Math.round(Math.min(1, Math.max(0, n)) * 255)
      .toString(16)
      .padStart(2, '0');
    return `${color}${v}`;
  };

  return (
    <>
      {!reduced &&
        Array.from({ length: PARTICLE_POOL }).map((_, i) => (
          <div
            key={`p${i}`}
            ref={(el) => {
              particleRefs.current[i] = el;
            }}
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color} 0%, ${alpha(0.55)} 45%, transparent 72%)`,
              boxShadow: `0 0 6px ${alpha(0.5)}`,
              pointerEvents: 'none',
              zIndex: 2147483643,
              opacity: 0,
              willChange: 'transform, opacity',
            }}
          />
        ))}

      {!reduced &&
        Array.from({ length: PULSE_POOL }).map((_, i) => (
          <div
            key={`pu${i}`}
            ref={(el) => {
              pulseRefs.current[i] = el;
            }}
            aria-hidden="true"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: ringSize,
              height: ringSize,
              borderRadius: '50%',
              border: `1.5px solid ${color}`,
              boxShadow: `0 0 10px ${alpha(0.5)}`,
              pointerEvents: 'none',
              zIndex: 2147483644,
              opacity: 0,
              willChange: 'transform, opacity',
            }}
          />
        ))}

      {/* aura difusa */}
      <div
        ref={auraRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: auraSize,
          height: auraSize,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(hovering ? 0.22 : 0.14)} 0%, ${alpha(
            hovering ? 0.08 : 0.05
          )} 42%, transparent 72%)`,
          filter: 'blur(8px)',
          pointerEvents: 'none',
          zIndex: 2147483642,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease-out, background 0.3s ease-out',
          willChange: 'transform, opacity',
          transform: 'translate3d(-300px, -300px, 0) translate(-50%, -50%)',
        }}
      />

      {/* anel */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          border: `1.5px solid ${alpha(hovering ? 0.95 : 0.8)}`,
          boxShadow: pressed
            ? `0 0 8px ${color}, 0 0 18px ${alpha(0.55)}, inset 0 0 8px ${alpha(0.55)}`
            : hovering
            ? `0 0 14px ${color}, 0 0 30px ${alpha(0.6)}, inset 0 0 8px ${alpha(0.5)}`
            : `0 0 7px ${color}, 0 0 16px ${alpha(0.45)}, inset 0 0 4px ${alpha(0.3)}`,
          background: hovering ? alpha(0.1) : 'transparent',
          pointerEvents: 'none',
          zIndex: 2147483645,
          opacity: visible ? 1 : 0,
          transition:
            'opacity 0.2s ease-out, background 0.25s ease-out, box-shadow 0.25s ease-out',
          willChange: 'transform',
          transform: 'translate3d(-300px, -300px, 0) translate(-50%, -50%)',
        }}
      />

      {/* brackets */}
      <div
        ref={bracketRef}
        aria-hidden="true"
        className="glowing-cursor-brackets"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: 2147483646,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
          willChange: 'transform',
          '--color': color,
          '--gap': `${bracketGap}px`,
          '--bracket-size': `${bracketSize}px`,
        }}
      >
        <span className="gc-bracket gc-bracket-tl" />
        <span className="gc-bracket gc-bracket-tr" />
        <span className="gc-bracket gc-bracket-br" />
        <span className="gc-bracket gc-bracket-bl" />
      </div>

      {/* dot central */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          boxShadow: pressed
            ? `0 0 4px ${color}, 0 0 10px ${color}, 0 0 18px ${alpha(0.7)}`
            : hovering
            ? `0 0 5px ${color}, 0 0 12px ${color}, 0 0 24px ${alpha(0.75)}`
            : `0 0 3px ${color}, 0 0 8px ${color}, 0 0 16px ${alpha(0.6)}`,
          pointerEvents: 'none',
          zIndex: 2147483647,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease-out, box-shadow 0.25s ease-out',
          willChange: 'transform',
          transform: 'translate3d(-300px, -300px, 0) translate(-50%, -50%)',
        }}
      />

      <style>{`
        body.has-custom-cursor,
        body.has-custom-cursor * {
          cursor: none !important;
        }

        /* menu de contexto / situações em que o cursor nativo é necessário */
        body.has-custom-cursor.cursor-native,
        body.has-custom-cursor.cursor-native * {
          cursor: auto !important;
        }

        /* evita o "fantasma" de drag em links e imagens */
        body.has-custom-cursor a,
        body.has-custom-cursor img {
          -webkit-user-drag: none;
        }

        body.has-custom-cursor.cursor-clicking .glowing-cursor-brackets {
          filter: brightness(1.45) saturate(1.15);
        }

        .glowing-cursor-brackets .gc-bracket {
          position: absolute;
          width: var(--bracket-size);
          height: var(--bracket-size);
          border-color: var(--color);
          border-style: solid;
          border-width: 0;
          border-radius: 2px;
          filter: drop-shadow(0 0 4px var(--color));
          transition: border-color 0.2s ease-out;
        }

        .gc-bracket-tl {
          top: calc(-1 * var(--gap));
          left: calc(-1 * var(--gap));
          transform: translate(-50%, -50%);
          border-top-width: 2px;
          border-left-width: 2px;
        }
        .gc-bracket-tr {
          top: calc(-1 * var(--gap));
          left: var(--gap);
          transform: translate(-50%, -50%);
          border-top-width: 2px;
          border-right-width: 2px;
        }
        .gc-bracket-br {
          top: var(--gap);
          left: var(--gap);
          transform: translate(-50%, -50%);
          border-bottom-width: 2px;
          border-right-width: 2px;
        }
        .gc-bracket-bl {
          top: var(--gap);
          left: calc(-1 * var(--gap));
          transform: translate(-50%, -50%);
          border-bottom-width: 2px;
          border-left-width: 2px;
        }

        @media (pointer: coarse), (hover: none) {
          body.has-custom-cursor,
          body.has-custom-cursor * {
            cursor: auto !important;
          }
          .glowing-cursor-brackets {
            display: none;
          }
        }
      `}</style>
    </>
  );
}