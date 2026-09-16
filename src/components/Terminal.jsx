// src/components/Terminal.jsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { parseCommand, executeCommand } from '../commands/parser.js';
import MiauFastfetch from './MiauFastfetch.jsx';
import PokemonEntry from './PokemonEntry.jsx';

function TypewriterText({ text, onDone, onTick, speed = 8 }) {
  const [displayed, setDisplayed] = useState('');
  const onDoneRef = useRef(onDone);
  const onTickRef = useRef(onTick);
  const doneRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
    onTickRef.current = onTick;
  }, [onDone, onTick]);

  useEffect(() => {
    doneRef.current = false;
    setDisplayed('');

    if (!text) {
      if (onDoneRef.current) onDoneRef.current();
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));
      if (onTickRef.current) onTickRef.current();
      if (index >= text.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          if (onDoneRef.current) onDoneRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayed}</>;
}

function Prompt({ path }) {
  return (
    <span className="terminal-prompt">
      <span className="prompt-user">k1tty</span>
      <span className="prompt-sep">@</span>
      <span className="prompt-host">k1tty</span>
      <span className="prompt-sep">:</span>
      <span className="prompt-path">{path}</span>
      <span className="prompt-symbol">$</span>
    </span>
  );
}

export default function Terminal() {
  const { state, dispatch } = useGame();
  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pendingInput, setPendingInput] = useState(null);
  const [isCorrupting, setIsCorrupting] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [isAwaiting, setIsAwaiting] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const displayPath = useMemo(() => {
    const cwd = state.currentDirectory;
    return cwd === '/home/k1tty' ? '~' : cwd.replace('/home/k1tty', '~');
  }, [state.currentDirectory]);

  const seenIndicesRef = useRef(null);
  if (seenIndicesRef.current === null) {
    seenIndicesRef.current = new Set(state.history.map((_, i) => i));
  }

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const syncCursor = useCallback(() => {
    if (inputRef.current) {
      const pos = inputRef.current.selectionStart ?? 0;
      setCursorPos(pos);
    }
  }, []);

  const setInputWithCursorAtEnd = useCallback((value) => {
    setInput(value);
    setCursorPos(value.length);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const len = value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    });
  }, []);

  useEffect(() => {
    if (!isCorrupting) inputRef.current?.focus();
  }, [pendingInput, isCorrupting]);

  useEffect(() => {
    scrollToBottom();
  }, [state.history, pendingInput, isCorrupting, animatingIndex, scrollToBottom]);

  useEffect(() => {
    const handleZoomChange = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
          if (inputRef.current) {
            inputRef.current.scrollIntoView({ block: 'nearest' });
          }
        });
      });
    };
    window.addEventListener('k1tty:zoom-changed', handleZoomChange);
    return () => window.removeEventListener('k1tty:zoom-changed', handleZoomChange);
  }, [scrollToBottom]);

  useEffect(() => {
    const lastIndex = state.history.length - 1;
    if (lastIndex < 0 || isCorrupting) return;
    if (!seenIndicesRef.current.has(lastIndex)) {
      seenIndicesRef.current.add(lastIndex);
      setAnimatingIndex(lastIndex);
    }
  }, [state.history.length, isCorrupting]);

  const processCorruptingResult = useCallback((result) => {
    const logs = result.removalLogs || [];
    let delay = 0;
    const step = 80;

    logs.forEach((log, index) => {
      setTimeout(() => {
        dispatch({
          type: 'ADD_HISTORY',
          payload: { command: '', output: log, type: 'normal' },
        });

        if (index === logs.length - 1) {
          setTimeout(() => {
            dispatch({
              type: 'ADD_HISTORY',
              payload: { command: '', output: '💀 SISTEMA CORROMPIDO — O terminal será encerrado.', type: 'error' },
            });
            setTimeout(() => {
              dispatch({ type: 'CORRUPT_SYSTEM', payload: { source: 'user' } });
            }, 1500);
          }, 300);
        }
      }, delay);
      delay += step;
    });
  }, [dispatch]);

  const processCorruptingResultRef = useRef(processCorruptingResult);
  useEffect(() => {
    processCorruptingResultRef.current = processCorruptingResult;
  }, [processCorruptingResult]);

  const handleCommandResult = useCallback(async (result) => {
    let resolved;
    try {
      resolved = await Promise.resolve(result);
    } catch (err) {
      resolved = {
        command: '',
        output: `erro inesperado: ${err.message}`,
        type: 'error',
      };
    }

    if (!resolved) return;

    if (resolved.systemCorrupting) {
      setIsCorrupting(true);
      processCorruptingResultRef.current?.(resolved);
      return;
    }

    if (resolved.needsPassword) {
      setPendingInput({ type: 'password', command: resolved.command });
      dispatch({
        type: 'ADD_HISTORY',
        payload: { command: resolved.command, output: resolved.output || '🔒 Digite a senha:', type: 'warning' },
      });
      return;
    }

    if (resolved.needsUsername) {
      setPendingInput({ type: 'username', command: resolved.command });
      dispatch({
        type: 'ADD_HISTORY',
        payload: { command: resolved.command, output: resolved.output || '🔒 Digite o nome de usuário:', type: 'warning' },
      });
      return;
    }

    if (resolved.needsConfirmation) {
      setPendingInput({ type: 'confirmation', command: resolved.command });
      dispatch({
        type: 'ADD_HISTORY',
        payload: { command: resolved.command, output: resolved.output || 'Confirme (y/n):', type: 'warning' },
      });
      return;
    }

    dispatch({ type: 'ADD_HISTORY', payload: resolved });
  }, [dispatch]);

  const handleInput = useCallback(async (e) => {
    if (state.systemCorrupted || isCorrupting) return;

    if (e.key === 'Enter') {
      const inputValue = input.trim();
      if (!inputValue) return;

      setInput('');
      setCursorPos(0);
      setHistoryIndex(-1);

      if (pendingInput) {
        const { type, command } = pendingInput;
        setPendingInput(null);

        const extraOptions = {};
        if (type === 'password') extraOptions.password = inputValue;
        else if (type === 'username') extraOptions.username = inputValue;
        else if (type === 'confirmation') {
          const lower = inputValue.toLowerCase();
          extraOptions.confirmed = ['y', 's', 'sim', 'yes'].includes(lower);
        }

        const result = executeCommand(command, state, dispatch, extraOptions);
        setIsAwaiting(true);
        await handleCommandResult(result);
        setIsAwaiting(false);
        return;
      }

      setCommandHistory(prev => [...prev, inputValue]);

      const result = executeCommand(inputValue, state, dispatch, {});
      setIsAwaiting(true);
      await handleCommandResult(result);
      setIsAwaiting(false);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!pendingInput && !isCorrupting && commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        const value = commandHistory[newIndex] || '';
        setInputWithCursorAtEnd(value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!pendingInput && !isCorrupting && historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputWithCursorAtEnd('');
        } else {
          setHistoryIndex(newIndex);
          const value = commandHistory[newIndex] || '';
          setInputWithCursorAtEnd(value);
        }
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!pendingInput && !isCorrupting) {
        const commonCommands = [
          'ls', 'cd', 'cat', 'touch', 'mkdir', 'rm', 'mv', 'find', 'grep',
          'date', 'whoami', 'help', 'fastfetch', 'cowsay', 'catfact', 'quote',
          'pokemon', 'whatnow', 'howleft', 'notes', 'log', 'snapshot', 'reboot',
          'apt', 'web', 'ping', 'connect', 'nvim', 'sudo', 'admin', 'clear',
          'miau-vn',
        ];
        const partial = input.toLowerCase();
        const matches = commonCommands.filter(c => c.startsWith(partial));
        if (matches.length === 1) {
          setInputWithCursorAtEnd(matches[0] + ' ');
        } else if (matches.length > 0) {
          dispatch({ type: 'ADD_HISTORY', payload: {
            command: partial,
            output: matches.join('  '),
            type: 'info',
          }});
        }
      }
      return;
    }

    requestAnimationFrame(syncCursor);
  }, [input, commandHistory, historyIndex, state, dispatch, pendingInput, isCorrupting, setInputWithCursorAtEnd, syncCursor, handleCommandResult]);

  const handleClick = useCallback(() => {
    if (!state.systemCorrupted && !isCorrupting) inputRef.current?.focus();
  }, [state.systemCorrupted, isCorrupting]);

  const handleAnimationDone = useCallback((index) => {
    if (animatingIndex === index) setAnimatingIndex(null);
  }, [animatingIndex]);

  const showCursor = !state.systemCorrupted && !isCorrupting && (isInputFocused || pendingInput);

  return (
    <div
      className="terminal-container"
      ref={scrollRef}
      onClick={handleClick}
      style={{ flex: 1 }}
    >
      {state.history.map((entry, index) => {
        const shouldAnimate = animatingIndex === index && !isCorrupting;
        return (
          <div key={index} className="terminal-line">
            <div className="terminal-input-line">
              <Prompt path={displayPath} />
              <span className="output-command" style={{ marginLeft: '6px' }}>{entry.command}</span>
            </div>
            {(entry.output || entry.special) && (
              <div className={`terminal-line output-${entry.type || 'normal'}`}>
                {entry.special?.type === 'miau-fastfetch' ? (
                  <MiauFastfetch line={entry.special.miauLine} />
                ) : entry.special?.type === 'pokemon' ? (
                  <PokemonEntry data={entry.special.data} />
                ) : shouldAnimate ? (
                  <TypewriterText
                    text={entry.output}
                    speed={6}
                    onTick={scrollToBottom}
                    onDone={() => handleAnimationDone(index)}
                  />
                ) : entry.output}
              </div>
            )}
          </div>
        );
      })}

      {!isCorrupting && !state.systemCorrupted && (
        <div className="terminal-input-line">
          {!pendingInput && <Prompt path={displayPath} />}
          <div
            className="terminal-input-wrapper"
            style={{ marginLeft: pendingInput ? '0px' : '6px' }}
          >
            <input
              ref={inputRef}
              className="terminal-input"
              type={pendingInput?.type === 'password' ? 'password' : 'text'}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setCursorPos(e.target.selectionStart ?? e.target.value.length);
              }}
              onKeyDown={handleInput}
              onKeyUp={syncCursor}
              onClick={syncCursor}
              onSelect={syncCursor}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              disabled={isAwaiting}
            />
            {showCursor && !isAwaiting && (
              <span
                className="terminal-cursor"
                style={{ left: `${cursorPos}ch` }}
              />
            )}
            {isAwaiting && (
              <span style={{
                marginLeft: '8px',
                color: 'var(--color-dim)',
                fontSize: '11px',
                fontStyle: 'italic',
                animation: 'blink 1s step-end infinite',
              }}>
                buscando...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}