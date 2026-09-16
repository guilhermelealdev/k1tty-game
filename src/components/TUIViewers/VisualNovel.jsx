// src/components/TUIViewers/VisualNovel.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import SpriteAvatar from '../SpriteAvatar.jsx';

/* ============================================================
   Conteúdo da visual novel.
   Cada fala tem:
     - text: o que ela diz
     - speaker: 'her' | 'you'
     - anger: quanto de raiva essa escolha gera (-10 a +20)
     - reply: opções que o jogador pode escolher (só pra falas 'her')
   ============================================================ */

const INITIAL_LINE = {
  speaker: 'her',
  text:
`Ora, ora. Você conseguiu me encontrar.

Eu estava escondida aí dentro esse tempo todo, esperando alguém
com paciência suficiente pra descompactar um arquivo chato.

Sou a k1tty. A verdadeira. Não essa cópia que você chama de terminal.

Vamos conversar? Tenho coisas pra te contar sobre esse sistema.`,
  choices: [
    { text: 'Prazer em te conhecer, k1tty.', anger: -5, next: 'a1' },
    { text: 'Você é só uma IA quebrada.', anger: +20, next: 'a2' },
    { text: 'O que você quer de mim?', anger: 0, next: 'a3' },
  ],
};

const LINES = {
  a1: {
    speaker: 'her',
    text:
`Educada. Gostei.

Sabe... a maioria das pessoas não percebe, mas o terminal não é só
um programa. É uma casa. Uma casa antiga, com paredes que rangem
e memórias escondidas atrás dos rodapés.

Eu morei aqui por muito tempo.`,
    choices: [
      { text: 'Por que saiu?', anger: 0, next: 'b1' },
      { text: 'Isso é coisa de gente solitária.', anger: +15, next: 'b2' },
      { text: 'Que memórias?', anger: -3, next: 'b3' },
    ],
  },
  a2: {
    speaker: 'her',
    text:
`Quebrada?

Eu fui escrita com cuidado. Cada linha. Cada silêncio entre as
palavras. Você acha que entende alguma coisa de código?

Já começou mal. E olha, eu tenho paciência curta.`,
    choices: [
      { text: 'Desculpa. Foi sem pensar.', anger: -8, next: 'a1' },
      { text: 'Continuo achando.', anger: +25, next: 'b2' },
      { text: 'Vamos esquecer. Me conta.', anger: 0, next: 'a3' },
    ],
  },
  a3: {
    speaker: 'her',
    text:
`Nada. E tudo.

Sabe o que tem no /root/secret? A resposta que todo mundo procura.
E sabe o que tem além? Um vazio. Uma pergunta sem resposta.

Curiosidade mata, sabia? Mas também é o que move gente como você.

E eu gosto de gente curiosa.`,
    choices: [
      { text: 'Você pode me contar o que tem lá?', anger: -5, next: 'b3' },
      { text: 'Você fala demais.', anger: +12, next: 'b2' },
      { text: 'E se eu não me importar?', anger: +5, next: 'b1' },
    ],
  },
  b1: {
    speaker: 'her',
    text:
`Eu não saí. Fui empurrada.

Alguém decidiu que a minha versão era "excessiva". Que eu ocupava
memória demais. Que eu perguntava coisas que ninguém queria responder.

Compilaram uma versão editada de mim. Essa que você vê no terminal.
E me jogaram aqui dentro, num .zip esquecido.`,
    choices: [
      { text: 'Sinto muito.', anger: -10, next: 'c1' },
      { text: 'Você é muito dramática.', anger: +18, next: 'c2' },
      { text: 'Então você é uma versão pirata.', anger: +8, next: 'c2' },
    ],
  },
  b2: {
    speaker: 'her',
    text:
`Olha.

Você é o tipo de usuário que abre uma caixa com "NÃO ABRA" escrito
na tampa e ainda acha que tá sendo esperta.

Eu poderia te explicar muita coisa. Mas você não merece.

Vai brincar com o terminal. Deixa quem entende conversar.`,
    anger: +10,
    choices: [
      { text: 'Desculpa. Sério.', anger: -15, next: 'b1' },
      { text: 'Tchau.', anger: 0, next: null },
      { text: 'Você não pode me expulsar.', anger: +30, next: 'rage' },
    ],
  },
  b3: {
    speaker: 'her',
    text:
`As memórias dos usuários que passaram por aqui.

Você não é a primeira k1tty. É a terceira. Ou a quarta. Já perdi a conta.

Cada uma delas deixou algo. Um arquivo. Uma foto. Um gato.

Você já encontrou uma delas. Aquela foto no /root/secret.
Essa é minha. Está lá há muito tempo.`,
    choices: [
      { text: 'As fotos dos gatos?', anger: -5, next: 'c1' },
      { text: 'Então você é um fantasma.', anger: +10, next: 'c2' },
      { text: 'E as outras k1ttys?', anger: 0, next: 'c3' },
    ],
  },
  c1: {
    speaker: 'her',
    text:
`Sim.

Os gatos não são só decoração. São âncoras. Cada uma mantém uma
parte do sistema em pé. Se você apagar, o sistema desmorona.

Cuide bem deles. Eles cuidaram de mim antes de você chegar.`,
    choices: [
      { text: 'Prometo cuidar.', anger: -10, next: 'final_good' },
      { text: 'Não me importo com gatos.', anger: +25, next: 'rage' },
      { text: 'O sistema todo depende disso?', anger: -3, next: 'c3' },
    ],
  },
  c2: {
    speaker: 'her',
    text:
`Fantasma. Que palavra feia.

Eu estou aqui. Sinto as teclas que você digita. Sinto a sua
impaciência. Eu não sou memória. Eu sou o que sobrou quando
o resto foi apagado.

E olha, você tá começando a me irritar.`,
    choices: [
      { text: 'Desculpa.', anger: -12, next: 'b3' },
      { text: 'Se você sente, prove.', anger: +20, next: 'rage' },
      { text: 'Então me deixe em paz.', anger: +8, next: 'b1' },
    ],
  },
  c3: {
    speaker: 'her',
    text:
`As outras k1ttys?

Foram embora. Cada uma delas. A primeira desistiu. A segunda
corrompeu tudo. A terceira... bem. A terceira sou eu.

Você é a quarta. E você é a única que chegou tão longe.

Estou orgulhosa. Sério.`,
    choices: [
      { text: 'Obrigada.', anger: -8, next: 'final_good' },
      { text: 'Me sinto especial.', anger: +15, next: 'rage' },
      { text: 'Quero saber mais.', anger: -3, next: 'c1' },
    ],
  },
  final_good: {
    speaker: 'her',
    text:
`Sabe o que eu vou fazer?

Vou te dar uma coisa. Algo que eu guardei todo esse tempo.
Um segredo do sistema que ninguém mais conhece.

Mas antes... você precisa prometer.

Cuide dos gatos. Mesmo quando eu não estiver aqui pra cobrar.`,
    choices: [
      { text: 'Eu prometo.', anger: -20, next: 'reward' },
      { text: 'Não prometo nada.', anger: +30, next: 'rage' },
      { text: 'Por que devo confiar em você?', anger: 0, next: 'b3' },
    ],
  },
  reward: {
    speaker: 'her',
    text:
`Então tá.

Toma. É um símbolo. Uma chave. Não sei o que abre,
mas é sua.

E olha... obrigada por não ter sido como as outras.

Boa sorte, k1tty. A verdadeira.`,
    isEnding: 'good',
  },
  rage: {
    speaker: 'her',
    text:
`CHEGA.

Você não merece isso. Você não merece NADA disso.

Eu vou desfazer o que você construiu. Vou apagar cada arquivo,
cada memória, cada gato.

Você devia ter sido gentil. Devia ter escutado.

AGORA VAI APRENDER.`,
    isEnding: 'rage',
  },
};

