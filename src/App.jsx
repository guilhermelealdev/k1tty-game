// src/App.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameProvider, useGame } from './state/GameContext.jsx';
import { attachZoom, detachZoom } from './utils/zoom.js';
import { collectImagePathsWithoutUrl, preloadImagesForPaths } from './services/catApi.js';
import { preloadAllApis, API_STEPS } from './services/apiPreloader.js';
import { useAchievements } from './hooks/useAchievements.js';
import Terminal from './components/Terminal.jsx';
import SaveSelect from './components/SaveSelect.jsx';
import BootScreen from './components/BootScreen.jsx';
import PreloadScreen from './components/PreloadScreen.jsx';
import FloatingWindow from './components/FloatingWindow.jsx';
import FinaleOverlay from './components/FinaleOverlay.jsx';
import MiauFinaleOverlay from './components/MiauFinaleOverlay.jsx';
import KernelPanicScreen from './components/KernelPanicScreen.jsx';
import AchievementToast from './components/AchievementToast.jsx';
import WindowSounds from './components/WindowSounds.jsx';
import GlowingCursor from './components/GlowingCursor.jsx';
import TerminalAmbient from './components/TerminalAmbient.jsx';
import GlobalUISounds from './components/GlobalUISounds.jsx';
import OSSwitchOverlay from './components/OSSwitchOverlay.jsx';
import NotesViewer from './components/TUIViewers/NotesViewer.jsx';
import LensViewer from './components/TUIViewers/LensViewer.jsx';
import MatrixViewer from './components/TUIViewers/MatrixViewer.jsx';
import BtopViewer from './components/TUIViewers/BtopViewer.jsx';
import MP3Player from './components/TUIViewers/MP3Player.jsx';
import AudioViewer from './components/TUIViewers/AudioViewer.jsx';
import BonsaiViewer from './components/TUIViewers/BonsaiViewer.jsx';
import CatRun from './components/TUIViewers/CatRun.jsx';
import WebBrowser from './components/TUIViewers/WebBrowser.jsx';
import NvimEditor from './components/TUIViewers/NvimEditor.jsx';
import TutorialWindow from './components/TUIViewers/TutorialWindow.jsx';
import AdminPanel from './components/TUIViewers/AdminPanel.jsx';
import MeowViewer from './components/TUIViewers/MeowViewer.jsx';
import RamViewer from './components/TUIViewers/RamViewer.jsx';
import K1ttyMini from './components/TUIViewers/K1ttyMini.jsx';
import OpsecViewer from './components/TUIViewers/OpsecViewer.jsx';
import BluetoothViewer from './components/TUIViewers/BluetoothViewer.jsx';
import CreditsViewer from './components/TUIViewers/CreditsViewer.jsx';
import AptCliViewer from './components/TUIViewers/AptCliViewer.jsx';
import KittensViewer from './components/TUIViewers/KittensViewer.jsx';
import AchievementsViewer from './components/TUIViewers/AchievementsViewer.jsx';
import VisualNovel from './components/TUIViewers/VisualNovel.jsx';
import WhoIsThisViewer from './components/TUIViewers/WhoIsThisViewer.jsx';
import KittyViewer from './components/TUIViewers/KittyViewer.jsx';
import MiauVN from './components/TUIViewers/MiauVN.jsx';
import MiauWarning from './components/TUIViewers/MiauWarning.jsx';
import MiauTerminal from './components/TUIViewers/MiauTerminal.jsx';
import FullscreenToggle from './components/FullscreenToggle.jsx';


const windowComponents = {
  notes: NotesViewer,
  lens: LensViewer,
  matrix: MatrixViewer,
  btop: BtopViewer,
  mp3player: MP3Player,
  audioview: AudioViewer,
  bonsai: BonsaiViewer,
  catrun: CatRun,
  web: WebBrowser,
  nvim: NvimEditor,
  tutorial: TutorialWindow,
  admin: AdminPanel,
  kitty: KittyViewer,
  meow: MeowViewer,
  ram: RamViewer,
  k1tty: K1ttyMini,
  opsec: OpsecViewer,
  bluetooth: BluetoothViewer,
  whoisthis: WhoIsThisViewer,
  credits: CreditsViewer,
  'apt-cli': AptCliViewer,
  kittens: KittensViewer,
  achievements: AchievementsViewer,
  vn: VisualNovel,
  'miau-vn': MiauVN,
  'miau-warning': MiauWarning,
  'miau-terminal': MiauTerminal,
};

/* ============================================================
   Hook: F12 → fullscreen
   ============================================================ */
