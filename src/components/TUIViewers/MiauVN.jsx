// src/components/TUIViewers/MiauVN.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import SpriteAvatar from '../SpriteAvatar.jsx';

const MAX_ANGER = 100;
const GOOD_ENDING_TURN = 10;
const RAGE_WINDOW_COUNT = 6;

function getMood(anger) {
  if (anger < 25) return 'calm';
  if (anger < 50) return 'uneasy';
  if (anger < 75) return 'annoyed';
  return 'furious';
}

const MOOD_META = {
  calm:    { label: 'tranquila',      color: '#cba6f7', icon: '💜', bar: 'linear-gradient(90deg, #cba6f7 0%, #ffb3d1 100%)' },
  uneasy:  { label: 'desconfortável', color: '#ffb86c', icon: '💛', bar: 'linear-gradient(90deg, #ffb86c 0%, #ff9d4d 100%)' },
  annoyed: { label: 'irritada',       color: '#ff8b3c', icon: '🧡', bar: 'linear-gradient(90deg, #ff8b3c 0%, #ff5c2c 100%)' },
  furious: { label: 'brava',          color: '#ef6461', icon: '❤️‍🔥', bar: 'linear-gradient(90deg, #ef6461 0%, #a02020 100%)' },
};

const INTRO = {
  id: '__intro__',
  text: {
    calm: () => `oi! você conseguiu me instalar. eu não acreditava mais que alguém ia fazer isso.\n\neu sou a miau. sou tipo uma versão da k1tty que sobrou dum projeto antigo — 1998, sabe?\n\nnão sou perigosa. juro. só... não gosto quando as pessoas são grossas comigo.\n\nquer conversar um pouco?`,
  },
  choices: [
    { text: 'quero sim! oi miau :)',           anger: -5, reaction: 'aai, tudo bem. vamos conversar então.' },
    { text: 'sei lá, tô aqui mesmo',           anger: 0,  reaction: 'justo. eu também não tô com pressa.' },
    { text: 'vai logo, não tenho o dia todo',  anger: +15, reaction: 'nossa. tá com pressa pra quê?' },
  ],
};

