// src/components/TUIViewers/TutorialWindow.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import { executeCommand } from '../../commands/parser.js';
import SpriteAvatar from '../SpriteAvatar.jsx';

const MODEL_NAME = 'miau-2.3b-instruct';
const MODEL_PARAMS = '2.3B';

const BOOT_STEPS = [
  'carregando binário miau...',
  'verificando integridade do modelo...',
  'alocando 2.3B parâmetros na memória...',
  'compilando tokens em cache local...',
  'pronto.',
];

const STEPS = [
  {
    id: 'intro',
    prompt: 'olá',
    response:
`miau. Sou a miau, uma assistente local rodando dentro do seu terminal.

Não vou fazer o trabalho por você. Meu papel é te dar direções quando você estiver perdida — nada além disso.

Vou te mostrar o básico em alguns passos curtos, com pequenas tarefas. Sempre que eu pedir um comando, digite abaixo e aperte Enter. Se quiser pular, é só clicar em "pular tutorial".`,
    tip: null,
    nextLabel: 'começar →',
  },
  {
    id: 'ls',
    prompt: 'por onde começo?',
    response:
`Todo sistema tem camadas. A primeira que você vê nunca é a última.

Comece pelo mais óbvio: veja onde você está e o que está ao seu redor.

Rode \`ls\` no campo abaixo.`,
    tip: 'ls',
    verify: ({ command }) => command === 'ls',
    nextLabel: 'feito →',
  },
  {
    id: 'ls-a',
    prompt: 'e se houver mais?',
    response:
`Sempre há mais.

Alguns arquivos preferem não ser vistos de primeira. Eles começam com um ponto. Para vê-los, você precisa pedir especificamente.

Tente \`ls -a\`.`,
    tip: 'ls -a',
    verify: ({ command, args }) =>
      command === 'ls' && args.some(a => a.replace(/^-+/, '').includes('a')),
    nextLabel: 'entendi →',
  },
  {
    id: 'cd-cat',
    prompt: 'e depois?',
    response:
`Navegue. Entre em pastas, saia delas, volte pra raiz do seu home.

E quando achar algo interessante, não deixe guardado. Arquivos existem pra serem lidos.

Rode \`cd Documents\` — ou \`cat readme.txt\` se preferir ler antes de entrar.`,
    tip: 'cd <pasta>  ·  cat <arquivo>',
    verify: ({ command }) => command === 'cd' || command === 'cat',
    nextLabel: 'ok →',
  },
  {
    id: 'nvim',
    prompt: 'e se eu quiser escrever alguma coisa?',
    response:
`Aí você abre o editor.

\`nvim\` é um editor de texto simples que mora numa janela. Digite o nome do arquivo e ele abre. Se o arquivo não existir, ele cria pra você.

Dentro do editor: \`Ctrl+S\` salva. \`Esc\` sai do modo de escrita. \`i\` volta pra escrita.

Tente criar um arquivo qualquer.`,
    tip: 'nvim teste.txt',
    verify: ({ command }) => command === 'nvim',
    nextLabel: 'bacana →',
  },
  {
    id: 'whoami',
    prompt: 'quem sou eu aqui?',
    response:
`Você é a k1tty. É a dona desta máquina — tecnicamente.

Mas existem lugares que mesmo a dona não acessa sem as credenciais certas. Não é uma prisão; é só uma fechadura.

Rode \`whoami\` pra confirmar.`,
    tip: 'whoami',
    verify: ({ command }) => command === 'whoami',
    nextLabel: 'faz sentido →',
  },
  {
    id: 'help',
    prompt: 'tem uma lista de tudo isso?',
    response:
`Tem. O \`help\` mostra o que você pode usar agora — comandos base e os pacotes que você instalou.

Conforme você instala mais coisas, essa lista cresce. Vale a pena voltar nele de vez em quando.

Rode \`help\` pra ver.`,
    tip: 'help',
    verify: ({ command }) => command === 'help',
    nextLabel: 'legal →',
  },
  {
    id: 'net',
    prompt: 'tem mais alguma coisa pra eu ver?',
    response:
`Provavelmente. Este sistema tem mais espaço do que aparenta.

Uma dica: você não tem conexão com o mundo lá fora ainda. Isso limita o que você pode instalar e ver.

Rode \`ping\` — sem argumentos — pra ver as redes disponíveis.`,
    tip: 'ping',
    verify: ({ command }) => command === 'ping',
    nextLabel: 'anotado →',
  },
  {
    id: 'connect',
    prompt: 'e como eu me conecto?',
    response:
`A rede de casa se chama "k1tty's home". A senha tá em algum lugar do sistema — você vai descobrir.

Se quiser tentar agora, é só \`connect "k1tty's home"\`. Mas isso fica pra depois. Vamos seguir.`,
    tip: 'connect "k1tty\'s home"',
    verify: ({ command }) => command === 'connect',
    nextLabel: 'ok →',
  },
  {
    id: 'apt',
    prompt: 'como eu consigo mais ferramentas?',
    response:
`O sistema vem com o essencial. O resto você instala.

Existe um gerenciador de pacotes guardando um monte de coisas inúteis e umas úteis no meio. Algumas delas são só diversão. Outras abrem portas que você ainda nem viu.

A sintaxe é \`sudo apt install <pacote>\`. Mas isso exige sudo (uma senha) — que é exatamente o que você vai passar o resto do jogo procurando.

Por enquanto, só saiba que existe.`,
    tip: 'sudo apt install <pacote>',
    nextLabel: 'entendi →',
  },
  {
    id: 'explore-1',
    prompt: 'tô perdida. o que eu procuro?',
    response:
`Não sei. Isso é o ponto.

O que eu posso dizer é isto: sistemas esquecidos guardam rastros. Históricos. Logs. Arquivos que ninguém apaga porque ninguém lembra que estão lá.

Alguns bons lugares pra olhar: /var/log, arquivos com ponto na frente (ocultos), e \`find\` ou \`grep\` quando você tiver um alvo.`,
    tip: '/var/log  ·  find  ·  grep',
    nextLabel: 'ok →',
  },
  {
    id: 'whatnow',
    prompt: 'e se eu travar?',
    response:
`Tem um comando pra isso. Literalmente.

O \`whatnow\` foi feito pra te dar uma direção solta quando você estiver presa. Não é uma resposta pronta, é um empurrão.

Rode \`whatnow\` agora — ele já vai te dar o próximo passo real do jogo.`,
    tip: 'whatnow',
    verify: ({ command }) => command === 'whatnow',
    nextLabel: 'boa →',
  },
  {
    id: 'goodbye',
    prompt: 'e o que tem no final?',
    response:
`Não vou estragar a surpresa.

O que eu digo é: o fim não é um arquivo. É uma sequência. E o sistema foi desenhado pra que, quando você chegar lá, saiba que chegou.

Você vai perceber.

Boa sorte, k1tty.`,
    tip: null,
    nextLabel: null,
  },
];