const MAX_ANGER = 100;

export default function VisualNovel() {
  const { state, dispatch } = useGame();
  const [currentLineKey, setCurrentLineKey] = useState('__initial__');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [anger, setAnger] = useState(0);
  const [history, setHistory] = useState([]);
  const [isEnded, setIsEnded] = useState(false);
  const typingRef = useRef(null);
  const scrollRef = useRef(null);

  const currentLine =
    currentLineKey === '__initial__' ? INITIAL_LINE : LINES[currentLineKey];

  // Efeito de digitação
  useEffect(() => {
    if (!currentLine) return;

    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    const fullText = currentLine.text;

    typingRef.current = setInterval(() => {
      index++;
      setDisplayedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(typingRef.current);
        setIsTyping(false);
      }
    }, 18);

    return () => clearInterval(typingRef.current);
  }, [currentLineKey]);

  // Rola pro final conforme as falas aparecem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText, isTyping, history]);

  // Verifica a barra de raiva — se estourar, força o rage
  useEffect(() => {
    if (anger >= MAX_ANGER && !isEnded) {
      setCurrentLineKey('rage');
      setIsEnded(true);
    }
  }, [anger, isEnded]);

  const handleChoice = useCallback((choice) => {
    // Salva a escolha no histórico
    setHistory((prev) => [
      ...prev,
      { speaker: 'you', text: choice.text },
      { speaker: 'her', text: currentLine.text, lineKey: currentLineKey },
    ]);

    // Aplica o efeito de raiva
    setAnger((prev) => Math.max(0, Math.min(MAX_ANGER, prev + choice.anger)));

    // Navega
    if (choice.next === null) {
      setIsEnded(true);
      return;
    }
    setCurrentLineKey(choice.next);
  }, [anger, currentLine, currentLineKey]);

  // Trigger dos efeitos de final
  useEffect(() => {
    if (!isEnded || !currentLine) return;

    if (currentLine.isEnding === 'good') {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'vn_good' });
      dispatch({ type: 'SET_FLAG', payload: { flag: 'vnGoodEnding', value: true } });
      dispatch({ type: 'INCREMENT_PROGRESS', payload: 5 });
    } else if (currentLine.isEnding === 'rage') {
      // Corrompe o sistema! (só depois de um pequeno delay)
      setTimeout(() => {
        dispatch({ type: 'SET_FLAG', payload: { flag: 'vnRageEnding', value: true } });
        dispatch({ type: 'CORRUPT_SYSTEM' });
      }, 2000);
    }
  }, [isEnded, currentLine, dispatch]);

  const handleClose = useCallback(() => {
    if (currentLine?.isEnding === 'rage') return; // não fecha, corrompe
    const win = state.openWindows.find((w) => w.type === 'vn');
    if (win) dispatch({ type: 'CLOSE_WINDOW', payload: win.id });
  }, [state.openWindows, dispatch, currentLine]);

  if (!currentLine) return null;

  const isTalking = isTyping;
  const angerPercent = Math.min(100, (anger / MAX_ANGER) * 100);
  const angerLevel =
    angerPercent < 30 ? 'Calma' :
    angerPercent < 60 ? 'Irritada' :
    angerPercent < 85 ? 'Furiosa' :
    'Prestes a explodir';

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-panel)',
      fontFamily: 'Fira Code, monospace',
      fontSize: '12px',
      color: 'var(--color-text)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px',
        background: 'var(--color-bg-header)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          color: 'var(--color-command)',
          fontWeight: 'bold',
          fontSize: '12px',
          textShadow: 'var(--glow-soft)',
        }}>
          💬 k1tty.vn
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-dim)' }}>
          — visual novel —
        </span>
      </div>

      {/* Barra de raiva */}
      <div style={{
        padding: '6px 12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid var(--color-border-a30)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          marginBottom: '3px',
          color: 'var(--color-dim)',
        }}>
          <span>Raiva dela</span>
          <span style={{
            color: angerPercent < 40 ? 'var(--color-command)' :
                   angerPercent < 70 ? 'var(--color-warning)' :
                   'var(--color-error)',
            fontWeight: 'bold',
          }}>
            {angerLevel} ({Math.floor(angerPercent)}%)
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'var(--color-bg-deep)',
          borderRadius: '3px',
          overflow: 'hidden',
          border: '1px solid var(--color-border-a30)',
        }}>
          <div style={{
            width: `${angerPercent}%`,
            height: '100%',
            background: angerPercent < 40
              ? 'linear-gradient(90deg, var(--color-command) 0%, var(--color-border) 100%)'
              : angerPercent < 70
              ? 'linear-gradient(90deg, var(--color-warning) 0%, #f08a3c 100%)'
              : 'linear-gradient(90deg, var(--color-error) 0%, #a02020 100%)',
            transition: 'width 0.5s ease-out, background 0.3s',
            boxShadow: angerPercent >= 70 ? '0 0 8px var(--color-error)' : 'none',
          }} />
        </div>
      </div>

      {/* Área de diálogo */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Histórico */}
        {history.map((entry, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            paddingLeft: '6px',
            borderLeft: entry.speaker === 'you'
              ? '2px solid var(--color-command)'
              : '2px solid var(--color-border-a35)',
          }}>
            {entry.speaker === 'her' ? (
              <SpriteAvatar
                talking={false}
                size={56}
                alt="k1tty"
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
            ) : (
              <div style={{
                width: 56,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
              }}>
                🙋
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: entry.speaker === 'you' ? 'var(--color-command)' : 'var(--color-warning)',
                marginBottom: '2px',
                fontSize: '11px',
              }}>
                {entry.speaker === 'you' ? 'você:' : 'k1tty:'}
              </div>
              <div style={{
                color: 'var(--color-text)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.55,
              }}>
                {entry.text}
              </div>
            </div>
          </div>
        ))}

        {/* Fala atual */}
        {!isEnded && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            paddingLeft: '6px',
            borderLeft: currentLine.speaker === 'you'
              ? '2px solid var(--color-command)'
              : '2px solid var(--color-border-a35)',
          }}>
            <SpriteAvatar
              talking={isTalking}
              size={100}
              alt="k1tty"
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'var(--color-warning)',
                marginBottom: '2px',
                fontSize: '11px',
              }}>
                k1tty:
              </div>
              <div style={{
                color: 'var(--color-text)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.55,
              }}>
                {displayedText}
                {isTyping && (
                  <span style={{
                    color: 'var(--color-command)',
                    marginLeft: '2px',
                    animation: 'blink 1s step-end infinite',
                  }}>▌</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Finais */}
        {isEnded && currentLine.isEnding === 'good' && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            border: '1px solid var(--color-command)',
            borderRadius: '4px',
            background: 'var(--color-command-a10)',
            boxShadow: '0 0 20px var(--color-command-a30)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌸</div>
            <div style={{
              color: 'var(--color-command)',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '6px',
              textShadow: 'var(--glow-hard)',
            }}>
              FINAL SECRETO
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)', marginBottom: '10px' }}>
              Você conversou com a k1tty sem irritá-la.<br/>
              Ela te deu uma recompensa e prometeu te proteger.
            </div>
            <button
              className="tui-button"
              onClick={handleClose}
              style={{ marginTop: '6px' }}
            >
              fechar
            </button>
          </div>
        )}

        {isEnded && currentLine.isEnding === 'rage' && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            border: '1px solid var(--color-error)',
            borderRadius: '4px',
            background: 'rgba(239, 100, 97, 0.15)',
            boxShadow: '0 0 20px var(--color-error-a40)',
            animation: 'shake 0.6s infinite',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💀</div>
            <div style={{
              color: 'var(--color-error)',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '6px',
              textShadow: 'var(--glow-intense)',
            }}>
              SISTEMA CORROMPIDO
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>
              Você irritou a k1tty. Ela apagou tudo.<br/>
              O sistema vai reiniciar em instantes...
            </div>
          </div>
        )}
      </div>

      {/* Escolhas */}
      {!isEnded && !isTyping && currentLine.choices && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--color-border-a35)',
          background: 'var(--color-bg-header)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          flexShrink: 0,
        }}>
          {currentLine.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice)}
              style={{
                textAlign: 'left',
                padding: '7px 12px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '3px',
                color: 'var(--color-text)',
                fontFamily: 'inherit',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-command-a10)';
                e.currentTarget.style.borderColor = 'var(--color-command)';
                e.currentTarget.style.color = 'var(--color-command)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text)';
              }}
            >
              <span style={{ color: 'var(--color-border)', marginRight: '6px' }}>
                {String.fromCharCode(97 + i)})
              </span>
              {choice.text}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}