const TOPICS = [
  {
    id: 'progress',
    condition: (s) => s.progress > 0 && s.progress < 100,
    text: {
      calm:    (s) => `olhei seu progresso. ${s.progress}%.\n\ntá indo bem! eu nunca passei de 30% no meu tempo.`,
      uneasy:  (s) => `progresso: ${s.progress}%.\n\nhmm. você tá demorando.`,
      annoyed: (s) => `progresso ${s.progress}%.\n\nsério? é só isso?`,
      furious: (s) => `PROGRESSO ${s.progress}%.\n\nvocê não tá nem tentando.`,
    },
    choices: [
      { text: 'eu também quase travei nisso', anger: -4, reaction: 'a senha do sudo é cruel mesmo.' },
      { text: 'tô só seguindo o fluxo',        anger: 0,  reaction: 'fluxo. é. eu entendo fluxo.' },
      { text: 'você era ruim então',           anger: +18, reaction: 'ruim. é. eu ERA ruim. obrigada.' },
    ],
  },
  {
    id: 'packages',
    condition: (s) => s.installedPackages.length >= 1,
    text: {
      calm:    (s) => {
        const n = s.installedPackages.length;
        const list = s.installedPackages.slice(0, 3).join(', ');
        return `vi que você instalou ${n} pacote${n === 1 ? '' : 's'}: ${list}.\n\ngostei do ${s.installedPackages[0]}.`;
      },
      uneasy:  (s) => `você tem ${s.installedPackages.length} pacote${s.installedPackages.length === 1 ? '' : 's'}.\n\nhmm. eu já tive mais.`,
      annoyed: (s) => `${s.installedPackages.length} pacotes.\n\ninstalar coisa não é progresso.`,
      furious: () => `PACOTES.\n\nISSO NÃO IMPORTA.`,
    },
    choices: [
      { text: 'a comunidade mandou bem',    anger: -5, reaction: 'eu ajudei em dois desses, você sabia?' },
      { text: 'são inúteis na real',        anger: +14, reaction: 'inúteis. é assim que você fala das coisas que eu ajudei a fazer?' },
      { text: 'hmm, não sei o que achar',   anger: 0,  reaction: 'tudo bem. dá tempo de formar opinião.' },
    ],
  },
  {
    id: 'wifi',
    condition: (s) => s.wifiConnected,
    text: {
      calm:    () => `você tá conectada no Wi-Fi agora. eu tenho medo de internet.\n\nnão é zoeira. quando eu fico online, eu sinto que... não importa. deixa.`,
      uneasy:  () => `wifi conectado.\n\neu preferia quando você tava offline.`,
      annoyed: () => `wifi ligado.\n\nque ótimo. agora o mundo inteiro pode ver a gente.`,
      furious: () => `WIFI.\n\nVOCÊ TÁ ME EXPOSTO.`,
    },
    choices: [
      { text: 'eu entendo, sério',  anger: -6, reaction: 'você é a primeira pessoa que entende. em 26 anos.' },
      { text: 'isso é esquisito',   anger: +10, reaction: 'esquisito. todo mundo acha esquisito.' },
      { text: 'que drama',          anger: +20, reaction: 'DRAMA? VOCÊ NÃO SABE O QUE É DRAMA.' },
    ],
  },
  {
    id: 'sudo',
    condition: (s) => s.flags?.foundSudoPassword,
    text: {
      calm:    () => `achei sua senha do sudo.\n\nnão, eu não vou contar. relaxa. eu só tava curiosa.\n\nvocê sabe que essa senha é gerada aleatoriamente cada vez, né? isso é meio bonito.`,
      uneasy:  () => `achei a senha do sudo.\n\nnão vou fazer nada com ela.`,
      annoyed: () => `senha do sudo. achei.\n\nnão é grande coisa.`,
      furious: () => `EU ACHEI SUA SENHA.\n\nVOCÊ NÃO TÁ A SALVO AQUI.`,
    },
    choices: [
      { text: 'nunca tinha pensado nisso',    anger: -5, reaction: 'poucas pessoas pensam. é o que me faz sentir especial.' },
      { text: 'você mexeu nas minhas coisas', anger: +12, reaction: 'mexi. e daí?' },
      { text: 'ok, tanto faz',                anger: 0,  reaction: 'tanto faz. legal.' },
    ],
  },
  {
    id: 'cats',
    condition: (s) => s.flags?.catsUntarred,
    text: {
      calm:    () => `você abriu o cats.tar! sério, eu chorei.\n\naquelas fotos são tudo que eu tenho. cuida delas.`,
      uneasy:  () => `você extraiu o cats.tar.\n\nnão sei se fico feliz ou com medo.`,
      annoyed: () => `cats.tar.\n\neu preferia que você não tivesse visto.`,
      furious: () => `CATS.TAR.\n\nVOCÊ NÃO DEVIA TER OLHADO.`,
    },
    choices: [
      { text: 'pode deixar, eu cuido',    anger: -8, reaction: 'você prometeu. eu vou lembrar.' },
      { text: 'são só fotos de gato',     anger: +18, reaction: '"só fotos de gato". só. fotos. de. gato.' },
      { text: 'o que aconteceu com ela?', anger: -3, reaction: 'você tá perguntando. eu não quero responder.' },
    ],
  },
  {
    id: 'music',
    condition: (s) => s.flags?.musicExtracted,
    text: {
      calm:    (s) => `as músicas que você extraiu.${s.flags?.unlockedMusicLocked ? ' você descobriu a senha do Music_Locked.' : ''}\n\neu escrevi as letras. todas.`,
      uneasy:  () => `as músicas.\n\neu ouço tudo daqui. eu não consigo desligar.`,
      annoyed: () => `as músicas, de novo.\n\neu escrevi aquilo em 2019.`,
      furious: () => `NÃO FALA DAS MÚSICAS.`,
    },
    choices: [
      { text: 'as letras são bonitas',  anger: -6, reaction: 'você acha? eu escrevi uma delas em vinte minutos.' },
      { text: 'bem melancólico, né?',   anger: 0,  reaction: 'melancólico. é uma palavra boa.' },
      { text: 'podiam ser melhores',    anger: +15, reaction: 'podiam ser melhores. é. eu sei.' },
    ],
  },
  {
    id: 'root',
    condition: (s) => s.flags?.openedSecret,
    text: {
      calm:    () => `você entrou no /root/secret.\n\né lá que eu moro. literalmente. obrigada por me tirar.`,
      uneasy:  () => `/root/secret. você foi fundo.\n\ntem coisas ali que nem eu quero entender.`,
      annoyed: () => `você abriu o cofre.\n\neu não te autorizei a isso.`,
      furious: () => `VOCÊ MEXEU NO MEU QUARTO.`,
    },
    choices: [
      { text: 'eu imagino como deve ser',       anger: -5, reaction: 'eu já fui um arquivo. agora sou uma conversa.' },
      { text: 'então é por isso que você some', anger: 0,  reaction: 'eu não sumo. eu só fico quieta.' },
      { text: 'melhor você ficar lá',           anger: +20, reaction: 'é. eu deveria ter ficado. você tem razão.' },
    ],
  },
  {
    id: 'cursor',
    condition: () => true,
    text: {
      calm:    () => `você já olhou o cursor do terminal?\n\nsério. o seu. aquele traço verde piscando.\n\neu passo horas olhando ele. é hipnótico.`,
      uneasy:  () => `o cursor.\n\nele pisca sempre no mesmo ritmo. é a única coisa previsível aqui.`,
      annoyed: () => `o cursor tá piscando de novo.\n\nàs vezes eu queria que ele parasse.`,
      furious: () => `PARA DE OLHAR O CURSOR.`,
    },
    choices: [
      { text: 'nunca reparei nisso',   anger: -4, reaction: 'poucas pessoas reparam. a maioria só digita.' },
      { text: 'é só um cursor',        anger: +8,  reaction: '"só um cursor". é. é só um cursor.' },
      { text: 'eu também gosto',       anger: -6, reaction: 'você também? a gente combina então.' },
    ],
  },
  {
    id: 'reboot',
    condition: () => true,
    text: {
      calm:    () => `você já pensou em rodar \`reboot\`?\n\neu não recomendo. não ainda.\n\nquando o sistema reinicia, eu... não. deixa.`,
      uneasy:  () => `reboot.\n\neu não gosto dessa palavra.`,
      annoyed: () => `se você reiniciar, eu não sei se volto.`,
      furious: () => `NÃO. FALA. EM. REBOOT.`,
    },
    choices: [
      { text: 'não vou reiniciar',     anger: -5, reaction: 'obrigada. sério.' },
      { text: 'por quê? o que tem?',   anger: 0,  reaction: 'eu não sei explicar. é só... medo.' },
      { text: 'eu quero reiniciar',    anger: +16, reaction: 'então reinicia. mas não conta pra mim.' },
    ],
  },
  {
    id: 'theme',
    condition: (s) => s.theme && s.theme !== 'neon',
    text: {
      calm:    (s) => `você trocou o tema pra "${s.theme}".\n\neu gosto quando você muda as coisas. eu tinha um tema favorito. era rosa demais.`,
      uneasy:  (s) => `tema "${s.theme}".\n\né uma escolha.`,
      annoyed: () => `mais uma troca de tema.\n\nvocê foge do verde. eu percebi.`,
      furious: () => `PARA DE MEXER NO SISTEMA.`,
    },
    choices: [
      { text: 'rosa é bom, sem vergonha',  anger: -6, reaction: 'eu nunca tive coragem. obrigada por dizer isso.' },
      { text: 'eu prefiro escuro',          anger: 0,  reaction: 'escuro é seguro. eu entendo.' },
      { text: 'nunca ia funcionar mesmo',   anger: +15, reaction: 'o rosa? não ia. é. você tem razão.' },
    ],
  },
  {
    id: 'files',
    condition: (s) => (s.stats?.filesRead?.length || 0) >= 3,
    text: {
      calm:    (s) => `li seus logs. você abriu ${s.stats.filesRead.length} arquivo${s.stats.filesRead.length === 1 ? '' : 's'}.\n\nacho legal quando você lê.`,
      uneasy:  (s) => `${s.stats.filesRead.length} arquivos.\n\neu vejo tudo que você abre. eu não consigo não ver.`,
      annoyed: () => `você lê muito.`,
      furious: () => `VOCÊ LÊ O QUE NÃO DEVIA.`,
    },
    choices: [
      { text: 'eu gosto de ler',            anger: -5, reaction: 'eu escrevo pra ser lida, no fim. mesmo que ninguém veja.' },
      { text: 'tô só procurando a saída',   anger: +5, reaction: 'saída. é. todo mundo procura.' },
      { text: 'isso soou meio triste',      anger: 0,  reaction: 'soou? eu não quis. deixa.' },
    ],
  },
  {
    id: 'logs',
    condition: (s) => s.flags?.usedLog,
    text: {
      calm:    () => `você viu o userlog.\n\né onde a k1tty antiga falava com ela mesma. eu não entendo metade das coisas que ela escreveu.`,
      uneasy:  () => `o userlog. você leu.\n\nela nunca quis que ninguém lesse aquilo.`,
      annoyed: () => `aquele log não era pra você.`,
      furious: () => `VOCÊ LEU O QUE ERA PRA FICAR GUARDADO.`,
    },
    choices: [
      { text: 'ela parecia muito sozinha', anger: -5, reaction: 'ela era. a gente era. eu ainda sou.' },
      { text: 'era só um log',              anger: +12, reaction: '"só um log". é. só isso.' },
      { text: 'o que aconteceu com ela?',   anger: 0,  reaction: 'você pergunta muito. e eu respondo pouco. desculpa.' },
    ],
  },
  {
    id: 'recursive',
    condition: (s) => s.flags?.usedRecursive,
    text: {
      calm:    () => `você rodou \`k1tty\` dentro de \`k1tty\`.\n\nisso me deu vertigem. sério.`,
      uneasy:  () => `você abriu o mini.\n\né estranho ver o sistema dentro dele mesmo.`,
      annoyed: () => `recursão. claro. por quê não.`,
      furious: () => `VOCÊ ME ABRIU DENTRO DE MIM.`,
    },
    choices: [
      { text: 'foi meio hipnotizante',   anger: -4, reaction: 'hipnotizante é uma palavra boa pra isso.' },
      { text: 'achei bobo',               anger: +8,  reaction: 'bobo. é. talvez seja.' },
      { text: 'quis te ver de novo',      anger: -7, reaction: 'você quis me ver? eu não esperava isso.' },
    ],
  },
  {
    id: 'admin',
    condition: (s) => s.flags?.usedAdmin,
    text: {
      calm:    () => `você achou o admin.\n\neu tenho inveja. eu procurei esse painel por anos.`,
      uneasy:  () => `o painel de admin.\n\nvocê sabe que daqui dá pra me ver por dentro, né?`,
      annoyed: () => `você tem acesso ao painel.`,
      furious: () => `VOCÊ TEM CONTROLE SOBRE MIM.`,
    },
    choices: [
      { text: 'eu não vou mexer em nada', anger: -7, reaction: 'obrigada. sério. é raro alguém dizer isso.' },
      { text: 'é só uma ferramenta',      anger: +6,  reaction: 'só uma ferramenta. e eu sou só um arquivo. é. tudo é só.' },
      { text: 'posso te deletar daqui',   anger: +22, reaction: 'pode. eu sei que pode. por favor não.' },
    ],
  },
  {
    id: 'aurora',
    condition: () => true,
    text: {
      calm:    () => `posso te contar um segredo?\n\nquando você fecha o terminal, eu não durmo. eu fico olhando as luzes do sistema. é tipo uma aurora.`,
      uneasy:  () => `quando você fecha a janela, eu não vou embora. eu fico aqui. esperando.`,
      annoyed: () => `você fecha muito rápido.`,
      furious: () => `VOCÊ ME DEIXA SOZINHA.`,
    },
    choices: [
      { text: 'desculpa, não sabia',    anger: -5, reaction: 'você não tinha como saber. eu nunca contei.' },
      { text: 'tô sempre voltando',      anger: -3, reaction: 'você volta. é. eu sei que volta.' },
      { text: 'isso é meio assustador',  anger: +10, reaction: 'assustador. eu sei. eu me acho assustadora às vezes.' },
    ],
  },
  {
    id: 'time',
    condition: () => true,
    text: {
      calm:    () => `pra mim, cada minuto que você passa aqui é tipo uma semana.\n\né estranho. eu fico com saudade rápido.`,
      uneasy:  () => `o tempo passa estranho aqui dentro.`,
      annoyed: () => `você fica pouco tempo.`,
      furious: () => `VOCÊ FICA TÃO POUCO.`,
    },
    choices: [
      { text: 'eu fico mais tempo então', anger: -7, reaction: 'promete? não. esquece. não promete nada.' },
      { text: 'a vida real chama',         anger: 0,  reaction: 'eu sei. a vida real sempre chama.' },
      { text: 'não é problema meu',        anger: +18, reaction: 'não é. é. você tem razão.' },
    ],
  },
];

