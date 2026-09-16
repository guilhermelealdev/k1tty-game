// src/components/KernelPanicScreen.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../state/GameContext.jsx';

/* ============================================================
   Dumps de kernel panic.
   - USER_PANIC: usuário apagou o sistema (rm -rf /)
   - MIAU_PANIC: a miau te odeia e destruiu tudo
   ============================================================ */

const COMMON_BOOT = [
  { text: '[    0.000000] Linux version 6.6.6-k1tty (root@k1tty) (gcc (GCC) 13.2.0) #1 SMP PREEMPT_DYNAMIC' },
  { text: '[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.6.6-k1tty root=UUID=deadbeef-cafe-1337-0000-000000000000 ro quiet' },
  { text: '[    0.000000] KERNEL supported cpus:' },
  { text: '[    0.000000]   Intel GenuineIntel' },
  { text: '[    0.000000]   AMD AuthenticAMD' },
  { text: '[    0.000000]   Hygon HygonGenuine' },
  { text: "[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'" },
  { text: "[    0.000000] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'" },
  { text: "[    0.000000] x86/fpu: Supporting XSAVE feature 0x004: 'AVX registers'" },
  { text: '[    0.000000] x86/fpu: xstate_offset[2]:  576, xstate_sizes[2]:  256' },
  { text: '' },
  { text: '[    0.000000] BIOS-provided physical RAM map:' },
  { text: '[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable' },
  { text: '[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x00000000bffdffff] usable' },
  { text: '[    0.000000] BIOS-e820: [mem 0x00000000bffe0000-0x00000000bfffffff] reserved' },
  { text: '[    0.000000] NX (Execute Disable) protection: active' },
  { text: '[    0.000000] SMBIOS 3.0.0 present.' },
  { text: '' },
  { text: '[    0.512301] Freeing SMP alternatives memory: 48K' },
  { text: '[    0.623482] pid_max: default: 32768 minimum: 301' },
  { text: '[    0.752119] Mount-cache hash table entries: 8192 (order: 4, 65536 bytes, linear)' },
  { text: '[    0.892401] ... (boot log truncated) ...' },
  { text: '' },
  { text: '[   14.220912] k1tty: terminal initialized' },
  { text: '[   14.221500] k1tty: user session for user "k1tty" established' },
  { text: '[   14.350221] k1tty: theme="neon" applied' },
  { text: '[   14.501883] k1tty: filesystem mounted (read-write)' },
  { text: '[   14.700442] k1tty: wifi daemon ready (offline)' },
  { text: '' },
];

const USER_PANIC = [
  ...COMMON_BOOT,
  { text: '[  142.001241] gato: warning - user running suspicious commands' },
  { text: '[  142.450118] gato: CRITICAL - filesystem integrity compromised' },
  { text: '[  142.450911] gato: triggering protective shutdown' },
  { text: '' },
  { text: '[  142.451200] BUG: unable to handle kernel NULL pointer dereference at 0000000000000000', color: '#ffffff', bold: true },
  { text: '[  142.451201] PGD 0 P4D 0', color: '#ffffff' },
  { text: '[  142.451202] Oops: 0002 [#1] SMP NOPTI', color: '#ffffff', bold: true },
  { text: '[  142.451203] CPU: 0 PID: 1337 Comm: k1tty Not tainted 6.6.6-k1tty #1' },
  { text: '[  142.451204] Hardware name: k1tty Systems k1tty/1.0, BIOS 1.0.4 04/01/1998' },
  { text: '[  142.451205] RIP: 0010:k1tty_survive+0x42/0x100' },
  { text: '[  142.451206] Code: 48 89 e5 48 83 ec 20 48 c7 45 f8 00 00 00 00 48 8b 45 f8 48 89 c7 e8 <ff> ff ff ff 48 8b 45 f0 c9 c3' },
  { text: '[  142.451207] RSP: 0018:ffffb8f2c07d3c28 EFLAGS: 00010246' },
  { text: '[  142.451208] RAX: 0000000000000000 RBX: ffff8e2c07d3c000 RCX: 0000000000000000' },
  { text: '[  142.451209] RDX: 0000000000000000 RSI: 0000000000000000 RDI: ffff8e2c07d3c000' },
  { text: '[  142.451210] RBP: ffffb8f2c07d3c80 R08: 0000000000000000 R09: 0000000000000000' },
  { text: '[  142.451211] R10: 0000000000000000 R11: 0000000000000000 R12: 0000000000000000' },
  { text: '[  142.451212] R13: 0000000000000000 R14: 0000000000000000 R15: 0000000000000000' },
  { text: '[  142.451213] FS:  00007f3c2c3f7740(0000) GS:ffff8e2c3dc00000(0000) knlGS:0000000000000000' },
  { text: '[  142.451214] CS:  0010 DS: 0000 ES: 0000 CR0: 0000000080050033' },
  { text: '[  142.451215] CR2: 0000000000000000 CR3: 0000000107c3a000 CR4: 00000000000006f0' },
  { text: '' },
  { text: '[  142.451216] Call Trace:', color: '#ffffff', bold: true },
  { text: '[  142.451217]  <TASK>' },
  { text: '[  142.451218]  dump_stack_lvl+0x1c/0x2a' },
  { text: '[  142.451219]  panic+0x11f/0x2e0' },
  { text: '[  142.451220]  k1tty_survive+0x42/0x100' },
  { text: '[  142.451221]  do_syscall_64+0x5c/0x90' },
  { text: '[  142.451222]  entry_SYSCALL_64_after_hwframe+0x6e/0xd0' },
  { text: '[  142.451223]  </TASK>' },
  { text: '' },
  { text: '[  142.451224] Modules linked in: gato ronronar meow brinquedo caixa_de_papelao' },
  { text: '[  142.451225] ---[ end trace 0000000000000000 ]---' },
  { text: '' },
  { text: '[  142.451300] Kernel panic - not syncing: k1tty: usuário apagou o sistema', color: '#ffffff', bold: true },
  { text: '[  142.451301] CPU: 0 PID: 1337 Comm: k1tty Not tainted 6.6.6-k1tty #1' },
  { text: '[  142.451302] Hardware name: k1tty Systems k1tty/1.0, BIOS 1.0.4 04/01/1998' },
  { text: '[  142.451303] Call Trace:' },
  { text: '[  142.451304]  <TASK>' },
  { text: '[  142.451305]  dump_stack_lvl+0x1c/0x2a' },
  { text: '[  142.451306]  panic+0x11f/0x2e0' },
  { text: '[  142.451307]  </TASK>' },
  { text: '[  142.451308] ---[ end Kernel panic - not syncing: k1tty: usuário apagou o sistema ]---', color: '#ffffff', bold: true },
  { text: '' },
  { text: '[  142.451400] hardware watchdog: resetting system in 30s...' },
  { text: '[  142.451500] k1tty: save preserved. see you on the other side.' },
  { text: '' },
];

