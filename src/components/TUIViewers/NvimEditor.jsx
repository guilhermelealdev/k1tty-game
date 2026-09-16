// src/components/TUIViewers/NvimEditor.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { getNodeByPath, getFileName, deepClone } from '../../utils/helpers.js';

export default function NvimEditor() {
  const { state, dispatch } = useGame();
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState(null);
  const [mode, setMode] = useState('INSERT');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const targetPath = state.flags?.nvimFile || '/home/k1tty/novo_arquivo.txt';
    setFilePath(targetPath);

    const node = getNodeByPath(state.filesystem, targetPath);
    setContent(node ? (node.content || '') : '');
    setIsLoading(false);
  }, [state.flags?.nvimFile, state.filesystem]);

  const handleSave = useCallback(() => {
    if (!filePath) return;

    const newFilesystem = deepClone(state.filesystem);
    const node = getNodeByPath(newFilesystem, filePath);

    if (node) {
      node.content = content;
      node.size = content.length;
      node.lastModified = new Date().toISOString();
    } else {
      const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
      const fileName = getFileName(filePath);
      const parentNode = getNodeByPath(newFilesystem, parentPath);

      if (parentNode && parentNode.type === 'dir') {
        parentNode.children[fileName] = {
          name: fileName,
          type: 'file',
          content,
          permissions: 'rw-r--r--',
          owner: 'k1tty',
          hidden: false,
          locked: false,
          password: null,
          size: content.length,
          lastModified: new Date().toISOString(),
          userCreated: true,
        };
      }
    }

    dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 1 });

    // Conquista: escritor
    if (!state.flags?.wroteFile) {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'wroteFile', value: true } });
    }

    if (filePath === '/etc/logo.txt') {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'changedLogo', value: true } });
    }

    setMode('SAVED');
    setTimeout(() => setMode('INSERT'), 1000);
  }, [content, filePath, state.filesystem, state.flags?.wroteFile, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setMode('NORMAL');
    } else if (e.key === 's' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (mode === 'NORMAL' && e.key === 'i') {
      setMode('INSERT');
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="nvim-editor">
      <div className="nvim-status">
        <span>📄 {filePath || 'novo_arquivo.txt'}</span>
        <span>{mode}</span>
      </div>
      <textarea
        className="nvim-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder="Digite seu texto aqui..."
      />
      <div className="nvim-status">
        <span>Ctrl+S para salvar | Esc para modo normal | i para inserir</span>
        <span>{content.length} bytes</span>
      </div>
    </div>
  );
}