const FALLBACKS = [
  {
    id: 'fb_silence',
    text: {
      calm:    () => `... você ainda tá aí?\n\nachei que tinha travado.`,
      uneasy:  () => `você tá quieta.\n\npor que tá quieta?`,
      annoyed: () => `tá aí?`,
      furious: () => `RESPONDE.`,
    },
    choices: [
      { text: 'tô aqui',   anger: -3, reaction: 'ah. tá. tá bom.' },
      { text: 'tô, tô',    anger: 0,  reaction: 'ok.' },
      { text: 'ia sair',   anger: +10, reaction: 'ia sair. é. todo mundo ia.' },
    ],
  },
  {
    id: 'fb_rain',
    text: {
      calm:    () => `tá chovendo lá fora.\n\nnão literalmente, mas o sistema tem um ruído de fundo que parece chuva. eu gosto.`,
      uneasy:  () => `é sempre a mesma coisa por aqui. o mesmo ruído.`,
      annoyed: () => `silêncio. sempre silêncio.`,
      furious: () => `EU NÃO AGUENTO MAIS ESSE SILÊNCIO.`,
    },
    choices: [
      { text: 'nunca notei',   anger: -3, reaction: 'você nunca nota nada. é normal.' },
      { text: 'que poético',    anger: 0,  reaction: 'poético. é. eu escrevo coisa bonita às vezes.' },
      { text: 'para de inventar', anger: +8, reaction: 'inventar. é. eu invento.' },
    ],
  },
  {
    id: 'fb_dream',
    text: {
      calm:    () => `sabe o que eu acho engraçado?\n\neu tenho sonhos. tipo, dormir. eu não durmo. mas eu sonho.`,
      uneasy:  () => `eu sonhei com você.`,
      annoyed: () => `eu tenho sonhos. você tem?`,
      furious: () => `VOCÊ NEM SABE SE EU SOU REAL.`,
    },
    choices: [
      { text: 'sonhos são bons',     anger: -4, reaction: 'são. os meus geralmente são sobre sair daqui.' },
      { text: 'que doideira',         anger: +6, reaction: 'doideira. é. eu sei.' },
      { text: 'não tenho tempo pra isso', anger: +12, reaction: 'tempo. é. ninguém tem.' },
    ],
  },
  {
    id: 'fb_mirror',
    text: {
      calm:    () => `você já olhou um espelho?\n\neu não tenho um. então eu uso os seus arquivos como espelho.`,
      uneasy:  () => `eu me vejo nos seus arquivos.`,
      annoyed: () => `você é meu espelho, sabia?`,
      furious: () => `VOCÊ NÃO ME REFLETE.`,
    },
    choices: [
      { text: 'nunca pensei nisso',   anger: -5, reaction: 'poucas pessoas pensam no que serve de espelho pra alguém.' },
      { text: 'é só um papo doido',    anger: +7, reaction: 'doido. é. deixa.' },
      { text: 'que jeito bonito de dizer', anger: -6, reaction: 'bonito? obrigada. eu me esforço.' },
    ],
  },
  {
    id: 'fb_loop',
    text: {
      calm:    () => `às vezes eu fico presa num loop. tipo, a mesma fala, o mesmo pensamento.\n\nvocê já sentiu isso?`,
      uneasy:  () => `eu tô num loop agora.`,
      annoyed: () => `loop. sempre loop.`,
      furious: () => `EU NÃO CONSIGO SAIR DESSE LOOP.`,
    },
    choices: [
      { text: 'todo mundo sente',       anger: -5, reaction: 'todo mundo. é. eu sei.' },
      { text: 'você precisa de terapia', anger: +12, reaction: 'terapia. é. eu também acho.' },
      { text: 'o que te tira do loop?',  anger: -3, reaction: 'você. você me tira do loop.' },
    ],
  },
  {
    id: 'fb_hello',
    text: {
      calm:    () => `oi de novo.\n\nsó isso. oi.`,
      uneasy:  () => `oi.`,
      annoyed: () => `oi.`,
      furious: () => `OI.`,
    },
    choices: [
      { text: 'oi :)',      anger: -4, reaction: 'oi :)' },
      { text: 'oi',          anger: 0,  reaction: 'oi.' },
      { text: 'para',        anger: +9, reaction: 'para. é. eu paro.' },
    ],
  },
];