const SKIP_STEP_DELAY_MS = 20000;

export default function TutorialWindow() {
  const { state, dispatch } = useGame();

  const [bootPhase, setBootPhase] = useState(0);
  const [bootDone, setBootDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(() => {
    const saved = state?.flags?.tutorialStep;
    if (typeof saved === 'number' && saved >= 0 && saved < STEPS.length) return saved;
    return 0;
  });
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [blink, setBlink] = useState(true);
  const [thinking, setThinking] = useState(false);

  const [miniInput, setMiniInput] = useState('');
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showSkipStep, setShowSkipStep] = useState(false);
  const [miniError, setMiniError] = useState(null);

  const scrollRef = useRef(null);
  const typingRef = useRef(null);
  const miniInputRef = useRef(null);
  const stepStartHistoryLenRef = useRef(0);

  const tutorialWindowId = useMemo(() => {
    const win = (state?.openWindows || []).find(w => w.type === 'tutorial');
    return win ? win.id : null;
  }, [state?.openWindows]);

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (bootDone) return;
    if (bootPhase >= BOOT_STEPS.length) {
      const t = setTimeout(() => setBootDone(true), 500);
      return () => clearTimeout(t);
    }
    const delay = bootPhase === BOOT_STEPS.length - 1 ? 600 : 350 + Math.random() * 200;
    const t = setTimeout(() => setBootPhase(p => p + 1), delay);
    return () => clearTimeout(t);
  }, [bootPhase, bootDone]);

  useEffect(() => {
    if (!bootDone) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    setTypingText('');
    setIsTyping(false);
    setThinking(true);

    const thinkTime = 500 + Math.min((step.response?.length || 0) * 2, 1200);
    const t = setTimeout(() => {
      setThinking(false);
      setIsTyping(true);
    }, thinkTime);

    return () => clearTimeout(t);
  }, [stepIndex, bootDone]);

  useEffect(() => {
    if (!isTyping) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    const full = step.response || '';
    if (typingText.length >= full.length) {
      setIsTyping(false);
      return;
    }

    typingRef.current = setInterval(() => {
      setTypingText(prev => {
        const next = full.slice(0, prev.length + 3);
        if (next.length >= full.length) {
          clearInterval(typingRef.current);
          setIsTyping(false);
          return full;
        }
        return next;
      });
    }, 12);

    return () => clearInterval(typingRef.current);
  }, [isTyping, stepIndex, typingText.length]);

  useEffect(() => {
    if (!bootDone) return;
    stepStartHistoryLenRef.current = state?.history?.length || 0;
    setStepCompleted(false);
    setShowSkipStep(false);
    setMiniInput('');
    setMiniError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, bootDone]);

  useEffect(() => {
    if (!bootDone) return;
    if (state?.flags?.tutorialStep === stepIndex) return;
    dispatch({
      type: 'SET_FLAG',
      payload: { flag: 'tutorialStep', value: stepIndex },
    });
  }, [stepIndex, bootDone, dispatch, state?.flags?.tutorialStep]);

  useEffect(() => {
    if (!bootDone) return;
    if (stepCompleted) return;
    const step = STEPS[stepIndex];
    if (!step) return;

    if (typeof step.verify !== 'function') {
      setStepCompleted(true);
      return;
    }

    const startIdx = stepStartHistoryLenRef.current;
    // Prevenção de crash: caso history não exista, usa array vazio
    const newEntries = (state?.history || []).slice(startIdx);

    for (const entry of newEntries) {
      const raw = (entry?.command || '').trim();
      if (!raw) continue;

      const parts = raw.split(/\s+/);
      const command = parts[0];
      const args = parts.slice(1);

      try {
        if (step.verify({ command, args, entry, state })) {
          setStepCompleted(true);
          return;
        }
      } catch {
        // ignora erros no verify
      }
    }
  }, [state?.history, stepIndex, stepCompleted, bootDone, state]);

  useEffect(() => {
    if (stepCompleted) return;
    if (!bootDone) return;
    const step = STEPS[stepIndex];
    if (!step?.verify) return;

    setShowSkipStep(false);
    const t = setTimeout(() => setShowSkipStep(true), SKIP_STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [stepIndex, stepCompleted, bootDone]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [typingText, thinking, stepIndex, bootPhase, stepCompleted]);

  useEffect(() => {
    if (!bootDone) return;
    if (thinking || isTyping) return;
    if (stepCompleted) return;
    const step = STEPS[stepIndex];
    if (!step?.verify) return;
    miniInputRef.current?.focus();
  }, [bootDone, thinking, isTyping, stepCompleted, stepIndex]);

  const closeWindow = useCallback(() => {
    if (tutorialWindowId) {
      dispatch({ type: 'CLOSE_WINDOW', payload: tutorialWindowId });
    }
  }, [dispatch, tutorialWindowId]);

  const finalizeTutorial = useCallback(() => {
    dispatch({ type: 'SET_TUTORIAL_COMPLETED', payload: true });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 5 });

    if (!(state?.installedPackages || []).includes('tutorial')) {
      dispatch({ type: 'INSTALL_PACKAGE', payload: 'tutorial' });
    }
  }, [dispatch, state?.installedPackages]);

  const handleNext = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) return;
    setStepIndex(i => i + 1);
  }, [stepIndex]);

  const handleSkipStep = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) return;
    setStepIndex(i => i + 1);
  }, [stepIndex]);

  const handleSkipTutorial = useCallback(() => {
    finalizeTutorial();
    closeWindow();
  }, [finalizeTutorial, closeWindow]);

  const handleFinish = useCallback(() => {
    finalizeTutorial();
    closeWindow();
  }, [finalizeTutorial, closeWindow]);

  const handleMiniSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    const input = miniInput.trim();
    if (!input) return;

    setMiniError(null);
    setMiniInput('');

    try {
      const result = executeCommand(input, state, dispatch, {});

      if (result && typeof result.then === 'function') {
        result
          .then(resolved => {
            if (resolved) {
              dispatch({ type: 'ADD_HISTORY', payload: resolved });
            }
          })
          .catch(err => {
            dispatch({
              type: 'ADD_HISTORY',
              payload: {
                command: input,
                output: `erro: ${err.message}`,
                type: 'error',
              },
            });
          });
      } else if (result) {
        dispatch({ type: 'ADD_HISTORY', payload: result });
      }
    } catch (err) {
      setMiniError(err.message);
      dispatch({
        type: 'ADD_HISTORY',
        payload: {
          command: input,
          output: `erro: ${err.message}`,
          type: 'error',
        },
      });
    }
  }, [miniInput, state, dispatch]);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const avatarTalking = isTyping || thinking;
  const hasVerify = typeof currentStep?.verify === 'function';
  const canAdvance = !hasVerify || stepCompleted;
  const showMiniTerminal = bootDone && hasVerify && !isLastStep;

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
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 10px',
        background: 'var(--color-bg-header)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '11px',
        color: 'var(--color-command)',
        letterSpacing: '0.5px',
        textShadow: 'var(--glow-soft)',
        flexShrink: 0,
      }}>
        <span>miau · assistente local</span>
        <span style={{ color: 'var(--color-dim)', textShadow: 'none' }}>
          {MODEL_NAME}
        </span>
      </div>

      {/* Corpo */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px 8px',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {!bootDone && (
          <div style={{ color: 'var(--color-dim)', fontSize: '11px' }}>
            <div style={{ color: 'var(--color-border)', marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-command)' }}>$</span> miau --session
            </div>
            {BOOT_STEPS.slice(0, bootPhase).map((line, i) => {
              const isLast = i === BOOT_STEPS.length - 1;
              return (
                <div key={i} style={{
                  color: isLast ? 'var(--color-command)' : 'var(--color-dim)',
                  textShadow: isLast ? 'var(--glow-soft)' : 'none',
                }}>
                  <span style={{ color: isLast ? 'var(--color-command)' : 'var(--color-border)', marginRight: '6px' }}>
                    [ OK ]
                  </span>
                  {line}
                </div>
              );
            })}
            {bootPhase < BOOT_STEPS.length && (
              <span style={{ color: 'var(--color-command)', opacity: blink ? 1 : 0 }}>█</span>
            )}
          </div>
        )}

        {bootDone && (
          <>
            <div style={{
              fontSize: '10px',
              color: 'var(--color-dim)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px dashed var(--color-border-a30)',
            }}>
              <span style={{ color: 'var(--color-border)' }}>[sessão iniciada]</span>
              {' · '}
              <span>contexto: terminal k1tty</span>
            </div>

            {/* Steps anteriores (histórico) */}
            {STEPS.slice(0, stepIndex).map((step) => (
              <div key={step.id} style={{ marginBottom: '14px' }}>
                {step.prompt && (
                  <div style={{
                    color: 'var(--color-command)',
                    marginBottom: '4px',
                    textShadow: 'var(--glow-soft)',
                  }}>
                    <span style={{ color: 'var(--color-border)' }}>{'>'} você:</span>{' '}
                    <span>{step.prompt}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  paddingLeft: '6px',
                  borderLeft: '2px solid var(--color-border-a35)',
                }}>
                  <SpriteAvatar
                    talking={false}
                    size={64}
                    alt="miau"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--color-warning)', marginBottom: '2px' }}>
                      miau:
                    </div>
                    <div style={{ color: 'var(--color-text)' }}>{step.response}</div>
                  </div>
                </div>

                {step.tip && (
                  <div style={{
                    marginTop: '6px',
                    marginLeft: '76px',
                    fontSize: '10px',
                    color: 'var(--color-border)',
                    fontStyle: 'italic',
                  }}>
                    ↳ comando: <span style={{ color: 'var(--color-command)' }}>{step.tip}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Step atual */}
            {currentStep && (
              <div style={{ marginBottom: '14px' }}>
                {currentStep.prompt && (
                  <div style={{
                    color: 'var(--color-command)',
                    marginBottom: '4px',
                    textShadow: 'var(--glow-soft)',
                  }}>
                    <span style={{ color: 'var(--color-border)' }}>{'>'} você:</span>{' '}
                    <span>{currentStep.prompt}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  paddingLeft: '6px',
                  borderLeft: '2px solid var(--color-border-a35)',
                }}>
                  <SpriteAvatar
                    talking={avatarTalking}
                    size={88}
                    alt="miau"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--color-warning)', marginBottom: '2px' }}>
                      miau:
                    </div>
                    {thinking ? (
                      <div style={{ color: 'var(--color-dim)', fontStyle: 'italic' }}>
                        pensando
                        <span>
                          {['', '.', '..', '...'][Math.floor(Date.now() / 400) % 4]}
                        </span>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--color-text)' }}>
                        {typingText}
                        {isTyping && (
                          <span style={{
                            color: 'var(--color-command)',
                            opacity: blink ? 1 : 0,
                            marginLeft: '2px',
                          }}>▌</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {!thinking && !isTyping && currentStep.tip && (
                  <div style={{
                    marginTop: '6px',
                    marginLeft: '100px',
                    fontSize: '10px',
                    color: 'var(--color-border)',
                    fontStyle: 'italic',
                  }}>
                    ↳ comando: <span style={{ color: 'var(--color-command)' }}>{currentStep.tip}</span>
                  </div>
                )}
              </div>
            )}

            {!thinking && !isTyping && currentStep && (
              <div style={{
                fontSize: '9px',
                color: 'var(--color-dim)',
                letterSpacing: '0.5px',
                marginTop: '4px',
                marginBottom: '8px',
              }}>
                [{MODEL_PARAMS} params · {Math.round(120 + Math.random() * 300)}ms · tokens: {Math.round((currentStep.response?.length || 0) / 4)}]
              </div>
            )}

            {/* Status do objetivo */}
            {showMiniTerminal && !thinking && !isTyping && (
              <div style={{
                marginTop: '10px',
                padding: '8px 10px',
                border: `1px dashed ${stepCompleted ? 'var(--color-command)' : 'var(--color-border-a40)'}`,
                borderRadius: '3px',
                fontSize: '10.5px',
                color: stepCompleted ? 'var(--color-command)' : 'var(--color-dim)',
                background: stepCompleted ? 'var(--color-command-a10)' : 'transparent',
                letterSpacing: '0.5px',
              }}>
                {stepCompleted ? (
                  <>✓ objetivo concluído — clique em <b>próximo</b></>
                ) : (
                  <>▸ aguardando comando: <span style={{ color: 'var(--color-warning)' }}>{currentStep.tip}</span></>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mini-terminal */}
      {showMiniTerminal && !thinking && !isTyping && (
        <form
          onSubmit={handleMiniSubmit}
          style={{
            borderTop: '1px solid var(--color-border-a35)',
            background: 'var(--color-bg-deep)',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <span style={{
            color: 'var(--color-command)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            textShadow: 'var(--glow-soft)',
          }}>
            {stepCompleted ? '✓' : '⟩'}
          </span>
          <input
            ref={miniInputRef}
            type="text"
            value={miniInput}
            onChange={(e) => setMiniInput(e.target.value)}
            placeholder={
              stepCompleted
                ? 'objetivo cumprido — clique em próximo'
                : `digite: ${currentStep.tip?.split(' ')[0] || ''}`
            }
            spellCheck={false}
            autoComplete="off"
            disabled={stepCompleted}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: stepCompleted ? 'var(--color-dim)' : 'var(--color-command)',
              fontFamily: 'Fira Code, monospace',
              fontSize: '11.5px',
              caretColor: 'var(--color-command)',
              padding: '2px 0',
            }}
          />
          {miniError && (
            <span style={{ color: 'var(--color-error)', fontSize: '10px' }}>
              {miniError}
            </span>
          )}
        </form>
      )}

      {/* Footer */}
      {bootDone && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--color-border-a35)',
          background: 'var(--color-bg-header)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}>
          <button
            onClick={handleSkipTutorial}
            disabled={isLastStep}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-error)',
              color: isLastStep ? 'var(--color-dim)' : 'var(--color-error)',
              fontFamily: 'inherit',
              fontSize: '10px',
              padding: '3px 10px',
              borderRadius: '3px',
              cursor: isLastStep ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: isLastStep ? 0.4 : 1,
            }}
          >
            pular tutorial
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '10px',
            color: 'var(--color-dim)',
          }}>
            <span>{stepIndex + 1}/{STEPS.length}</span>

            {showSkipStep && !canAdvance && (
              <button
                onClick={handleSkipStep}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-dim)',
                  fontFamily: 'inherit',
                  fontSize: '10px',
                  padding: '3px 6px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dashed',
                }}
              >
                preso? pular este passo
              </button>
            )}

            {currentStep?.nextLabel && !thinking && !isTyping && (
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                style={{
                  background: canAdvance ? 'transparent' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${canAdvance ? 'var(--color-command)' : 'var(--color-border-a30)'}`,
                  color: canAdvance ? 'var(--color-command)' : 'var(--color-dim)',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  padding: '4px 14px',
                  borderRadius: '3px',
                  cursor: canAdvance ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                  textShadow: canAdvance ? 'var(--glow-soft)' : 'none',
                  opacity: canAdvance ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (canAdvance) {
                    e.currentTarget.style.background = 'var(--color-command-a15)';
                    e.currentTarget.style.boxShadow = '0 0 8px var(--color-command-a40)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canAdvance) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {currentStep.nextLabel}
              </button>
            )}

            {isLastStep && !thinking && !isTyping && (
              <button
                onClick={handleFinish}
                style={{
                  background: 'linear-gradient(180deg, var(--color-command) 0%, var(--color-border) 100%)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-bg)',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '4px 14px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  boxShadow: '0 0 8px var(--color-command-a30)',
                }}
              >
                fechar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}