// src/state/GameContext.jsx

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  generateSudoPassword,
  getInitialFilesystem,
  getInitialState,
} from '../filesystem/initialData.js';
import { deepClone, getNodeByPath } from '../utils/helpers.js';
import { DEFAULT_THEME_ID } from '../data/themes.js';

const GameContext = createContext(null);
const MAX_SNAPSHOTS = 5;

/* ============================================================
   Configuração de janelas
   ============================================================ */
const UNIQUE_WINDOW_TYPES = new Set([
  'nvim', 'apt-cli', 'apt', 'bluetooth', 'notes', 'miau-vn', 'vn', 'miau-terminal',
]);

const WINDOW_PREFERRED_SIZES = {
  meow:            { width: 520, height: 460 },
  kitty:           { width: 520, height: 460 },
  web:             { width: 620, height: 520 },
  lens:            { width: 580, height: 460 },
  nvim:            { width: 560, height: 440 },
  tutorial:        { width: 540, height: 460 },
  admin:           { width: 540, height: 540 },
  matrix:          { width: 560, height: 420 },
  btop:            { width: 540, height: 460 },
  mp3player:       { width: 480, height: 440 },
  audioview:       { width: 540, height: 400 },
  bonsai:          { width: 400, height: 460 },
  catrun:          { width: 620, height: 420 },
  ram:             { width: 460, height: 480 },
  k1tty:           { width: 460, height: 400 },
  opsec:           { width: 560, height: 480 },
  bluetooth:       { width: 460, height: 460 },
  whoisthis:       { width: 540, height: 460 },
  credits:         { width: 620, height: 480 },
  notes:           { width: 500, height: 420 },
  'apt-cli':       { width: 580, height: 480 },
  kittens:         { width: 540, height: 520 },
  achievements:    { width: 540, height: 520 },
  'miau-vn':       { width: 640, height: 520 },
  'miau-warning':  { width: 320, height: 180 },
  'miau-terminal': { width: 600, height: 420 },
};

const DEFAULT_WINDOW_SIZE = { width: 500, height: 350 };

function getPreferredSize(type) {
  return WINDOW_PREFERRED_SIZES[type] || DEFAULT_WINDOW_SIZE;
}

function getWindowPosition(preferredSize, existingCount, vw, vh) {
  const { width, height } = preferredSize;
  const cascadeOffset = (existingCount % 5) * 24;
  const centeredX = Math.max(20, (vw - width) / 2);
  const centeredY = Math.max(20, (vh - height) / 2);

  let x = centeredX + cascadeOffset;
  let y = centeredY + cascadeOffset;

  x = Math.min(x, Math.max(20, vw - width - 20));
  y = Math.min(y, Math.max(20, vh - height - 20));

  return { x, y, width, height };
}

/* ============================================================
   localStorage de slots (limpeza auxiliar)
   ============================================================ */
function clearSlotAuxData(slot) {
  try {
    localStorage.removeItem(`k1tty_clicker_${slot}`);
    localStorage.removeItem(`k1tty_clicker_mute_${slot}`);
  } catch (e) { /* ignora */ }
}

/* ============================================================
   IDs de janela
   ============================================================ */
let windowIdCounter = 1000;
function generateWindowId() {
  return `window_${++windowIdCounter}`;
}

/* ============================================================
   Stats iniciais — shape ÚNICO usado em todo o app
   ============================================================ */
const INITIAL_STATS = {
  commandsRun: 0,
  filesRead: [],
  tracksPlayed: [],
  catPhotosSeen: [],
  themesUsed: [],
  dirsVisited: [],
  filesCreated: 0,
  dirsCreated: 0,
  filesDeleted: 0,
  filesRenamed: 0,
  catrunGames: 0,
  catrunDeaths: 0,
  snapshotsMade: 0,
  pokemonSeen: [],
};

/* ============================================================
   Serialização de save
   ============================================================ */
function buildSavePayload(state, slot, overrides = {}) {
  return deepClone({
    filesystem: state.filesystem,
    currentDirectory: state.currentDirectory,
    history: state.history,
    sudoPassword: state.sudoPassword,
    wifiConnected: state.wifiConnected,
    wifiName: state.wifiName,
    wifiPassword: state.wifiPassword,
    installedPackages: state.installedPackages,
    progress: state.progress,
    flags: state.flags,
    tutorialCompleted: state.tutorialCompleted,
    currentSave: slot,
    theme: state.theme,
    stats: state.stats,
    unlockedAchievements: state.unlockedAchievements,
    seenEndings: state.seenEndings || [],
    ...overrides,
  });
}

