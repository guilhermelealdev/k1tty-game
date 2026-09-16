// src/components/TUIViewers/BluetoothViewer.jsx

import React, { useState, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';

const deviceList = [
  { id: 1, name: 'JBL Speaker', type: 'audio', pairable: false },
  { id: 2, name: 'Samsung TV', type: 'video', pairable: false },
  { id: 3, name: 'Alexa Echo', type: 'assistant', pairable: false },
  { id: 4, name: 'iPhone do vizinho', type: 'phone', pairable: false },
  { id: 5, name: 'Fone Bluetooth', type: 'audio', pairable: false },
  { id: 6, name: 'k1tty-phone', type: 'phone', pairable: true },
  { id: 7, name: 'Smartwatch', type: 'wearable', pairable: false },
  { id: 8, name: 'Mouse sem fio', type: 'input', pairable: false },
  { id: 9, name: 'Teclado Bluetooth', type: 'input', pairable: false },
];

export default function BluetoothViewer() {
  const { state, dispatch } = useGame();
  const [discovered, setDiscovered] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [transferred, setTransferred] = useState(false);

  const addLog = useCallback((message) => {
    setLogs(prev => [...prev, message]);
  }, []);

  const startScan = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    addLog('🔍 Procurando dispositivos bluetooth...');

    let delay = 0;
    deviceList.forEach((device, index) => {
      setTimeout(() => {
        setDiscovered(prev => {
          if (prev.find(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
        addLog(`  ✓ Encontrado: ${device.name}`);
        if (index === deviceList.length - 1) {
          setIsScanning(false);
          addLog('Scan completo.');
        }
      }, delay);
      delay += 400;
    });
  }, [addLog, isScanning]);

  const connectToDevice = useCallback((device) => {
    if (connectedDevice) {
      addLog(`Já conectado a ${connectedDevice.name}. Desconecte primeiro.`);
      return;
    }
    addLog(`🔄 Tentando conectar a ${device.name}...`);

    setTimeout(() => {
      if (device.pairable) {
        setConnectedDevice(device);
        addLog(`✅ Conectado a ${device.name}!`);
        addLog('📂 Aguardando transferência de arquivos...');

        setTimeout(() => {
          addLog('📩 Recebendo: lyric_1.meow ...');
          setTimeout(() => {
            addLog('📩 Recebendo: lyric_2.meow ...');
            setTimeout(() => {
              addLog('📩 Recebendo: lyric_3.meow ...');
              setTimeout(() => {
                addLog('📩 Recebendo: lyric_4.meow ...');
                setTimeout(() => {
                  addLog('📩 Recebendo: lyric_5.meow ...');
                  setTimeout(() => {
                    addLog('📦 Recebendo: Music_Locked/music_pack.zip ...');
                    setTimeout(() => {
                      addLog('✓ 6 arquivos recebidos em ~/from_phone/');
                      setTransferred(true);
                      dispatch({ type: 'RECEIVE_PHONE_FILES' });
                    }, 400);
                  }, 400);
                }, 300);
              }, 300);
            }, 300);
          }, 300);
        }, 1200);
      } else {
        addLog(`❌ ${device.name} negou o pareamento.`);
      }
    }, 800);
  }, [connectedDevice, addLog, dispatch]);

  const disconnect = useCallback(() => {
    if (connectedDevice) {
      addLog(`🔌 Desconectado de ${connectedDevice.name}`);
      setConnectedDevice(null);
    }
  }, [connectedDevice, addLog]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <button className="tui-button" onClick={startScan} disabled={isScanning}>
          {isScanning ? 'Escaneando...' : '🔍 Escanear dispositivos'}
        </button>
        {connectedDevice && (
          <button className="tui-button" onClick={disconnect}>
            🔌 Desconectar
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: '3px',
        background: 'var(--color-bg-panel)',
        padding: '8px',
      }}>
        {discovered.length === 0 && !isScanning && (
          <div style={{ color: 'var(--color-dim)' }}>Nenhum dispositivo encontrado. Clique em "Escanear".</div>
        )}
        {discovered.map(device => (
          <div key={device.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 0',
            borderBottom: '1px solid var(--color-border-a30)',
            color: 'var(--color-text)',
          }}>
            <span>📡 {device.name}</span>
            <button
              className="tui-button"
              style={{ fontSize: '11px' }}
              onClick={() => connectToDevice(device)}
              disabled={connectedDevice !== null}
            >
              Conectar
            </button>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '8px',
        maxHeight: '180px',
        overflow: 'auto',
        fontSize: '12px',
        color: 'var(--color-text)',
        background: 'var(--color-bg-deep)',
        border: '1px solid var(--color-border-a30)',
        borderRadius: '3px',
        padding: '6px',
      }}>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
}