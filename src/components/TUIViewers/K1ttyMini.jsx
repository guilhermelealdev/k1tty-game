// src/components/TUIViewers/K1ttyMini.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { getNodeByPath, joinPath } from '../../utils/helpers.js';

function createMiniFilesystem() {
  return {
    name: '/',
    type: 'dir',
    children: {
      'home': {
        name: 'home',
        type: 'dir',
        children: {
          'mini': {
            name: 'mini',
            type: 'dir',
            children: {
              'readme.txt': {
                name: 'readme.txt',
                type: 'file',
                content: 'Bem-vindo ao k1tty mini!\nAqui você está dentro da simulação.\nDigite k1tty para ir mais fundo...',
              },
              'segredo.txt': {
                name: 'segredo.txt',
                type: 'file',
                content: 'Este é um arquivo secreto do mini.\nNão há nada de útil aqui.',
              },
            },
          },
        },
      },
      'etc': {
        name: 'etc',
        type: 'dir',
        children: {
          'logo.txt': {
            name: 'logo.txt',
            type: 'file',
            content: 'k1tty mini',
          },
        },
      },
      'tmp': {
        name: 'tmp',
        type: 'dir',
        children: {},
      },
    },
  };
}

export default function K1ttyMini() {
  const { dispatch } = useGame();
  const [filesystem] = useState(() => createMiniFilesystem());
  const [cwd, setCwd] = useState('/home/mini');
  const [history, setHistory] = useState([
    { type: 'command', command: '', output: 'Bem-vindo ao k1tty mini!\nDigite help para ver os comandos.' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const addHistory = useCallback((command, output, type = 'normal') => {
    setHistory((prev) => [...prev, { command, output, type }]);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [history]);

  const executeMiniCommand = useCallback(
    (inputLine) => {
      const parts = inputLine.trim().split(/\s+/);
      if (parts.length === 0 || !parts[0]) return;
      const command = parts[0];
      const args = parts.slice(1);

      switch (command) {
        case 'help':
          addHistory(inputLine, 'Comandos disponíveis:\nls, cd, cat, whoami, date, clear, k1tty', 'normal');
          break;
        case 'ls': {
          const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
          const showDetails = args.includes('-l') || args.includes('-la') || args.includes('-al');
          let targetPath = cwd;
          const nonFlagArgs = args.filter((a) => !a.startsWith('-'));
          if (nonFlagArgs.length > 0) targetPath = joinPath(cwd, nonFlagArgs[0]);
          const node = getNodeByPath(filesystem, targetPath);
          if (!node) {
            addHistory(inputLine, `ls: não foi possível acessar '${targetPath}': Arquivo ou diretório inexistente`, 'error');
            break;
          }
          if (node.type === 'file') {
            addHistory(inputLine, node.name, 'normal');
            break;
          }
          const children = node.children || {};
          const entries = Object.values(children).filter((e) => showHidden || !e.hidden);
          const sorted = entries.sort((a, b) => a.name.localeCompare(b.name));
          let output = '';
          if (showDetails) {
            output = sorted
              .map((e) => {
                const perms = e.permissions || 'rw-r--r--';
                const size = e.size || 0;
                const date = e.lastModified || '---';
                const type = e.type === 'dir' ? 'd' : '-';
                return `${type}${perms} mini ${size} ${date} ${e.name}`;
              })
              .join('\n');
          } else {
            output = sorted.map((e) => e.name).join('  ');
          }
          addHistory(inputLine, output || '(vazio)', 'normal');
          break;
        }
        case 'cd':
          if (args.length === 0) {
            setCwd('/home/mini');
            addHistory(inputLine, '', 'normal');
            break;
          }
          {
            const newPath = joinPath(cwd, args[0]);
            const node = getNodeByPath(filesystem, newPath);
            if (!node || node.type !== 'dir') {
              addHistory(inputLine, `cd: ${args[0]}: Diretório inválido`, 'error');
              break;
            }
            setCwd(newPath);
            addHistory(inputLine, '', 'normal');
          }
          break;
        case 'cat':
          if (args.length === 0) {
            addHistory(inputLine, 'Uso: cat <arquivo>', 'error');
            break;
          }
          {
            const targetPath = joinPath(cwd, args[0]);
            const node = getNodeByPath(filesystem, targetPath);
            if (!node || node.type !== 'file') {
              addHistory(inputLine, `cat: ${args[0]}: Arquivo inexistente`, 'error');
              break;
            }
            addHistory(inputLine, node.content || '', 'normal');
          }
          break;
        case 'whoami':
          addHistory(inputLine, 'mini', 'normal');
          break;
        case 'date':
          addHistory(inputLine, new Date().toLocaleString('pt-BR'), 'normal');
          break;
        case 'clear':
          setHistory([]);
          break;
        case 'k1tty':
          addHistory(inputLine, 'Abrindo outro k1tty...', 'success');
          dispatch({ type: 'OPEN_WINDOW', payload: 'k1tty' });
          break;
        default:
          addHistory(inputLine, `Comando não encontrado: ${command}`, 'error');
      }
    },
    [cwd, filesystem, addHistory, dispatch]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        const line = input;
        setInput('');
        executeMiniCommand(line);
      }
    },
    [input, executeMiniCommand]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const prompt = `k1tty@mini:${cwd === '/home/mini' ? '~' : cwd}$`;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-panel)',
        fontFamily: 'Fira Code, monospace',
        fontSize: '13px',
        color: 'var(--color-text)',
      }}
      onClick={handleClick}
    >
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {history.map((entry, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>
            {entry.command && (
              <div>
                <span style={{ color: 'var(--color-command)' }}>{prompt}</span>{' '}
                <span style={{ color: 'var(--color-command)' }}>{entry.command}</span>
              </div>
            )}
            {entry.output && (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  color:
                    entry.type === 'error'
                      ? 'var(--color-error)'
                      : entry.type === 'success'
                        ? 'var(--color-command)'
                        : 'var(--color-text)',
                }}
              >
                {entry.output}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ color: 'var(--color-command)', whiteSpace: 'nowrap' }}>{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-command)',
            fontFamily: 'Fira Code, monospace',
            fontSize: '13px',
            outline: 'none',
            marginLeft: '4px',
          }}
          autoFocus
        />
      </div>
    </div>
  );
}