/* ============================================================
   Helper: salva o state atual no slot, sem dispatch
   (usado pelos finais antes de voltar pra SaveSelect)
   ============================================================ */
function persistCurrentSave(state, overrides = {}) {
  if (state.currentSave === null) return;
  if (state.systemCorrupted) return;
  try {
    const saves = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
    saves[state.currentSave] = buildSavePayload(state, state.currentSave, overrides);
    localStorage.setItem('k1tty_saves', JSON.stringify(saves));
  } catch (e) {
    console.warn('[k1tty] falha ao salvar antes do final:', e.message);
  }
}

/* ============================================================
   Letras das faixas (.meow) — entregues via Bluetooth
   ============================================================ */
const TRACKS_CONTENT = {
  'lyric_1.meow':
`════════════════════════════════════
  ♫ ♪ ♫  TRACK 01 — lofi cat beats  ♫ ♪ ♫
════════════════════════════════════

Vozes sobem pela noite,
como fumaça em espiral.

T

Through the wires, through the static,
something answers when I call.

As notas caem como chuva
sobre a cidade digital.

════════════════════════════════════`,

  'lyric_2.meow':
`════════════════════════════════════
  ♫ ♪ ♫  TRACK 02 — midnight meow   ♫ ♪ ♫
════════════════════════════════════

A lua fica mais alta,
e o mundo fica menor.

O

Nada é o que parece ser,
nem o gato, nem a dor.

Cada nota é uma promessa
que eu não vou cumprir.

════════════════════════════════════`,

  'lyric_3.meow':
`════════════════════════════════════
  ♫ ♪ ♫  TRACK 03 — whisker symphony ♫ ♪ ♫
════════════════════════════════════

Sob a cidade adormecida,
o silêncio se desdobra.

K

Toda palavra não dita
é uma memória que sobra.

Eu escrevo para não esquecer,
você lê para não lembrar.

════════════════════════════════════`,

  'lyric_4.meow':
`════════════════════════════════════
  ♫ ♪ ♫  TRACK 04 — digital catnip  ♫ ♪ ♫
════════════════════════════════════

Alguém canta em algum lugar,
uma canção que nunca acaba.

E

Em cada byte, uma lembrança.
Em cada pausa, uma estrada.

O que resta de mim
está gravado nesse sinal.

════════════════════════════════════`,

  'lyric_5.meow':
`════════════════════════════════════
  ♫ ♪ ♫  TRACK 05 — cosmic purr     ♫ ♪ ♫
════════════════════════════════════

O tempo dobra sobre si mesmo,
e nada mais tem sentido.

N

Nenhuma voz te responde agora,
mas o sinal ainda está vivo.

Se você chegou até aqui,
já sabe o que fazer.

════════════════════════════════════`,
};

/* ============================================================
   Reducer principal
   ============================================================ */
