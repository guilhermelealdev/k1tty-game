import React from 'react';

export default function K1ttyRecursive() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{ fontSize: '24px', marginBottom: '15px' }}>
        🐱 k1tty dentro de k1tty 🐱
      </div>
      <pre style={{ fontSize: '14px', lineHeight: '1.4' }}>
{`
┌─────────────────────┐
│  ┌───────────────┐  │
│  │  k1tty        │  │
│  │  ┌─────────┐  │  │
│  │  │ k1tty    │  │  │
│  │  │  ┌────┐  │  │  │
│  │  │  │k1tty│  │  │  │
│  │  │  └────┘  │  │  │
│  │  └─────────┘  │  │
│  └───────────────┘  │
└─────────────────────┘
`}
      </pre>
      <div style={{ fontSize: '12px', color: '#5a7a5a', marginTop: '10px' }}>
        É recursão até onde os olhos podem ver...
      </div>
    </div>
  );
}