function useFullscreenHotkey() {
  useEffect(() => {
    const toggleFullscreen = () => {
      const elem = document.documentElement;

      if (!document.fullscreenElement) {
        const request =
          elem.requestFullscreen ||
          elem.webkitRequestFullscreen ||
          elem.mozRequestFullScreen ||
          elem.msRequestFullscreen;
        if (request) {
          request.call(elem).catch((err) => {
            console.warn('[fullscreen] falha ao entrar:', err?.message);
          });
        }
      } else {
        const exit =
          document.exitFullscreen ||
          document.webkitExitFullscreen ||
          document.mozCancelFullScreen ||
          document.msExitFullscreen;
        if (exit) {
          exit.call(document).catch((err) => {
            console.warn('[fullscreen] falha ao sair:', err?.message);
          });
        }
      }
    };

    const handleKeyDown = (e) => {
      // F12 = fullscreen (e NÃO abre DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen();
      }
    };

    // capture=true garante prioridade sobre qualquer outro handler
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}

function GameContent() {
  const { state, dispatch } = useGame();
  const [bootComplete, setBootComplete] = useState(false);
  const [showSaveSelect, setShowSaveSelect] = useState(false);
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [apiSteps, setApiSteps] = useState(null);
  const appContainerRef = useRef(null);

  const attemptedPathsRef = useRef(new Set());
  const preloadingRef = useRef(false);
  const lastSaveRef = useRef(null);
  const initialPreloadDoneRef = useRef(false);
  const apisLoadedRef = useRef(false);

  useAchievements();

  // ⬇️ Atalho global F12 → fullscreen
  useFullscreenHotkey();

  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
    if (state.currentSave === null && !state.systemCorrupted && !state.finaleActive && !state.miauFinaleActive && !state.osSwitchActive) {
      setShowSaveSelect(true);
    }
  }, [state.currentSave, state.systemCorrupted, state.finaleActive, state.miauFinaleActive, state.osSwitchActive]);

  useEffect(() => {
    if (
      bootComplete &&
      state.currentSave === null &&
      !state.systemCorrupted &&
      !state.finaleActive &&
      !state.miauFinaleActive &&
      !state.osSwitchActive
    ) {
      setShowSaveSelect(true);
    }
  }, [bootComplete, state.currentSave, state.systemCorrupted, state.finaleActive, state.miauFinaleActive, state.osSwitchActive]);

  const isGameActive =
    bootComplete &&
    state.currentSave !== null &&
    !state.systemCorrupted &&
    !state.finaleActive &&
    !state.miauFinaleActive &&
    !state.osSwitchActive;

  useEffect(() => {
    if (state.currentSave !== null && state.theme) {
      document.documentElement.setAttribute('data-theme', state.theme);
    } else {
      document.documentElement.setAttribute('data-theme', 'neon');
    }
  }, [state.theme, state.currentSave]);

  useEffect(() => {
    if (lastSaveRef.current !== state.currentSave) {
      lastSaveRef.current = state.currentSave;
      attemptedPathsRef.current = new Set();
      preloadingRef.current = false;
      initialPreloadDoneRef.current = false;
      setPreloading(false);
      setPreloadProgress(0);
      setApiSteps(null);
    }
  }, [state.currentSave]);

  useEffect(() => {
    if (!isGameActive) return;
    if (preloadingRef.current) return;

    const pending = collectImagePathsWithoutUrl(state.filesystem)
      .filter(p => !attemptedPathsRef.current.has(p));

    const shouldShowOverlay = !initialPreloadDoneRef.current;
    const needsApiPreload = !apisLoadedRef.current;

    if (pending.length === 0 && !needsApiPreload) return;

    pending.forEach(p => attemptedPathsRef.current.add(p));
    preloadingRef.current = true;

    let stepsLocal = null;
    if (needsApiPreload) {
      stepsLocal = API_STEPS.map(s => ({ ...s, status: 'pending' }));
      setApiSteps(stepsLocal);
    } else {
      setApiSteps(null);
    }

    if (shouldShowOverlay) {
      setPreloading(true);
      setPreloadProgress(0);
    }

    let p = 0;
    const progressInterval = setInterval(() => {
      const increment = p < 30
        ? 1.2 + Math.random() * 1.8
        : p < 70
          ? 2 + Math.random() * 2.5
          : 1 + Math.random() * 1.5;

      p += increment;
      if (p >= 98) {
        p = 98;
        clearInterval(progressInterval);
      }
      if (shouldShowOverlay) setPreloadProgress(p);
    }, 100);

    const apiPromise = needsApiPreload
      ? preloadAllApis((id, status) => {
          setApiSteps(prev => {
            if (!prev) return prev;
            return prev.map(s => s.id === id ? { ...s, status } : s);
          });
        }).then(cache => {
          dispatch({ type: 'SET_API_CACHE', payload: cache });
          apisLoadedRef.current = true;
        })
      : Promise.resolve();

    const imgPromise = pending.length > 0
      ? preloadImagesForPaths(pending).then(results => {
          if (results.length > 0) {
            dispatch({ type: 'SET_IMAGE_URLS', payload: results });
          }
        })
      : Promise.resolve();

    Promise.all([apiPromise, imgPromise])
      .then(() => {
        clearInterval(progressInterval);
        if (shouldShowOverlay) {
          setPreloadProgress(100);
          initialPreloadDoneRef.current = true;
        }
        preloadingRef.current = false;
      })
      .catch(() => {
        clearInterval(progressInterval);
        if (shouldShowOverlay) {
          setPreloadProgress(100);
          initialPreloadDoneRef.current = true;
        }
        preloadingRef.current = false;
      });
  }, [isGameActive, state.filesystem, state.currentSave, dispatch]);

  useEffect(() => {
    if (isGameActive && !preloading && appContainerRef.current) {
      attachZoom(appContainerRef.current);
    } else {
      detachZoom();
    }
    return () => {
      detachZoom();
    };
  }, [isGameActive, preloading]);

  if (!bootComplete) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  if (state.osSwitchActive) {
    return (
      <>
        <OSSwitchOverlay />
        <AchievementToast />
      </>
    );
  }

  if (state.miauFinaleActive) {
    return (
      <>
        <MiauFinaleOverlay />
        <AchievementToast />
      </>
    );
  }

  if (state.finaleActive) {
    return (
      <>
        <FinaleOverlay />
        <AchievementToast />
      </>
    );
  }

  if (state.systemCorrupted) {
    return <KernelPanicScreen />;
  }

  if (showSaveSelect && state.currentSave === null) {
    return (
      <>
        <SaveSelect
          onSelectSave={(slot) => {
            dispatch({ type: 'LOAD_SLOT', payload: slot });
            setShowSaveSelect(false);
          }}
          onNewSave={(slot, skipTutorial) => {
            dispatch({ type: 'NEW_SAVE', payload: { slot, skipTutorial } });
            setShowSaveSelect(false);
          }}
          onDeleteSave={(slot) => {
            dispatch({ type: 'DELETE_SAVE', payload: slot });
          }}
        />
        <AchievementToast />
      </>
    );
  }

  if (preloading) {
    return (
      <>
        <PreloadScreen
          progress={preloadProgress}
          steps={apiSteps}
          onComplete={() => {
            setPreloading(false);
            preloadingRef.current = false;
          }}
        />
        <AchievementToast />
      </>
    );
  }

  return (
    <>
      <div className="app-container" ref={appContainerRef}>
        <TerminalAmbient />
        <WindowSounds />
        <Terminal />
        {state.openWindows.map((windowObj, index) => {
          const { id: windowId, type: windowType } = windowObj;
          const WindowComponent = windowComponents[windowType] || null;
          if (!WindowComponent) return null;
          const position = state.windowPositions?.[windowId] || {
            x: 50 + index * 30,
            y: 50 + index * 30,
            width: 400,
            height: 300
          };
          const titleMap = {
            notes: 'Notas',
            lens: 'Visualizador de Imagens',
            matrix: 'Matrix',
            btop: 'Monitor do Sistema',
            mp3player: 'MP3 Player',
            audioview: 'Visualizador de Áudio',
            bonsai: 'Bonsai',
            catrun: 'Cat Run',
            web: 'Navegador TUI',
            nvim: 'Editor de Texto',
            tutorial: 'miau',
            admin: 'Painel de Administração',
            kitty: 'Foto de Gato',
            meow: 'k1tty Clicker',
            ram: 'Instalador de RAM',
            k1tty: 'k1tty',
            opsec: 'OP SEC',
            bluetooth: 'Bluetooth',
            whoisthis: 'Detalhes do Arquivo',
            credits: 'Créditos Finais',
            'apt-cli': 'apt-cli',
            kittens: 'kittens',
            achievements: 'Conquistas',
            vn: 'k1tty.vn',
            'miau-vn': 'miau-vn',
            'miau-warning': '⚠ SISTEMA',
            'miau-terminal': '⚠ k1tty',
          };
          return (
            <FloatingWindow
              key={windowId}
              id={windowId}
              title={titleMap[windowType] || windowType}
              position={position}
              onClose={() => dispatch({ type: 'CLOSE_WINDOW', payload: windowId })}
              onMove={(newPos) => dispatch({ type: 'MOVE_WINDOW', payload: { id: windowId, position: newPos } })}
              onResize={(newSize) => dispatch({ type: 'RESIZE_WINDOW', payload: { id: windowId, size: newSize } })}
              onFocus={() => dispatch({ type: 'FOCUS_WINDOW', payload: windowId })}
            >
              <WindowComponent />
            </FloatingWindow>
          );
        })}
      </div>
      <AchievementToast />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GlobalUISounds />
      <GameContent />
      <FullscreenToggle />
      <GlowingCursor color="#C7EF00" />
    </GameProvider>
  );
}
