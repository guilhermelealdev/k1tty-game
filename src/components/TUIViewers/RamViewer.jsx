import React, { useState, useEffect } from 'react';

export default function RamViewer() {
  const [ramAmount, setRamAmount] = useState(0);
  const [isInstalling, setIsInstalling] = useState(true);
  const [ads, setAds] = useState([]);

  const adsList = [
    '⬇️ Baixe RAM GRÁTIS agora!',
    '⚡ Acelere seu PC com RAM virtual!',
    '💾 +16GB de RAM instantânea!',
    '🚀 Seu sistema está lento? Instale RAM!',
    '🎉 RAM ilimitada por apenas R$0,00!',
  ];

  useEffect(() => {
    if (!isInstalling) return;

    const installInterval = setInterval(() => {
      setRamAmount(prev => {
        if (prev >= 64) {
          setIsInstalling(false);
          return prev;
        }
        return prev + 4;
      });
      setAds(prev => [...prev, adsList[Math.floor(Math.random() * adsList.length)]]);
    }, 500);

    return () => clearInterval(installInterval);
  }, [isInstalling]);

  const handleReset = () => {
    setRamAmount(0);
    setAds([]);
    setIsInstalling(true);
  };

  return (
    <div style={{ padding: '15px' }}>
      <div style={{ fontSize: '18px', color: 'var(--color-command)', marginBottom: '10px' }}>
        💾 Instalador de RAM Virtual
      </div>

      <div className="tui-box" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--color-command)' }}>
          {ramAmount} GB
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-dim)' }}>
          RAM instalada {isInstalling ? '(instalando...)' : '(concluído!)'}
        </div>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: 'var(--color-bg-header)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginTop: '10px',
        }}>
          <div style={{
            width: `${Math.min(100, (ramAmount / 64) * 100)}%`,
            height: '100%',
            backgroundColor: 'var(--color-command)',
            transition: 'width 0.5s',
          }} />
        </div>
      </div>

      <div style={{ marginTop: '15px', maxHeight: '150px', overflow: 'auto' }}>
        <strong>Propagandas recebidas:</strong>
        {ads.map((ad, i) => (
          <div key={i} className="tui-box" style={{ marginTop: '3px', fontSize: '12px' }}>
            {ad}
          </div>
        ))}
      </div>

      <button className="tui-button" style={{ marginTop: '10px' }} onClick={handleReset}>
        Reinstalar RAM
      </button>
    </div>
  );
}