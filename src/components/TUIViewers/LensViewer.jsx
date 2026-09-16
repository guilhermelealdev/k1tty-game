// src/components/TUIViewers/LensViewer.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { getNodeByPath } from '../../utils/helpers.js';
import { isImageFile } from '../../services/catApi.js';

export default function LensViewer() {
  const { state } = useGame();
  const [selected, setSelected] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const images = useMemo(() => {
    const found = [];

    function walk(node, path) {
      if (!node || !node.children) return;
      for (const childName in node.children) {
        const child = node.children[childName];
        const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
        if (child.type === 'file' && isImageFile(child.name)) {
          found.push({
            path: childPath,
            name: child.name,
            node: child,
          });
        } else if (child.type === 'dir') {
          walk(child, childPath);
        }
      }
    }

    walk(state.filesystem, '/');
    found.sort((a, b) => a.path.localeCompare(b.path));
    return found;
  }, [state.filesystem]);

  useEffect(() => {
    if (!selected && images.length > 0) {
      setSelected(images[0].path);
    }
  }, [images, selected]);

  useEffect(() => {
    setImageLoadError(false);
  }, [selected]);

  const currentNode = selected ? getNodeByPath(state.filesystem, selected) : null;
  const selectedImageMeta = images.find(img => img.path === selected);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      gap: '10px',
      padding: '8px',
      fontFamily: 'inherit',
      fontSize: '13px',
      color: 'var(--color-text)',
      background: 'var(--color-bg-panel)',
      overflow: 'hidden',
    }}>
      {/* Lista lateral */}
      <div style={{
        width: '200px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: 'rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '6px 10px',
          borderBottom: '1px solid var(--color-border-a40)',
          color: 'var(--color-command)',
          fontSize: '11px',
          letterSpacing: '1px',
          textShadow: 'var(--glow-soft)',
          flexShrink: 0,
        }}>
          ▸ IMAGENS ({images.length})
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px',
        }}>
          {images.length === 0 ? (
            <div style={{
              padding: '12px 8px',
              fontSize: '11px',
              color: 'var(--color-dim)',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              Nenhuma imagem encontrada no sistema.
            </div>
          ) : (
            images.map(img => {
              const isSelected = selected === img.path;
              const hasImage = !!img.node.imageUrl;
              return (
                <div
                  key={img.path}
                  onClick={() => setSelected(img.path)}
                  style={{
                    padding: '5px 8px',
                    marginBottom: '3px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--color-command-a15)'
                      : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--color-command)' : 'transparent'}`,
                    borderRadius: '2px',
                    fontSize: '11px',
                    color: isSelected ? 'var(--color-command)' : 'var(--color-text)',
                    transition: 'all 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--color-command-a05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{hasImage ? '🖼' : '📷'}</span>
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {img.name}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Área da imagem */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: 'radial-gradient(circle at center, var(--color-bg-glow) 0%, var(--color-bg-deep) 100%)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '6px 10px',
          borderBottom: '1px solid var(--color-border-a40)',
          background: 'rgba(0, 0, 0, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          gap: '8px',
        }}>
          <span style={{
            color: 'var(--color-command)',
            fontSize: '11px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: 1,
          }}>
            {selectedImageMeta?.path || 'Nenhuma imagem selecionada'}
          </span>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '10px',
        }}>
          {!selected ? (
            <div style={{
              color: 'var(--color-dim)',
              fontSize: '13px',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              Selecione uma imagem à esquerda.
            </div>
          ) : !currentNode?.imageUrl || imageLoadError ? (
            <FallbackCat name={currentNode?.name} />
          ) : (
            <img
              key={currentNode.imageUrl}
              src={currentNode.imageUrl}
              alt={currentNode.name}
              onError={() => setImageLoadError(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '4px',
                border: '1px solid var(--color-border-a50)',
                boxShadow: '0 0 20px var(--color-command-a15)',
                animation: 'lensFadeIn 0.35s ease-out',
                userSelect: 'none',
              }}
              draggable={false}
            />
          )}
        </div>

        {currentNode && currentNode.imageUrl && !imageLoadError && (
          <div style={{
            padding: '5px 10px',
            borderTop: '1px solid var(--color-border-a40)',
            background: 'rgba(0, 0, 0, 0.35)',
            fontSize: '10px',
            color: 'var(--color-dim)',
            display: 'flex',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span>{currentNode.name}</span>
            <span>{(currentNode.size / 1024).toFixed(1)} KB · Cat API</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lensFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function FallbackCat({ name }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      color: 'var(--color-dim)',
    }}>
      <div style={{
        fontSize: '80px',
        opacity: 0.4,
        filter: 'grayscale(0.5)',
      }}>
        🐱
      </div>
      <div style={{
        fontSize: '11px',
        letterSpacing: '1px',
        textAlign: 'center',
      }}>
        {name ? `${name} — imagem indisponível` : 'imagem indisponível'}
      </div>
    </div>
  );
}