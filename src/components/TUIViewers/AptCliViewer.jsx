// src/components/TUIViewers/AptCliViewer.jsx

import React, { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { PACKAGES } from '../../data/packages.js';

const AVAILABLE_PACKAGES = PACKAGES.map(p => ({
  name: p.id,
  desc: p.label,
}));

export default function AptCliViewer() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  const isInstalled = (name) => state.installedPackages.includes(name);
  const installedCount = state.installedPackages.length;
  const totalCount = AVAILABLE_PACKAGES.length;

  const flashStatus = (msg) => {
    setStatus(msg);
    setTimeout(() => {
      setStatus(prev => (prev === msg ? '' : prev));
    }, 4000);
  };

  const handleInstall = (pkg) => {
    if (!state.wifiConnected) {
      flashStatus('Erro: sem conexão com a internet.');
      return;
    }
    if (isInstalled(pkg.name)) {
      flashStatus(`'${pkg.name}' já está instalado.`);
      return;
    }
    dispatch({ type: 'INSTALL_PACKAGE', payload: pkg.name });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 5 });
    flashStatus(`✓ ${pkg.name} instalado.`);
  };

  const handleRemove = (pkg) => {
    if (!isInstalled(pkg.name)) {
      flashStatus(`'${pkg.name}' não está instalado.`);
      return;
    }
    // Bloqueio: apt-cli não pode se auto-remover enquanto está rodando
    if (pkg.name === 'apt-cli') {
      flashStatus('Não é possível remover o apt-cli em execução.');
      return;
    }
    dispatch({ type: 'REMOVE_PACKAGE', payload: pkg.name });
    flashStatus(`✓ ${pkg.name} removido.`);
  };

  const handleCheckUpdates = () => {
    if (!state.wifiConnected) {
      flashStatus('Erro: sem conexão com a internet.');
      return;
    }
    setCheckingUpdates(true);
    flashStatus('Verificando atualizações...');
    setTimeout(() => {
      setCheckingUpdates(false);
      flashStatus('✓ Todos os pacotes estão atualizados.');
    }, 1200);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
      }}>
        <span style={{
          color: 'var(--color-command)',
          fontWeight: 600,
          textShadow: 'var(--glow-soft)',
        }}>
          apt-cli
          <span style={{
            marginLeft: '8px',
            fontSize: '11px',
            color: 'var(--color-dim)',
            fontWeight: 'normal',
          }}>
            {state.wifiConnected ? '🟢 online' : '🔴 offline'}
          </span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            color: 'var(--color-dim)',
          }}>
            {installedCount}/{totalCount} instalados
          </span>
          <button
            className="tui-button"
            onClick={handleCheckUpdates}
            disabled={checkingUpdates}
            style={{ fontSize: '11px', padding: '2px 10px' }}
          >
            {checkingUpdates ? '...' : '↻ atualizar'}
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflow: 'auto', padding: '6px' }}>
        <table className="tui-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Pacote</th>
              <th>Descrição</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Estado</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_PACKAGES.map(pkg => {
              const installed = isInstalled(pkg.name);
              const isSelf = pkg.name === 'apt-cli';

              return (
                <tr
                  key={pkg.name}
                  onMouseEnter={() => setSelected(pkg.name)}
                  onMouseLeave={() => setSelected(null)}
                  style={{
                    backgroundColor: selected === pkg.name
                      ? 'var(--color-command-a10)'
                      : 'transparent',
                  }}
                >
                  <td style={{
                    color: installed ? 'var(--color-command)' : 'var(--color-text)',
                    fontWeight: installed ? 'bold' : 'normal',
                  }}>
                    {pkg.name}
                    {isSelf && (
                      <span style={{
                        marginLeft: '6px',
                        fontSize: '9px',
                        color: 'var(--color-warning)',
                        opacity: 0.8,
                      }}>
                        (em uso)
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text)' }}>{pkg.desc}</td>
                  <td style={{
                    textAlign: 'center',
                    color: installed ? 'var(--color-command)' : 'var(--color-dim)',
                    fontSize: '11px',
                  }}>
                    {installed ? '✓ instalado' : 'disponível'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {installed ? (
                      <button
                        className="tui-button"
                        disabled={isSelf}
                        title={isSelf ? 'apt-cli não pode se auto-remover' : 'Remover pacote'}
                        style={{
                          fontSize: '11px',
                          padding: '2px 10px',
                          opacity: isSelf ? 0.4 : 1,
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => !isSelf && handleRemove(pkg)}
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        className="tui-button"
                        style={{ fontSize: '11px', padding: '2px 10px' }}
                        onClick={() => handleInstall(pkg)}
                        disabled={!state.wifiConnected}
                        title={!state.wifiConnected ? 'Sem conexão' : 'Instalar pacote'}
                      >
                        Instalar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / status */}
      <div style={{
        padding: '6px 10px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '12px',
        color: status.startsWith('✓')
          ? 'var(--color-command)'
          : status.startsWith('Erro') || status.startsWith('Não')
            ? 'var(--color-error)'
            : 'var(--color-dim)',
        minHeight: '24px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        {status || `${installedCount} pacote(s) instalado(s)`}
      </div>
    </div>
  );
}