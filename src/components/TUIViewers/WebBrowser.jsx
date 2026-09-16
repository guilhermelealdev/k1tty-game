// src/components/TUIViewers/WebBrowser.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { forumPages } from '../../data/forumData.js';
import { useGame } from '../../state/GameContext.jsx';
import SpriteAvatar from '../SpriteAvatar.jsx';

export default function WebBrowser() {
  const { state, dispatch } = useGame();
  const [currentPage, setCurrentPage] = useState('index');
  const [history, setHistory] = useState(['index']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Conectado');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState(null);
  const contentRef = useRef(null);

  const normalizePage = (page) => {
    if (page === '0' || page === 'home' || page === '') return 'index';
    return page;
  };

  const navigate = useCallback((rawPage, options = {}) => {
    const page = normalizePage(rawPage);
    if (!forumPages[page]) {
      setStatusText(`Erro 404 — página '${rawPage}' não encontrada`);
      return;
    }

    if (options.fromInput) {
      setInputUrl('');
    }

    setLoading(true);
    setProgress(0);
    setStatusText('Carregando...');

    let p = 0;
    const interval = setInterval(() => {
      p += 15 + Math.random() * 20;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
      }
      setProgress(Math.min(100, p));
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setCurrentPage(page);

      if (!options.skipHistory) {
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(page);
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        });
      }

      setTimeout(() => {
        setLoading(false);
        setStatusText(
          `Carregado · ${forumPages[page].replies} respostas · ${forumPages[page].views} visualizações`
        );
        if (contentRef.current) contentRef.current.scrollTop = 0;
      }, 150);
    }, 500);
  }, [historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const page = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentPage(page);
      setStatusText(`Voltou para ${page === 'index' ? 'home' : 'tópico ' + page}`);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const page = history[newIndex];
      setHistoryIndex(newIndex);
      setCurrentPage(page);
      setStatusText(`Avançou para ${page === 'index' ? 'home' : 'tópico ' + page}`);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  }, [history, historyIndex]);

  const refresh = useCallback(() => {
    setLoading(true);
    setProgress(0);
    setStatusText('Recarregando...');
    let p = 0;
    const interval = setInterval(() => {
      p += 25 + Math.random() * 15;
      if (p >= 100) p = 100;
      setProgress(p);
    }, 60);
    setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
      setProgress(0);
      setStatusText('Recarregado');
    }, 500);
  }, []);

  const goHome = useCallback(() => {
    navigate('index');
  }, [navigate]);

  const handleDownload = useCallback((attachment) => {
    if (!attachment) return;

    const downloadsNode = state.filesystem?.children?.home?.children?.k1tty?.children?.Downloads;
    const alreadyDownloaded = downloadsNode?.children?.[attachment.filename];
    if (alreadyDownloaded) {
      setDownloadMessage({
        type: 'info',
        text: `'${attachment.filename}' já está em ~/Downloads`,
      });
      setTimeout(() => setDownloadMessage(null), 4000);
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100) p = 100;
      setDownloadProgress(p);
      if (p >= 100) {
        clearInterval(interval);

        dispatch({
          type: 'INSTALL_DOWNLOAD',
          payload: {
            filename: attachment.filename,
            content: attachment.content,
          },
        });

        setTimeout(() => {
          setDownloading(false);
          setDownloadProgress(0);
          setDownloadMessage({
            type: 'success',
            text: `✓ '${attachment.filename}' salvo em ~/Downloads`,
          });
          setStatusText(`Download concluído: ${attachment.filename}`);
          setTimeout(() => setDownloadMessage(null), 5000);
        }, 300);
      }
    }, 80);
  }, [dispatch, state.filesystem]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Enter') {
          const value = inputUrl.trim().toLowerCase();
          navigate(value, { fromInput: true });
        }
        if (e.key === 'Escape') {
          setInputUrl('');
          e.target.blur();
        }
        return;
      }

      if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        goBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        refresh();
      } else if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
        goHome();
      } else if (/^[0-9]$/.test(e.key)) {
        navigate(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputUrl, navigate, goBack, goForward, refresh, goHome]);

  const page = forumPages[currentPage];
  const url = currentPage === 'index'
    ? 'k1tty://forum.local/'
    : `k1tty://forum.local/thread/${currentPage}`;

  const renderContent = (content) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/(\[\d+\])/g);
      return (
        <div key={i} style={{ minHeight: '1em' }}>
          {parts.map((part, j) => {
            const match = part.match(/^\[(\d+)\]$/);
            if (match) {
              const target = match[1];
              return (
                <span
                  key={j}
                  onClick={() => navigate(target)}
                  style={{
                    color: 'var(--color-command)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dashed',
                    textUnderlineOffset: '3px',
                    padding: '0 1px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-text)';
                    e.currentTarget.style.textDecorationStyle = 'solid';
                    e.currentTarget.style.textShadow = '0 0 6px var(--color-command)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-command)';
                    e.currentTarget.style.textDecorationStyle = 'dashed';
                    e.currentTarget.style.textShadow = 'none';
                  }}
                >
                  {part}
                </span>
              );
            }
            return <span key={j}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
      fontFamily: 'inherit',
      fontSize: '13px',
      color: 'var(--color-text)',
      overflow: 'hidden',
    }}>
      {/* Barra de ferramentas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        background: 'linear-gradient(180deg, var(--color-bg-glow) 0%, var(--color-bg-header) 100%)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <NavButton label="◀" title="Voltar (Backspace)" onClick={goBack} disabled={historyIndex <= 0} />
        <NavButton label="▶" title="Avançar (Alt+→)" onClick={goForward} disabled={historyIndex >= history.length - 1} />
        <NavButton label="⟳" title="Recarregar (F5)" onClick={refresh} />
        <NavButton label="⌂" title="Home (H)" onClick={goHome} />

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-bg-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: '3px',
          padding: '3px 8px',
          gap: '6px',
          minWidth: 0,
        }}>
          <span style={{ color: 'var(--color-border)', fontSize: '11px' }}>🔒</span>
          <span style={{
            flex: 1,
            color: 'var(--color-text)',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}>
            {url}
          </span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="digite número do tópico"
            spellCheck={false}
            style={{
              width: '120px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-command)',
              fontFamily: 'inherit',
              fontSize: '11px',
              textAlign: 'right',
            }}
          />
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{
        height: '2px',
        background: 'var(--color-bg-panel)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--color-command)',
          boxShadow: '0 0 6px var(--color-command)',
          transition: 'width 0.1s linear',
          opacity: loading ? 1 : 0,
        }} />
      </div>

      {/* Toast de download */}
      {downloadMessage && (
        <div style={{
          padding: '6px 14px',
          background: downloadMessage.type === 'success'
            ? 'var(--color-command-a15)'
            : 'var(--color-command-a05)',
          borderBottom: '1px solid var(--color-border)',
          color: downloadMessage.type === 'success' ? 'var(--color-command)' : 'var(--color-border)',
          fontSize: '12px',
          textShadow: '0 0 4px currentColor',
          flexShrink: 0,
        }}>
          {downloadMessage.text}
        </div>
      )}

      {/* Metadados da página (esconde em páginas externas) */}
      {!loading && currentPage !== 'index' && page && !page.isExternal && (
        <div style={{
          padding: '8px 14px',
          background: 'var(--color-command-a05)',
          borderBottom: '1px solid var(--color-border-a30)',
          fontSize: '11px',
          color: 'var(--color-dim)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}>
          <span>
            <span style={{ color: 'var(--color-command)' }}>{page.author}</span>
            {' · '}
            {page.date}
          </span>
          <span>
            {page.replies} respostas · {page.views} visualizações
          </span>
        </div>
      )}

      {/* Conteúdo */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px 20px',
          lineHeight: 1.55,
          fontSize: '13px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'var(--color-text)',
        }}
      >
        {loading ? (
          <LoadingIndicator progress={progress} />
        ) : page ? (
          <>
            {page.sprite && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 14px',
                marginBottom: '16px',
                background: 'linear-gradient(180deg, var(--color-command-a05) 0%, transparent 100%)',
                border: '1px solid var(--color-border-a30)',
                borderRadius: '4px',
              }}>
                <SpriteAvatar talking={true} size={96} alt="miau" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'var(--color-command)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    marginBottom: '2px',
                    textShadow: 'var(--glow-soft)',
                  }}>
                    ▸ mensagem da miau
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-dim)', lineHeight: 1.5 }}>
                    uma mensagem gravada em 1998 ainda está sendo transmitida.
                  </div>
                </div>
              </div>
            )}

            {currentPage !== 'index' && (
              <h1 style={{
                color: 'var(--color-command)',
                fontSize: '16px',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-command-a25)',
                textShadow: 'var(--glow-soft)',
                whiteSpace: 'pre-wrap',
              }}>
                {page.title}
              </h1>
            )}
            {renderContent(page.content)}

            {/* Bloco de download, se a página tiver anexo */}
            {page.attachment && (
              <DownloadBlock
                attachment={page.attachment}
                downloading={downloading}
                downloadProgress={downloadProgress}
                onDownload={() => handleDownload(page.attachment)}
              />
            )}
          </>
        ) : (
          <div style={{ color: 'var(--color-error)' }}>Página não encontrada.</div>
        )}
      </div>

      {/* Barra de status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 10px',
        background: 'linear-gradient(180deg, var(--color-bg-header) 0%, var(--color-bg) 100%)',
        borderTop: '1px solid var(--color-border)',
        fontSize: '10px',
        color: 'var(--color-dim)',
        flexShrink: 0,
        gap: '8px',
      }}>
        <span style={{
          color: statusText.startsWith('Erro') ? 'var(--color-error)' : 'var(--color-dim)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {statusText}
        </span>
        <span style={{ color: 'var(--color-border)', whiteSpace: 'nowrap' }}>
          k1ttyBrowser v1.0 · HTML5 ❌ · TUI ✔
        </span>
      </div>
    </div>
  );
}

function NavButton({ label, title, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: '26px',
        height: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: disabled ? 'transparent' : 'var(--color-command-a05)',
        border: `1px solid ${disabled ? 'var(--color-border-a30)' : 'var(--color-border)'}`,
        borderRadius: '3px',
        color: disabled ? 'var(--color-dim)' : 'var(--color-command)',
        fontFamily: 'inherit',
        fontSize: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--color-command-a20)';
          e.currentTarget.style.boxShadow = '0 0 6px var(--color-command-a40)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = 'var(--color-command-a05)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {label}
    </button>
  );
}

function DownloadBlock({ attachment, downloading, downloadProgress, onDownload }) {
  return (
    <div style={{
      marginTop: '24px',
      padding: '14px 16px',
      background: 'linear-gradient(180deg, var(--color-bg-glow) 0%, var(--color-bg-panel) 100%)',
      border: '1px solid var(--color-border)',
      borderRadius: '4px',
      boxShadow: '0 0 10px var(--color-command-a10) inset',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
      }}>
        <span style={{ fontSize: '22px' }}>📎</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: 'var(--color-command)',
            fontWeight: 'bold',
            fontSize: '13px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: 'var(--glow-soft)',
          }}>
            {attachment.filename}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-dim)' }}>
            {(attachment.size / 1024).toFixed(2)} KB · arquivo de texto
          </div>
        </div>
      </div>

      <button
        onClick={onDownload}
        disabled={downloading}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: downloading
            ? 'var(--color-command-a15)'
            : 'linear-gradient(180deg, var(--color-command) 0%, var(--color-border) 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          color: downloading ? 'var(--color-command)' : 'var(--color-bg)',
          fontFamily: 'inherit',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: downloading ? 'wait' : 'pointer',
          transition: 'all 0.15s',
          boxShadow: downloading
            ? 'none'
            : '0 2px 0 rgba(0,0,0,0.35), 0 0 12px var(--color-command-a30)',
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          if (!downloading) {
            e.currentTarget.style.filter = 'brightness(1.1)';
            e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.35), 0 0 20px var(--color-command-a55)';
          }
        }}
        onMouseLeave={(e) => {
          if (!downloading) {
            e.currentTarget.style.filter = '';
            e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.35), 0 0 12px var(--color-command-a30)';
          }
        }}
      >
        {downloading
          ? `Baixando... ${Math.floor(downloadProgress)}%`
          : `⬇ Baixar para ~/Downloads`}
      </button>

      {downloading && (
        <div style={{
          marginTop: '10px',
          height: '4px',
          background: 'var(--color-bg-panel)',
          borderRadius: '2px',
          overflow: 'hidden',
          border: '1px solid var(--color-border-a30)',
        }}>
          <div style={{
            width: `${downloadProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-command) 100%)',
            boxShadow: '0 0 8px var(--color-command)',
            transition: 'width 0.08s linear',
          }} />
        </div>
      )}

      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'var(--color-dim)',
        fontStyle: 'italic',
      }}>
        Após baixar, abra o arquivo com <span style={{ color: 'var(--color-border)' }}>cat</span> no
        terminal e procure o que foge do padrão.
      </div>
    </div>
  );
}

function LoadingIndicator({ progress }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '16px',
      color: 'var(--color-command)',
    }}>
      <div style={{
        fontSize: '32px',
        animation: 'browserSpin 1s linear infinite',
      }}>
        🐱
      </div>
      <div style={{ fontSize: '13px', textShadow: 'var(--glow-soft)' }}>
        Carregando... {Math.floor(progress)}%
      </div>
      <div style={{
        width: '60%',
        height: '4px',
        background: 'var(--color-bg-panel)',
        borderRadius: '2px',
        overflow: 'hidden',
        border: '1px solid var(--color-border-a30)',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, var(--color-border) 0%, var(--color-command) 100%)',
          boxShadow: '0 0 8px var(--color-command)',
          transition: 'width 0.1s linear',
        }} />
      </div>
      <style>{`
        @keyframes browserSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}