import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { getNodeByPath, deepClone } from '../../utils/helpers.js';

export default function NotesViewer() {
  const { state, dispatch } = useGame();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const notesPath = '/home/k1tty/.notes.txt';
    const node = getNodeByPath(state.filesystem, notesPath);
    setContent(node ? (node.content || '') : '');
    setIsLoading(false);
  }, [state.filesystem]);

  const handleSave = useCallback(() => {
    const notesPath = '/home/k1tty/.notes.txt';
    const newFilesystem = deepClone(state.filesystem);
    const node = getNodeByPath(newFilesystem, notesPath);
    
    if (node) {
      node.content = content;
      node.size = content.length;
      node.lastModified = new Date().toISOString();
    } else {
      // Create .notes.txt
      const homeNode = getNodeByPath(newFilesystem, '/home/k1tty');
      homeNode.children['.notes.txt'] = {
        name: '.notes.txt',
        type: 'file',
        content,
        permissions: 'rw-r--r--',
        owner: 'k1tty',
        hidden: true,
        locked: false,
        password: null,
        size: content.length,
        lastModified: new Date().toISOString(),
      };
    }
    
    dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 2 });
  }, [content, state.filesystem, dispatch]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea
        className="tui-input"
        style={{ flex: 1, resize: 'none', fontSize: '13px' }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
        <button className="tui-button" onClick={handleSave}>
          Salvar notas
        </button>
        <span style={{ fontSize: '11px', color: '#5a7a5a' }}>
          Salvo em ~/.notes.txt
        </span>
      </div>
    </div>
  );
}