function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_SAVE': {
      const { slot, skipTutorial } = action.payload;
      clearSlotAuxData(slot);

      const newState = getInitialState(slot, skipTutorial);

      if (!skipTutorial) {
        const id = generateWindowId();
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const pos = getWindowPosition({ width: 540, height: 460 }, 0, vw, vh);
        newState.openWindows = [{ id, type: 'tutorial' }];
        newState.windowPositions = { [id]: pos };
        newState.installedPackages = ['tutorial'];
      }

      newState.stats = { ...deepClone(INITIAL_STATS), ...(newState.stats || {}) };
      newState.theme = newState.theme || DEFAULT_THEME_ID;

      return newState;
    }

    case 'LOAD_SLOT': {
      const { payload } = action;
      const saves = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
      const saveData = saves[payload];
      if (!saveData) return state;

      if (!saveData.filesystem || saveData.filesystem.type !== 'dir') {
        console.warn('[k1tty] save incompleto detectado, ignorando load:', payload);
        return state;
      }

      return {
        ...saveData,
        currentDirectory: saveData.currentDirectory || '/home/k1tty',
        history: saveData.history || [],
        installedPackages: saveData.installedPackages || [],
        flags: saveData.flags || {},
        stats: { ...deepClone(INITIAL_STATS), ...(saveData.stats || {}) },
        unlockedAchievements: saveData.unlockedAchievements || [],
        seenEndings: saveData.seenEndings || [],
        currentSave: payload,
        openWindows: [],
        windowPositions: {},
        snapshots: [],
        snapshotError: null,
        tutorialCompleted: saveData.tutorialCompleted || false,
        systemCorrupted: false,
        finaleActive: false,
        miauFinaleActive: false,
        osSwitchActive: false,
        theme: saveData.theme || DEFAULT_THEME_ID,
        pendingUnlocks: [],
        apiCache: saveData.apiCache || {},
      };
    }

    case 'DELETE_SAVE': {
      const slot = action.payload;
      const saves = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
      delete saves[slot];
      localStorage.setItem('k1tty_saves', JSON.stringify(saves));
      clearSlotAuxData(slot);
      return state;
    }

    case 'UPDATE_FILESYSTEM':    return { ...state, filesystem: action.payload };
    case 'CHANGE_DIRECTORY':     return { ...state, currentDirectory: action.payload };
    case 'CLEAR_HISTORY':        return { ...state, history: [] };
    case 'SET_SUDO_PASSWORD':    return { ...state, sudoPassword: action.payload };
    case 'SET_WIFI_CONNECTED':   return { ...state, wifiConnected: action.payload };
    case 'SET_WIFI_NAME':        return { ...state, wifiName: action.payload };
    case 'SET_WIFI_PASSWORD':    return { ...state, wifiPassword: action.payload };
    case 'SET_THEME':            return { ...state, theme: action.payload };
    case 'SET_TUTORIAL_COMPLETED': return { ...state, tutorialCompleted: action.payload };

    case 'ADD_HISTORY': {
      return { ...state, history: [...state.history, action.payload] };
    }

    case 'SET_FLAG': {
      return { ...state, flags: { ...state.flags, [action.payload.flag]: action.payload.value } };
    }

    case 'INSTALL_PACKAGE': {
      if (state.installedPackages.includes(action.payload)) return state;
      return { ...state, installedPackages: [...state.installedPackages, action.payload] };
    }

    /* Instala vários pacotes numa única dispatch (admin panel) */
    case 'INSTALL_ALL_PACKAGES': {
      const toInstall = action.payload || [];
      const merged = Array.from(new Set([...state.installedPackages, ...toInstall]));
      return { ...state, installedPackages: merged };
    }

    case 'REMOVE_PACKAGE': {
      return {
        ...state,
        installedPackages: state.installedPackages.filter((p) => p !== action.payload),
      };
    }

    case 'SET_IMAGE_URLS': {
      const newFilesystem = deepClone(state.filesystem);
      for (const { path, url } of action.payload) {
        const node = getNodeByPath(newFilesystem, path);
        if (node && node.type === 'file' && node.isImage) node.imageUrl = url;
      }
      return { ...state, filesystem: newFilesystem };
    }

    case 'SET_API_CACHE': {
      return {
        ...state,
        apiCache: { ...(state.apiCache || {}), ...action.payload },
      };
    }

    case 'INSTALL_DOWNLOAD': {
      const { filename, content } = action.payload;
      const newFilesystem = deepClone(state.filesystem);
      const homeNode = getNodeByPath(newFilesystem, '/home/k1tty');
      if (!homeNode) return state;

      if (!homeNode.children['Downloads']) {
        homeNode.children['Downloads'] = {
          name: 'Downloads', type: 'dir', content: null,
          permissions: 'rwxr-xr-x', owner: 'k1tty',
          hidden: false, locked: false, password: null,
          size: 4096, lastModified: new Date().toISOString(),
          children: {},
        };
      }

      const now = new Date().toISOString();
      homeNode.children['Downloads'].children[filename] = {
        name: filename, type: 'file', content,
        permissions: 'rw-r--r--', owner: 'k1tty',
        hidden: false, locked: false, password: null,
        size: content.length, lastModified: now, userCreated: true,
      };
      return { ...state, filesystem: newFilesystem };
    }

    case 'RECEIVE_PHONE_FILES': {
      const newFilesystem = deepClone(state.filesystem);
      const homeNode = getNodeByPath(newFilesystem, '/home/k1tty');
      if (!homeNode) return state;
      if (homeNode.children['from_phone']) return state;

      const now = new Date().toISOString();
      const lyricChildren = {};
      Object.entries(TRACKS_CONTENT).forEach(([name, content]) => {
        lyricChildren[name] = {
          name, type: 'file', content,
          permissions: 'rw-r--r--', owner: 'k1tty',
          hidden: false, locked: false, password: null,
          size: content.length, lastModified: now, userCreated: true,
        };
      });

      homeNode.children['from_phone'] = {
        name: 'from_phone', type: 'dir', content: null,
        permissions: 'rwxr-xr-x', owner: 'k1tty',
        hidden: false, locked: false, password: null,
        size: 4096, lastModified: now,
        children: {
          ...lyricChildren,
          'Music_Locked': {
            name: 'Music_Locked', type: 'dir', content: null,
            permissions: 'rwx------', owner: 'k1tty',
            hidden: false, locked: true, password: 'TOKEN',
            size: 4096, lastModified: now,
            children: {
              'music_pack.zip': {
                name: 'music_pack.zip', type: 'file',
                content: 'BINARY_ZIP_MUSIC_PACK',
                permissions: 'rw-------', owner: 'k1tty',
                hidden: false, locked: false, password: null,
                size: 12_400_000, lastModified: now, userCreated: true,
              },
            },
          },
        },
      };

      return {
        ...state,
        filesystem: newFilesystem,
        flags: { ...state.flags, pairedPhone: true },
      };
    }

    case 'INSTALL_MIAU_VN': {
      const newFilesystem = deepClone(state.filesystem);
      const homeNode = getNodeByPath(newFilesystem, '/home/k1tty');
      if (!homeNode) return state;

      const now = new Date().toISOString();

      if (!homeNode.children['Games']) {
        homeNode.children['Games'] = {
          name: 'Games', type: 'dir', content: null,
          permissions: 'rwxr-xr-x', owner: 'k1tty',
          hidden: false, locked: false, password: null,
          size: 4096, lastModified: now,
          children: {},
        };
      }

      homeNode.children['Games'].children['miau-vn'] = {
        name: 'miau-vn', type: 'file',
        content: 'BINARY_EXECUTABLE_MIAU_VN',
        permissions: 'rwxr-xr-x', owner: 'k1tty',
        hidden: false, locked: false, password: null,
        size: 12_500_000, lastModified: now, userCreated: true,
      };

      homeNode.children['Games'].children['readme.txt'] = {
        name: 'readme.txt', type: 'file',
        content:
`miau-vn — versão 0.3 beta
─────────────────────────

Obrigada por baixar!

Pra abrir o jogo, digite no terminal:

  $ miau-vn

Aviso: a miau tem uma barra de humor.
Não a deixe chegar a 100%.

Boa sorte.`,
        permissions: 'rw-r--r--', owner: 'k1tty',
        hidden: false, locked: false, password: null,
        size: 220, lastModified: now, userCreated: true,
      };

      return {
        ...state,
        filesystem: newFilesystem,
        flags: { ...state.flags, miauVnInstalled: true },
      };
    }

    case 'EXTRACT_MUSIC': {
      const newFilesystem = deepClone(state.filesystem);
      const musicNode = getNodeByPath(newFilesystem, '/home/k1tty/Music');
      if (!musicNode) return state;

      const now = new Date().toISOString();

      const tracks = [
        {
          name: 'Back 2 Back.mp3',
          size: 4_234_567,
          meta: {
            title: 'Back 2 Back',
            artist: 'k1tty',
            album: 'Recovered Tracks',
            location: 'P1:C5',
            format: 'mp3 · 320kbps · 44.1kHz',
          },
        },
        {
          name: 'Children of the City.mp3',
          size: 3_876_543,
          meta: {
            title: 'Children of the City',
            artist: 'k1tty',
            album: 'Recovered Tracks',
            location: 'P2:C9',
            format: 'mp3 · 320kbps · 44.1kHz',
          },
        },
        {
          name: 'RUNAWAY.mp3',
          size: 4_567_890,
          meta: {
            title: 'RUNAWAY',
            artist: 'k1tty',
            album: 'Recovered Tracks',
            location: 'P3:C3',
            format: 'mp3 · 320kbps · 44.1kHz',
          },
        },
        {
          name: 'You_re A Big Girl Now.mp3',
          size: 4_123_456,
          meta: {
            title: "You're A Big Girl Now",
            artist: 'k1tty',
            album: 'Recovered Tracks',
            location: 'P4:C12',
            format: 'mp3 · 320kbps · 44.1kHz',
          },
        },
      ];

      tracks.forEach((t) => {
        musicNode.children[t.name] = {
          name: t.name,
          type: 'file',
          content: `AUDIO_DATA_${t.name}`,
          permissions: 'rw-r--r--',
          owner: 'k1tty',
          hidden: false,
          locked: false,
          password: null,
          size: t.size,
          lastModified: now,
          userCreated: true,
          isMusic: true,
          meta: t.meta,
        };
      });

      return { ...state, filesystem: newFilesystem };
    }

    case 'EXTRACT_CAT_PHOTOS': {
      const newFilesystem = deepClone(state.filesystem);
      const secretNode = getNodeByPath(newFilesystem, '/root/secret');
      if (!secretNode) return state;

      const now = new Date().toISOString();
      secretNode.children['cats'] = {
        name: 'cats', type: 'dir', content: null,
        permissions: 'rwxr-xr-x', owner: 'root',
        hidden: false, locked: false, password: null,
        size: 4096, lastModified: now,
        children: Object.fromEntries(
          Array.from({ length: 20 }).map((_, i) => [
            `cat_${String(i + 1).padStart(2, '0')}.webp`,
            {
              name: `cat_${String(i + 1).padStart(2, '0')}.webp`,
              type: 'file',
              content: `BINARY_CAT_${i + 1}`,
              permissions: 'rw-r--r--',
              owner: 'root',
              hidden: false,
              locked: false,
              password: null,
              size: 85000 + i * 1200,
              lastModified: now,
              userCreated: true,
              isImage: true,
              imageUrl: null,
            },
          ])
        ),
      };

      secretNode.children['final.txt'] = {
        name: 'final.txt',
        type: 'file',
        content:
`Obrigado, k1tty.

Você recuperou o que eu perdi.
Todas as 20 fotos dos meus gatos estão aqui novamente,
e nada mais pode apagá-las.

Se você chegou até aqui, você entendeu.
O sistema não é um lugar — é uma memória.
E memórias só morrem quando ninguém mais se lembra.

Você se lembrou.

Agora, execute 'victory' para ver o final.

— k1tty`,
        permissions: 'rw-r--r--',
        owner: 'root',
        hidden: false,
        locked: false,
        password: null,
        size: 400,
        lastModified: now,
        userCreated: true,
      };

      return {
        ...state,
        filesystem: newFilesystem,
        flags: { ...state.flags, finalUnlocked: true },
      };
    }

    case 'OPEN_WINDOW': {
      let windowType, explicitPosition;
      if (typeof action.payload === 'string') {
        windowType = action.payload;
        explicitPosition = null;
      } else {
        windowType = action.payload?.type;
        explicitPosition = action.payload?.position || null;
      }

      if (!windowType) return state;

      if (UNIQUE_WINDOW_TYPES.has(windowType)) {
        const existing = state.openWindows.find((w) => w.type === windowType);
        if (existing) {
          const newOpenWindows = state.openWindows.filter((w) => w.id !== existing.id);
          newOpenWindows.push(existing);
          return { ...state, openWindows: newOpenWindows };
        }
      }

      const newWindowId = generateWindowId();
      const windowPositions = state.windowPositions || {};
      const count = state.openWindows.length;

      let newPosition;
      if (explicitPosition) {
        newPosition = explicitPosition;
      } else {
        const preferred = getPreferredSize(windowType);
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        newPosition = getWindowPosition(preferred, count, vw, vh);
      }

      return {
        ...state,
        openWindows: [...state.openWindows, { id: newWindowId, type: windowType }],
        windowPositions: {
          ...windowPositions,
          [newWindowId]: newPosition,
        },
      };
    }

    case 'CLOSE_WINDOW': {
      const windowId = action.payload;
      const windowPositions = { ...state.windowPositions };
      delete windowPositions[windowId];
      return {
        ...state,
        openWindows: state.openWindows.filter((w) => w.id !== windowId),
        windowPositions,
      };
    }

    case 'FOCUS_WINDOW': {
      const windowId = action.payload;
      const window = state.openWindows.find((w) => w.id === windowId);
      if (!window) return state;
      const newOpenWindows = state.openWindows.filter((w) => w.id !== windowId);
      newOpenWindows.push(window);
      return { ...state, openWindows: newOpenWindows };
    }

    case 'MOVE_WINDOW': {
      const { id, position } = action.payload;
      return {
        ...state,
        windowPositions: {
          ...(state.windowPositions || {}),
          [id]: { ...(state.windowPositions?.[id] || {}), ...position },
        },
      };
    }

    case 'RESIZE_WINDOW': {
      const { id, size } = action.payload;
      return {
        ...state,
        windowPositions: {
          ...(state.windowPositions || {}),
          [id]: { ...(state.windowPositions?.[id] || {}), ...size },
        },
      };
    }

    case 'SAVE_SNAPSHOT': {
      if (state.snapshots.length >= MAX_SNAPSHOTS) {
        return { ...state, snapshotError: 'Máximo de snapshots atingido' };
      }
      const snap = deepClone({
        filesystem: state.filesystem,
        currentDirectory: state.currentDirectory,
        sudoPassword: state.sudoPassword,
        wifiConnected: state.wifiConnected,
        wifiName: state.wifiName,
        wifiPassword: state.wifiPassword,
        installedPackages: state.installedPackages,
        progress: state.progress,
        flags: state.flags,
        tutorialCompleted: state.tutorialCompleted,
        theme: state.theme,
        stats: state.stats,
      });
      return { ...state, snapshots: [...state.snapshots, snap], snapshotError: null };
    }

    case 'LOAD_SNAPSHOT': {
      const i = action.payload;
      if (i < 0 || i >= state.snapshots.length) {
        return { ...state, snapshotError: 'Snapshot inválida' };
      }
      const snap = state.snapshots[i];
      const reverted = deepClone({
        filesystem: state.filesystem,
        currentDirectory: state.currentDirectory,
        sudoPassword: state.sudoPassword,
        wifiConnected: state.wifiConnected,
        wifiName: state.wifiName,
        wifiPassword: state.wifiPassword,
        installedPackages: state.installedPackages,
        progress: state.progress,
        flags: state.flags,
        tutorialCompleted: state.tutorialCompleted,
        theme: state.theme,
        stats: state.stats,
      });
      const newSnapshots = [...state.snapshots];
      newSnapshots[i] = reverted;
      return {
        ...state,
        filesystem: deepClone(snap.filesystem),
        currentDirectory: snap.currentDirectory,
        sudoPassword: snap.sudoPassword,
        wifiConnected: snap.wifiConnected,
        wifiName: snap.wifiName,
        wifiPassword: snap.wifiPassword,
        installedPackages: [...snap.installedPackages],
        progress: snap.progress,
        flags: { ...snap.flags },
        tutorialCompleted: snap.tutorialCompleted,
        theme: snap.theme || DEFAULT_THEME_ID,
        stats: snap.stats || deepClone(INITIAL_STATS),
        snapshots: newSnapshots,
        snapshotError: null,
      };
    }

    case 'REVERT_SNAPSHOT': {
      if (state.snapshots.length === 0) {
        return { ...state, snapshotError: 'Nenhuma snapshot para reverter' };
      }
      const last = state.snapshots[state.snapshots.length - 1];
      const newSnapshots = state.snapshots.slice(0, -1);
      return {
        ...state,
        filesystem: deepClone(last.filesystem),
        currentDirectory: last.currentDirectory,
        sudoPassword: last.sudoPassword,
        wifiConnected: last.wifiConnected,
        wifiName: last.wifiName,
        wifiPassword: last.wifiPassword,
        installedPackages: [...last.installedPackages],
        progress: last.progress,
        flags: { ...last.flags },
        tutorialCompleted: last.tutorialCompleted,
        theme: last.theme || DEFAULT_THEME_ID,
        stats: last.stats || deepClone(INITIAL_STATS),
        snapshots: newSnapshots,
        snapshotError: null,
      };
    }

    case 'SET_PROGRESS':
      return { ...state, progress: Math.min(100, Math.max(0, action.payload)) };

    case 'INCREMENT_PROGRESS':
      return { ...state, progress: Math.min(100, state.progress + action.payload) };

    case 'RESET_PROGRESS': {
      return {
        ...state,
        progress: 0,
        unlockedAchievements: [],
        pendingUnlocks: [],
        flags: {},
      };
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const id = action.payload;
      if ((state.unlockedAchievements || []).includes(id)) return state;
      return {
        ...state,
        unlockedAchievements: [...(state.unlockedAchievements || []), id],
        pendingUnlocks: [...(state.pendingUnlocks || []), id],
      };
    }

    case 'SHIFT_PENDING_UNLOCK': {
      const queue = state.pendingUnlocks || [];
      if (queue.length === 0) return state;
      return { ...state, pendingUnlocks: queue.slice(1) };
    }

    case 'CLEAR_PENDING_UNLOCKS':
      return { ...state, pendingUnlocks: [] };

    case 'STAT_PUSH': {
      const { key, value } = action.payload;
      const stats = state.stats || deepClone(INITIAL_STATS);
      const current = stats[key] || [];
      if (current.includes(value)) return state;
      return { ...state, stats: { ...stats, [key]: [...current, value] } };
    }

    case 'STAT_INCREMENT': {
      const { key, by = 1 } = action.payload;
      const stats = state.stats || deepClone(INITIAL_STATS);
      return { ...state, stats: { ...stats, [key]: (stats[key] || 0) + by } };
    }

    case 'SAVE_TO_SLOT': {
      if (state.systemCorrupted) return state;
      const slot = action.payload;
      const saves = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
      saves[slot] = buildSavePayload(state, slot);
      localStorage.setItem('k1tty_saves', JSON.stringify(saves));
      return state;
    }

    case 'REBOOT': {
      if (!state.systemCorrupted && state.currentSave !== null) {
        const saves = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
        saves[state.currentSave] = buildSavePayload(state, state.currentSave);
        localStorage.setItem('k1tty_saves', JSON.stringify(saves));
      }
      return {
        ...state,
        currentSave: null,
        openWindows: [],
        windowPositions: {},
        history: [],
        systemCorrupted: false,
        finaleActive: false,
        miauFinaleActive: false,
        osSwitchActive: false,
        pendingUnlocks: [],
      };
    }

    case 'REBOOT_FORCE': {
      const fresh = getInitialState(null, true);
      return {
        ...fresh,
        currentSave: null,
        openWindows: [],
        windowPositions: {},
        history: [],
        systemCorrupted: false,
        finaleActive: false,
        miauFinaleActive: false,
        osSwitchActive: false,
        pendingUnlocks: [],
        theme: DEFAULT_THEME_ID,
        stats: deepClone(INITIAL_STATS),
      };
    }

    case 'CORRUPT_SYSTEM': {
      const source = action.payload?.source || 'user';

      if (state.currentSave !== null) {
        const saves = JSON.parse(localStorage.getItem('k1tty_saves') || '{}');
        const existingSave = saves[state.currentSave] || {};

        const savedAchievements = existingSave.unlockedAchievements || [];
        const stateAchievements = state.unlockedAchievements || [];
        const merged = Array.from(new Set([...savedAchievements, ...stateAchievements]));

        const basePayload = existingSave.filesystem
          ? existingSave
          : buildSavePayload(state, state.currentSave);

        const achievementToAdd = source === 'miau' ? 'miau_ruim' : 'aniquilador';
        const otherAchievement = source === 'miau' ? 'aniquilador' : 'miau_ruim';

        const seenEndings = Array.from(new Set([
          ...(existingSave.seenEndings || state.seenEndings || []),
          source === 'miau' ? 'miau_ruim' : 'aniquilador',
        ]));

        saves[state.currentSave] = {
          ...basePayload,
          flags: {
            ...(basePayload.flags || {}),
            corruptedBy: source,
          },
          unlockedAchievements: [
            ...merged.filter((id) => id !== achievementToAdd && id !== otherAchievement),
            achievementToAdd,
          ],
          seenEndings,
        };
        localStorage.setItem('k1tty_saves', JSON.stringify(saves));
      }

      const achievementToAdd = source === 'miau' ? 'miau_ruim' : 'aniquilador';
      const otherAchievement = source === 'miau' ? 'aniquilador' : 'miau_ruim';

      return {
        ...state,
        filesystem: {
          name: '/', type: 'dir', content: null,
          permissions: 'rw-r--r--', owner: 'root',
          hidden: false, locked: false, password: null,
          size: 0, lastModified: new Date().toISOString(),
          children: {},
        },
        currentDirectory: '/',
        flags: {
          ...state.flags,
          systemCorrupted: true,
          corruptedBy: source,
        },
        systemCorrupted: true,
        openWindows: [],
        history: [...state.history, { command: '', output: 'SISTEMA CORROMPIDO', type: 'error' }],
        unlockedAchievements: [
          ...(state.unlockedAchievements || []).filter(
            (id) => id !== achievementToAdd && id !== otherAchievement
          ),
          achievementToAdd,
        ],
        seenEndings: Array.from(new Set([...(state.seenEndings || []), achievementToAdd])),
      };
    }

    /* ============================================================
       FINALE DOS GATOS (victory)
       Já levava pra SaveSelect. Mantido.
       ============================================================ */
    case 'START_FINALE':
      return {
        ...state,
        finaleActive: true,
        openWindows: [],
        windowPositions: {},
        flags: { ...state.flags, finaleSeen: true },
        seenEndings: Array.from(new Set([...(state.seenEndings || []), 'victory'])),
      };

    case 'END_FINALE':
      return {
        ...state,
        finaleActive: false,
        currentSave: null,
        openWindows: [],
        windowPositions: {},
        history: [],
      };

    /* ============================================================
       MIAU FINALE (final bom)
       Agora também salva e volta pra SaveSelect.
       ============================================================ */
    case 'START_MIAU_FINALE': {
      return {
        ...state,
        miauFinaleActive: true,
        openWindows: [],
        windowPositions: {},
      };
    }

    case 'END_MIAU_FINALE': {
      const newFilesystem = deepClone(state.filesystem);
      const docNode = getNodeByPath(newFilesystem, '/home/k1tty/Documents');

      if (docNode && docNode.type === 'dir') {
        docNode.children['coracao_da_k1tty.txt'] = {
          name: 'coracao_da_k1tty.txt',
          type: 'file',
          content:
`Do coração da k1tty
─────────────────────

Eu não esperava. Sério.

Ninguém nunca... fica. Todo mundo entra, mexe nas minhas coisas,
e vai embora sem nem dizer tchau.

Você ficou. Você conversou. Você não me chamou de "IA quebrada".

Então toma. Isso é um pedaço de mim, escrito em txt porque
é o único formato que eu sei fazer direito.

Não é grande coisa. Mas é verdade.

— k1tty 🐱`,
          permissions: 'rw-r--r--',
          owner: 'k1tty',
          hidden: false,
          locked: false,
          password: null,
          size: 380,
          lastModified: new Date().toISOString(),
          userCreated: true,
        };
      }

      const prevUnlocked = state.unlockedAchievements || [];
      const newUnlocked = Array.from(new Set([...prevUnlocked, 'vn_good', 'miau_bom']));
      const newProgress = Math.min(100, state.progress + 15);
      const newFlags = {
        ...state.flags,
        vnGoodEnding: true,
        miauGoodEnding: true,
        miauFastfetchUnlocked: true,
      };
      const newSeenEndings = Array.from(new Set([...(state.seenEndings || []), 'miau_bom']));

      // ⬅️ Persiste antes de sair pra tela de saves
      persistCurrentSave(state, {
        filesystem: newFilesystem,
        flags: newFlags,
        progress: newProgress,
        unlockedAchievements: newUnlocked,
        seenEndings: newSeenEndings,
      });

      return {
        ...state,
        miauFinaleActive: false,
        filesystem: newFilesystem,
        currentSave: null,                // ⬅️ volta pra tela de saves
        openWindows: [],
        windowPositions: {},
        history: [],
        flags: newFlags,
        progress: newProgress,
        unlockedAchievements: newUnlocked,
        pendingUnlocks: Array.from(new Set([...(state.pendingUnlocks || []), 'miau_bom'])),
        seenEndings: newSeenEndings,
      };
    }

    /* ============================================================
       MIAU RAGE (final ruim — corrompe o sistema)
       Continua indo pro KernelPanic → REBOOT_FORCE → SaveSelect.
       ============================================================ */
    case 'MIAU_RAGE_END': {
      const prevUnlocked = state.unlockedAchievements || [];
      return {
        ...state,
        flags: { ...state.flags, miauBadEnding: true },
        unlockedAchievements: Array.from(new Set([
          ...prevUnlocked,
          'miau_ruim',
        ])),
        pendingUnlocks: Array.from(new Set([
          ...(state.pendingUnlocks || []),
          'miau_ruim',
        ])),
        seenEndings: Array.from(new Set([...(state.seenEndings || []), 'miau_ruim'])),
      };
    }

    /* ============================================================
       OS SWITCH (d0ggy OS — easter egg)
       Agora salva e volta pra SaveSelect sem resetar nada.
       ============================================================ */
    case 'START_OS_SWITCH': {
      return {
        ...state,
        osSwitchActive: true,
        openWindows: [],
        windowPositions: {},
        seenEndings: Array.from(new Set([...(state.seenEndings || []), 'os_switch'])),
      };
    }

    case 'END_OS_SWITCH': {
      const newFlags = {
        ...state.flags,
        osSwitched: true,
        previousOS: state.theme || 'neon',
      };
      const newSeenEndings = Array.from(new Set([...(state.seenEndings || []), 'os_switch']));

      // ⬅️ Persiste antes de sair pra tela de saves
      persistCurrentSave(state, {
        flags: newFlags,
        seenEndings: newSeenEndings,
      });

      return {
        ...state,
        osSwitchActive: false,
        currentSave: null,                // ⬅️ volta pra tela de saves
        openWindows: [],
        windowPositions: {},
        history: [],
        flags: newFlags,
        seenEndings: newSeenEndings,
      };
    }

    default:
      return state;
  }
}

/* ============================================================
   Bootstrap inicial
   ============================================================ */
function makeBootstrapState() {
  const fresh = getInitialState(null, true);
  return {
    ...fresh,
    currentSave: null,
    openWindows: [],
    windowPositions: {},
    history: [],
    systemCorrupted: false,
    finaleActive: false,
    miauFinaleActive: false,
    osSwitchActive: false,
    pendingUnlocks: [],
    theme: DEFAULT_THEME_ID,
    stats: deepClone(INITIAL_STATS),
  };
}

/* ============================================================
   Provider
   ============================================================ */
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeBootstrapState);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Autosave a cada 60s
  useEffect(() => {
    if (state.currentSave === null) return;
    if (state.systemCorrupted) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.currentSave === null) return;
      if (s.systemCorrupted) return;
      dispatch({ type: 'SAVE_TO_SLOT', payload: s.currentSave });
    }, 60000);

    return () => clearInterval(interval);
  }, [state.currentSave, state.systemCorrupted]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

/* ============================================================
   Hook
   ============================================================ */
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame deve ser usado dentro de GameProvider');
  return context;
}