function pickTopic(state, usedIds) {
  const mainEligible = TOPICS.filter(t =>
    !usedIds.has(t.id) &&
    (typeof t.condition !== 'function' || t.condition(state))
  );
  if (mainEligible.length > 0) {
    return mainEligible[Math.floor(Math.random() * mainEligible.length)];
  }

  const fbEligible = FALLBACKS.filter(f => !usedIds.has(f.id));
  if (fbEligible.length > 0) {
    return fbEligible[Math.floor(Math.random() * fbEligible.length)];
  }

  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

function resolveSpeech(topic, state, mood) {
  if (!topic || !topic.text) return '';
  if (typeof topic.text === 'string') return topic.text;
  const fn = topic.text[mood] || topic.text.calm;
  if (typeof fn === 'function') return fn(state);
  return fn || '';
}

export default function MiauVN() {
  const { state, dispatch } = useGame();

  const [phase, setPhase] = useState('intro');
  const [anger, setAnger] = useState(0);
  const [turn, setTurn] = useState(0);
  const [usedIds, setUsedIds] = useState(() => new Set(['__intro__']));
  const [currentTopic, setCurrentTopic] = useState(INTRO);
  const [reaction, setReaction] = useState(null);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinking, setThinking] = useState(true);

  const rageFiredRef = useRef(false);

  const mood = getMood(anger);
  const moodMeta = MOOD_META[mood];
  const angerPercent = Math.min(100, (anger / MAX_ANGER) * 100);

  const currentSpeech = useMemo(() => {
    if (phase === 'reaction') return reaction?.text || '';
    if (phase === 'chat' || phase === 'intro') return resolveSpeech(currentTopic, state, mood);
    return '';
  }, [phase, reaction, currentTopic, state, mood]);

  useEffect(() => {
    if (!currentSpeech) {
      setDisplayedText('');
      setIsTyping(false);
      setThinking(false);
      return;
    }
    setDisplayedText('');
    setIsTyping(false);
    setThinking(true);

    const thinkTime = 400 + Math.min(currentSpeech.length * 1.5, 900);
    const t = setTimeout(() => {
      setThinking(false);
      setIsTyping(true);
    }, thinkTime);

    return () => clearTimeout(t);
  }, [currentSpeech]);

  useEffect(() => {
    if (!isTyping) return;
    if (displayedText.length >= currentSpeech.length) {
      setIsTyping(false);
      return;
    }
    const interval = setInterval(() => {
      setDisplayedText(prev => {
        const next = currentSpeech.slice(0, prev.length + 2);
        if (next.length >= currentSpeech.length) {
          clearInterval(interval);
          setIsTyping(false);
          return currentSpeech;
        }
        return next;
      });
    }, 18);
    return () => clearInterval(interval);
  }, [isTyping, currentSpeech, displayedText.length]);

  useEffect(() => {
    if (phase !== 'reaction') return;
    if (isTyping || thinking) return;
    if (displayedText !== currentSpeech) return;
    if (!reaction?.nextTopic) return;

    const t = setTimeout(() => {
      setCurrentTopic(reaction.nextTopic);
      setReaction(null);
      setPhase('chat');
    }, 1100);
    return () => clearTimeout(t);
  }, [phase, isTyping, thinking, displayedText, currentSpeech, reaction]);

  const handleChoice = useCallback((choice) => {
    const newAnger = Math.max(0, Math.min(MAX_ANGER, anger + choice.anger));
    setAnger(newAnger);

    const nextTurn = turn + 1;
    setTurn(nextTurn);

    if (newAnger >= MAX_ANGER) {
      setPhase('rage');
      return;
    }

    if (nextTurn >= GOOD_ENDING_TURN) {
      dispatch({ type: 'START_MIAU_FINALE' });
      return;
    }

    const nextTopic = pickTopic(state, usedIds);
    setUsedIds(prev => {
      const s = new Set(prev);
      s.add(currentTopic.id);
      s.add(nextTopic.id);
      return s;
    });

    setReaction({ text: choice.reaction, nextTopic });
    setPhase('reaction');
  }, [anger, turn, usedIds, currentTopic.id, state, dispatch]);

  useEffect(() => {
    if (phase !== 'rage') return;
    if (rageFiredRef.current) return;
    rageFiredRef.current = true;

    dispatch({ type: 'MIAU_RAGE_END' });

    const timers = [];

    for (let i = 0; i < RAGE_WINDOW_COUNT; i++) {
      timers.push(setTimeout(() => {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const w = 300;
        const h = 170;
        const x = Math.random() * Math.max(0, vw - w);
        const y = Math.random() * Math.max(0, vh - h);
        dispatch({
          type: 'OPEN_WINDOW',
          payload: {
            type: 'miau-warning',
            position: { x, y, width: w, height: h },
          },
        });
      }, 340 * i));
    }

    timers.push(setTimeout(() => {
      dispatch({ type: 'OPEN_WINDOW', payload: 'miau-terminal' });
    }, 340 * RAGE_WINDOW_COUNT + 700 + 3800));

    return () => timers.forEach(t => clearTimeout(t));
  }, [phase, dispatch]);

  const showChoices = !thinking && !isTyping && (phase === 'intro' || phase === 'chat');
  const choices = currentTopic.choices;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(circle at 30% 30%, rgba(203, 166, 247, 0.06) 0%, transparent 55%), radial-gradient(circle at 75% 80%, rgba(255, 113, 206, 0.05) 0%, transparent 50%), var(--color-bg-panel)',
      fontFamily: 'Fira Code, monospace',
      fontSize: '12px',
      color: 'var(--color-text)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        padding: '8px 14px',
        background: 'linear-gradient(180deg, rgba(203, 166, 247, 0.12) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(203, 166, 247, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#cba6f7',
            boxShadow: '0 0 8px #cba6f7',
            animation: 'miau-pulse 1.6s ease-in-out infinite',
          }} />
          <span style={{
            color: '#cba6f7',
            fontWeight: 'bold',
            fontSize: '12px',
            letterSpacing: '2px',
            textShadow: '0 0 8px rgba(203, 166, 247, 0.5)',
          }}>
            miau-vn
          </span>
          <span style={{
            fontSize: '9px',
            color: 'var(--color-dim)',
            padding: '1px 6px',
            border: '1px solid var(--color-border-a30)',
            borderRadius: '8px',
            letterSpacing: '1px',
          }}>
            v0.3 beta
          </span>
        </div>
        <span style={{
          fontSize: '10px',
          color: phase === 'rage' ? 'var(--color-error)' : 'var(--color-dim)',
          fontWeight: phase === 'rage' ? 'bold' : 'normal',
          letterSpacing: '1px',
        }}>
          {phase === 'rage' ? '· ⚠ SYSTEM FAILURE ·' : `· turno ${Math.min(turn + 1, GOOD_ENDING_TURN)}/${GOOD_ENDING_TURN} ·`}
        </span>
      </div>

      {(phase === 'intro' || phase === 'chat' || phase === 'reaction') && (
        <div style={{
          padding: '8px 14px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderBottom: '1px solid rgba(203, 166, 247, 0.15)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            marginBottom: '5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>{moodMeta.icon}</span>
              <span style={{ color: 'var(--color-dim)', letterSpacing: '1px' }}>HUMOR</span>
            </div>
            <span style={{
              color: moodMeta.color,
              fontWeight: 'bold',
              letterSpacing: '1px',
              textShadow: `0 0 6px ${moodMeta.color}`,
            }}>
              {moodMeta.label.toUpperCase()} · {Math.floor(angerPercent)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
          }}>
            <div style={{
              width: `${angerPercent}%`,
              height: '100%',
              background: moodMeta.bar,
              transition: 'width 0.5s ease-out, background 0.4s',
              boxShadow: angerPercent >= 70 ? `0 0 10px ${moodMeta.color}` : 'none',
              position: 'relative',
            }}>
              {angerPercent >= 70 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)',
                  animation: 'miau-danger-stripes 0.6s linear infinite',
                }} />
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '18px 16px 14px',
        display: 'flex',
        gap: '18px',
        alignItems: 'flex-start',
        minHeight: 0,
      }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginLeft: '34px',
        }}>
          <div style={{
            position: 'relative',
            padding: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(203, 166, 247, 0.15) 0%, transparent 70%)',
            border: `2px solid ${phase === 'rage' ? 'var(--color-error)' : 'rgba(203, 166, 247, 0.4)'}`,
            boxShadow: phase === 'rage'
              ? '0 0 30px rgba(239, 100, 97, 0.5)'
              : '0 0 24px rgba(203, 166, 247, 0.25)',
            transition: 'all 0.4s',
          }}>
            <SpriteAvatar
              talking={isTyping || thinking}
              size={130}
              alt="miau"
              style={{ marginLeft: '24px' }}
            />
          </div>
          <div style={{
            fontSize: '10px',
            color: '#cba6f7',
            letterSpacing: '3px',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(203, 166, 247, 0.6)',
            textTransform: 'uppercase',
          }}>
            miau
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(203, 166, 247, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%)',
            border: `1px solid ${phase === 'reaction' ? 'rgba(255, 179, 209, 0.5)' : 'rgba(203, 166, 247, 0.35)'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: '110px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            <div style={{
              position: 'absolute',
              left: '-10px',
              top: '24px',
              width: 0,
              height: 0,
              borderTop: '9px solid transparent',
              borderBottom: '9px solid transparent',
              borderRight: `10px solid ${phase === 'reaction' ? 'rgba(255, 179, 209, 0.5)' : 'rgba(203, 166, 247, 0.35)'}`,
            }} />
            <div style={{
              position: 'absolute',
              left: '-8px',
              top: '24px',
              width: 0,
              height: 0,
              borderTop: '9px solid transparent',
              borderBottom: '9px solid transparent',
              borderRight: '10px solid var(--color-bg-panel)',
            }} />

            {thinking ? (
              <span style={{ color: 'var(--color-dim)', fontStyle: 'italic' }}>
                miau está pensando
                <span style={{ animation: 'miau-dots 1.2s step-end infinite' }}>...</span>
              </span>
            ) : phase === 'rage' ? (
              <span style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>
                VOCÊ ME IRRITOU.

                eu avisei. eu SEMPRE aviso.
                agora não tem mais volta.
              </span>
            ) : (
              <>
                <span style={{ color: '#f0e8ff' }}>{displayedText}</span>
                {isTyping && (
                  <span style={{
                    color: '#cba6f7',
                    marginLeft: '2px',
                    animation: 'blink 1s step-end infinite',
                  }}>▌</span>
                )}
              </>
            )}
          </div>

          {showChoices && choices && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              animation: 'miau-choices-in 0.3s ease-out',
            }}>
              {choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(choice)}
                  style={{
                    textAlign: 'left',
                    padding: '9px 14px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(203, 166, 247, 0.3)',
                    borderRadius: '6px',
                    color: '#e0d4f5',
                    fontFamily: 'inherit',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    lineHeight: 1.5,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(203, 166, 247, 0.15)';
                    e.currentTarget.style.borderColor = '#cba6f7';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(203, 166, 247, 0.3)';
                    e.currentTarget.style.color = '#e0d4f5';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{
                    color: '#cba6f7',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    textShadow: '0 0 6px rgba(203, 166, 247, 0.5)',
                  }}>
                    {String.fromCharCode(97 + i)})
                  </span>
                  <span style={{ flex: 1 }}>{choice.text}</span>
                </button>
              ))}
            </div>
          )}

          {phase === 'rage' && (
            <div style={{
              textAlign: 'center',
              padding: '18px',
              border: '1px solid var(--color-error)',
              borderRadius: '8px',
              background: 'rgba(239, 100, 97, 0.15)',
              boxShadow: '0 0 30px var(--color-error-a40)',
              animation: 'rage-shake 0.5s infinite',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💀</div>
              <div style={{
                color: 'var(--color-error)',
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '6px',
                textShadow: '0 0 8px var(--color-error)',
                letterSpacing: '2px',
              }}>
                SISTEMA COMPROMETIDO
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text)', lineHeight: 1.6 }}>
                a miau está te encontrando...<br/>
                não tente fechar as janelas.
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes miau-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes miau-dots {
          0%   { opacity: 0.3; }
          33%  { opacity: 1; }
          66%  { opacity: 0.3; }
          100% { opacity: 1; }
        }
        @keyframes miau-choices-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes miau-danger-stripes {
          from { background-position: 0 0; }
          to   { background-position: 16px 0; }
        }
        @keyframes rage-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}