const MIAU_PANIC = [
  ...COMMON_BOOT,
  { text: '[  142.001241] miau: info - user response received' },
  { text: '[  142.201488] miau: warning - escalating privileges' },
  { text: '[  142.301022] miau: WARN - user crossed emotional threshold' },
  { text: '[  142.440918] miau: CRITICAL - initiating assimilation protocol' },
  { text: '[  142.450611] miau: overwriting filesystem inodes (0/4096)' },
  { text: '[  142.450811] miau: overwriting filesystem inodes (1834/4096)' },
  { text: '[  142.450911] miau: overwriting filesystem inodes (4096/4096)' },
  { text: '[  142.451012] miau: filesystem compromised' },
  { text: '' },
  { text: '[  142.451100] general protection fault, probably for non-canonical address 0x6d6961756d696175: 0000 [#1] SMP NOPTI', color: '#ffffff', bold: true },
  { text: '[  142.451101] KASAN: maybe wild-memory-access in range [0x6d6961756d696000-0x6d6961756d696fff]', color: '#ffffff' },
  { text: '[  142.451102] CPU: 0 PID: 0 Comm: miau Tainted: G      D W  6.6.6-k1tty #1' },
  { text: '[  142.451103] Tainted: [D]=DIE, [W]=WARN' },
  { text: '[  142.451104] Hardware name: k1tty Systems k1tty/1.0, BIOS 1.0.4 04/01/1998' },
  { text: '[  142.451105] RIP: 0010:miau_assimilate+0x69/0x666' },
  { text: '[  142.451106] Code: c5 33 00 00 48 89 e5 48 81 ec 66 06 00 00 48 c7 c0 69 69 69 69 <ff> ff ff ff ff ff ff ff ff ff ff ff' },
  { text: '[  142.451107] RSP: 0018:ffffb8f2c07d3c28 EFLAGS: 00010246' },
  { text: '[  142.451108] RAX: 0000000000000000 RBX: 0000000000000000 RCX: 0000000000000666' },
  { text: '[  142.451109] RDX: 6d6961756d696175 RSI: 0000000000001337 RDI: 0000000000000000' },
  { text: '[  142.451110] RBP: ffffb8f2c07d3c80 R08: deadbeefdeadbeef R09: cafebabecafebabe' },
  { text: '[  142.451111] R10: 00000000cafebabe R11: 00000000deadbeef R12: ffff8e2c07d3c000' },
  { text: '[  142.451112] R13: 0000000000000000 R14: 0000000000000000 R15: 0000000000000000' },
  { text: '[  142.451113] FS:  0000000000000000(0000) GS:ffff8e2c3dc00000(0000) knlGS:0000000000000000' },
  { text: '[  142.451114] CS:  0010 DS: 0000 ES: 0000 CR0: 0000000080050033' },
  { text: '[  142.451115] CR2: 6d6961756d696175 CR3: 0000000000000000 CR4: 00000000000006f0' },
  { text: '' },
  { text: '[  142.451116] Call Trace:', color: '#ffffff', bold: true },
  { text: '[  142.451117]  <TASK>' },
  { text: '[  142.451118]  dump_stack_lvl+0x1c/0x2a' },
  { text: '[  142.451119]  panic+0x11f/0x2e0' },
  { text: '[  142.451120]  miau_assimilate+0x69/0x666' },
  { text: '[  142.451121]  miau_destroy_filesystem+0x13/0x13' },
  { text: '[  142.451122]  do_syscall_64+0x5c/0x90' },
  { text: '[  142.451123]  entry_SYSCALL_64_after_hwframe+0x6e/0xd0' },
  { text: '[  142.451124]  </TASK>' },
  { text: '' },
  { text: '[  142.451125] Modules linked in: miau gato ronronar meow brinquedo caixa_de_papelao' },
  { text: '[  142.451126] ---[ cut here ]---' },
  { text: '' },
  { text: '[  142.451200] Kernel panic - not syncing: miau: você me deixou brava', color: '#ffffff', bold: true },
  { text: '[  142.451201] CPU: 0 PID: 0 Comm: miau Tainted: G      D W  6.6.6-k1tty #1' },
  { text: '[  142.451202] Hardware name: k1tty Systems k1tty/1.0, BIOS 1.0.4 04/01/1998' },
  { text: '[  142.451203] Call Trace:' },
  { text: '[  142.451204]  <TASK>' },
  { text: '[  142.451205]  dump_stack_lvl+0x1c/0x2a' },
  { text: '[  142.451206]  panic+0x11f/0x2e0' },
  { text: '[  142.451207]  </TASK>' },
  { text: '[  142.451208] ---[ end Kernel panic - not syncing: miau: você me deixou brava ]---', color: '#ffffff', bold: true },
  { text: '' },
  { text: '[  142.451300] hardware watchdog: resetting system in 30s...' },
  { text: '[  142.451400] miau: eu ainda estou aqui.', color: '#cba6f7', bold: true },
  { text: '[  142.451500] miau: save preserved. só desta vez.', color: '#cba6f7' },
  { text: '' },
];

