import React, { useState, useEffect } from 'react';
import { useGame } from '../../state/GameContext.jsx';

export default function BtopViewer() {
  const { state } = useGame();
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memUsage, setMemUsage] = useState(0);
  const [processes, setProcesses] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 40 + 10));
      setMemUsage(Math.floor(Math.random() * 30 + 40));

      const processList = [
        { name: 'k1tty-terminal', cpu: Math.floor(Math.random() * 20 + 5), mem: Math.floor(Math.random() * 200 + 50) },
        { name: 'gato-daemon', cpu: Math.floor(Math.random() * 15 + 2), mem: Math.floor(Math.random() * 150 + 30) },
        { name: 'purr-service', cpu: Math.floor(Math.random() * 10 + 1), mem: Math.floor(Math.random() * 100 + 20) },
        { name: 'meow-scheduler', cpu: Math.floor(Math.random() * 8 + 1), mem: Math.floor(Math.random() * 80 + 15) },
        { name: 'litter-cleaner', cpu: Math.floor(Math.random() * 5 + 1), mem: Math.floor(Math.random() * 50 + 10) },
      ];
      setProcesses(processList);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ fontSize: '14px', color: 'var(--color-command)', marginBottom: '10px' }}>
        📊 Monitor do Sistema
      </div>

      <div className="tui-box" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>CPU</span>
          <span>{cpuUsage}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--color-bg-header)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${cpuUsage}%`,
            height: '100%',
            backgroundColor: 'var(--color-command)',
            transition: 'width 0.5s',
          }} />
        </div>
      </div>

      <div className="tui-box" style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Memória</span>
          <span>{memUsage}%</span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--color-bg-header)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${memUsage}%`,
            height: '100%',
            backgroundColor: 'var(--color-border)',
            transition: 'width 0.5s',
          }} />
        </div>
      </div>

      <div>
        <strong>Processos:</strong>
        <table className="tui-table" style={{ marginTop: '5px' }}>
          <thead>
            <tr>
              <th>Processo</th>
              <th>CPU</th>
              <th>Mem (MB)</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc, i) => (
              <tr key={i}>
                <td>{proc.name}</td>
                <td>{proc.cpu}%</td>
                <td>{proc.mem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--color-dim)' }}>
        WiFi: {state.wifiConnected ? 'Conectado' : 'Desconectado'} |
        Pacotes: {state.installedPackages.length} |
        Progresso: {state.progress}%
      </div>
    </div>
  );
}