// src/components/TUIViewers/WhoIsThisViewer.jsx

import React, { useState, useMemo } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { formatSize, formatDate, formatPermissions } from '../../utils/helpers.js';

export default function WhoIsThisViewer() {
  const { state } = useGame();
  const [filter, setFilter] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);

  // Percorre o FS inteiro e achata em [{ path, node }]
  const allFiles = useMemo(() => {
    const out = [];
    function walk(node, path) {
      if (!node || !node.children) return;
      for (const name in node.children) {
        const child = node.children[name];
        const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
        out.push({ path: childPath, node: child });
        if (child.type === 'dir') walk(child, childPath);
      }
    }
    walk(state.filesystem, '/');
    out.sort((a, b) => a.path.localeCompare(b.path));
    return out;
  }, [state.filesystem]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return allFiles.slice(0, 200);
    const q = filter.toLowerCase();
    return allFiles.filter(f => f.path.toLowerCase().includes(q)).slice(0, 200);
  }, [allFiles, filter]);

  const selected = selectedPath
    ? allFiles.find(f => f.path === selectedPath)
    : null;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      gap: '10px',
      padding: '8px',
      fontFamily: 'inherit',
      fontSize: '12px',
      color: 'var(--color-text)',
      background: 'var(--color-bg-panel)',
      overflow: 'hidden',
    }}>
      {/* Lista lateral */}
      <div style={{
        width: '230px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: 'rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '6px 8px',
          borderBottom: '1px solid var(--color-border-a40)',
          flexShrink: 0,
        }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="procurar arquivo..."
            spellCheck={false}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--color-border-a30)',
              borderRadius: '3px',
              color: 'var(--color-text)',
              fontFamily: 'inherit',
              fontSize: '11px',
              padding: '4px 8px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px',
        }}>
          {filtered.length === 0 && (
            <div style={{
              padding: '12px 8px',
              fontSize: '11px',
              color: 'var(--color-dim)',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              Nenhum arquivo encontrado.
            </div>
          )}

          {filtered.map(({ path, node }) => {
            const isSelected = selectedPath === path;
            const icon = node.type === 'dir'
              ? '📁'
              : node.isImage ? '🖼'
              : node.hidden ? '👁'
              : '📄';
            return (
              <div
                key={path}
                onClick={() => setSelectedPath(path)}
                style={{
                  padding: '4px 8px',
                  marginBottom: '2px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--color-command-a15)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--color-command)' : 'transparent'}`,
                  borderRadius: '2px',
                  fontSize: '11px',
                  color: isSelected ? 'var(--color-command)' : 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--color-command-a05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '12px', flexShrink: 0 }}>{icon}</span>
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {path}
                </span>
              </div>
            );
          })}

          {filtered.length === 200 && allFiles.length > 200 && (
            <div style={{
              padding: '6px 8px',
              fontSize: '10px',
              color: 'var(--color-dim)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              (mostrando 200 de {allFiles.length} — refine a busca)
            </div>
          )}
        </div>
      </div>

      {/* Painel de detalhes */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: 'rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {!selected ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-dim)',
            fontStyle: 'italic',
            fontSize: '12px',
            textAlign: 'center',
            padding: '12px',
          }}>
            Selecione um arquivo à esquerda para ver seus detalhes.
          </div>
        ) : (
          <FileDetails path={selected.path} node={selected.node} />
        )}
      </div>
    </div>
  );
}

function FileDetails({ path, node }) {
  const isDir = node.type === 'dir';

  const row = (label, value, opts = {}) => (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '3px 0',
      fontSize: '11px',
      borderBottom: '1px dashed var(--color-border-a20)',
    }}>
      <span style={{
        color: 'var(--color-border)',
        minWidth: '120px',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        color: opts.color || 'var(--color-text)',
        wordBreak: 'break-all',
        fontFamily: opts.mono ? 'Fira Code, monospace' : 'inherit',
        fontWeight: opts.bold ? 'bold' : 'normal',
      }}>
        {value}
      </span>
    </div>
  );

  const contentPreview = !isDir && node.content
    ? node.content.slice(0, 400) + (node.content.length > 400 ? '\n\n... (truncado)' : '')
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--color-border-a40)',
        background: 'var(--color-bg-header)',
        flexShrink: 0,
      }}>
        <div style={{
          color: 'var(--color-command)',
          fontSize: '12px',
          fontWeight: 'bold',
          textShadow: 'var(--glow-soft)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {isDir ? '📁' : '📄'} {node.name}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-dim)',
          marginTop: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {path}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
      }}>
        {row('Tipo', isDir ? 'diretório' : 'arquivo')}
        {row('Dono', node.owner || '—', { color: node.owner === 'root' ? 'var(--color-warning)' : undefined })}
        {row('Permissões', formatPermissions(node), { mono: true })}
        {row('Tamanho', isDir ? '—' : formatSize(node.size || 0))}
        {row('Modificado', formatDate(node.lastModified))}
        {row('Oculto', node.hidden ? 'sim' : 'não', { color: node.hidden ? 'var(--color-command)' : undefined })}
        {row('Bloqueado', node.locked ? 'sim' : 'não', { color: node.locked ? 'var(--color-error)' : undefined })}
        {row('Requer sudo', node.requiresSudo ? 'sim' : 'não', { color: node.requiresSudo ? 'var(--color-error)' : undefined })}
        {row('Requer username', node.requiresUsername ? 'sim' : 'não')}
        {row('Tem senha', node.password ? 'sim' : 'não')}
        {row('Criado pelo usuário', node.userCreated ? 'sim' : 'não')}
        {row('É imagem', node.isImage ? 'sim' : 'não')}
        {row('É música', node.isMusic ? 'sim' : 'não')}

        {isDir && row('Filhos', String(Object.keys(node.children || {}).length))}

        {contentPreview && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-border)',
              letterSpacing: '1px',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}>
              ▸ preview do conteúdo
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--color-border-a30)',
              borderRadius: '3px',
              padding: '8px 10px',
              fontSize: '11px',
              color: 'var(--color-text)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '180px',
              overflowY: 'auto',
              fontFamily: 'Fira Code, monospace',
              lineHeight: 1.45,
              margin: 0,
            }}>
              {contentPreview}
            </pre>
          </div>
        )}

        {node.meta && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-border)',
              letterSpacing: '1px',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}>
              ▸ metadados
            </div>
            {Object.entries(node.meta).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex',
                gap: '8px',
                fontSize: '11px',
                padding: '2px 0',
              }}>
                <span style={{ color: 'var(--color-border)', minWidth: '90px' }}>{k}:</span>
                <span style={{ color: 'var(--color-command)' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}