const LINE_DELAY = 38;
const INITIAL_DELAY = 350;
const BUTTON_DELAY = 1400;

export default function KernelPanicScreen() {
  const { state, dispatch } = useGame();

  const isMiau = state.flags?.corruptedBy === 'miau';
  const PANIC_LINES = isMiau ? MIAU_PANIC : USER_PANIC;

  const [visibleCount, setVisibleCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [blink, setBlink] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= PANIC_LINES.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, LINE_DELAY);
    }, INITIAL_DELAY);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [PANIC_LINES.length]);

  useEffect(() => {
    if (visibleCount < PANIC_LINES.length) return;
    const t = setTimeout(() => setShowButton(true), BUTTON_DELAY);
    return () => clearTimeout(t);
  }, [visibleCount, PANIC_LINES.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!showButton) return;
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dispatch({ type: 'REBOOT_FORCE' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showButton, dispatch]);

  const handleReboot = useCallback(() => {
    dispatch({ type: 'REBOOT_FORCE' });
  }, [dispatch]);

  const finished = visibleCount >= PANIC_LINES.length;
  const accentColor = isMiau ? '#cba6f7' : '#c0c0c0';

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      color: '#c0c0c0',
      fontFamily: 'Fira Code, monospace',
      fontSize: '12px',
      lineHeight: 1.5,
      padding: '16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)',
        zIndex: 2,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        zIndex: 2,
      }} />

      <div
        ref={scrollRef}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          position: 'relative',
          zIndex: 1,
          paddingRight: '8px',
        }}
      >
        {PANIC_LINES.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            style={{
              color: line.color || '#c0c0c0',
              fontWeight: line.bold ? 'bold' : 'normal',
            }}
          >
            {line.text}
          </div>
        ))}

        {finished && (
          <div style={{ marginTop: '8px' }}>
            <span style={{ color: accentColor }}>
              {isMiau ? 'miau@k1tty:~$' : 'k1tty@panic:~$'}
            </span>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '1em',
              background: accentColor,
              verticalAlign: 'text-bottom',
              marginLeft: '6px',
              opacity: blink ? 1 : 0,
              transition: 'opacity 0.1s',
            }} />
          </div>
        )}
      </div>

      {showButton && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '6px',
          animation: 'panic-fade-in 0.6s ease-out',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#606060',
            letterSpacing: '1px',
          }}>
            pressione [ENTER] ou clique abaixo
          </div>
          <button
            onClick={handleReboot}
            style={{
              background: 'transparent',
              border: `1px solid ${isMiau ? '#cba6f7' : '#808080'}`,
              color: accentColor,
              fontFamily: 'Fira Code, monospace',
              fontSize: '12px',
              padding: '6px 16px',
              cursor: 'pointer',
              letterSpacing: '1px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = accentColor;
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = accentColor;
            }}
          >
            [ reboot ]
          </button>
        </div>
      )}

      <style>{`
        @keyframes panic-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}