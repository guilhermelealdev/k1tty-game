// src/commands/commands.js

import {
  getNodeByPath, getParentPath, getFileName, joinPath,
  formatPermissions, formatSize, formatDate, deepClone, generateId
} from '../utils/helpers.js';
import { canRead, canWrite } from '../utils/permissions.js';
import { forumPages } from '../data/forumData.js';
import { fetchCatImage } from '../services/catApi.js';
import { fetchAdvice } from '../services/adviceApi.js';
import { fetchCatFact } from '../services/catFactApi.js';
import { fetchQuote } from '../services/quoteApi.js';
import { fetchPokemon, getRandomCatPokemonId } from '../services/pokeApi.js';
import {
  PACKAGE_IDS,
  PACKAGES_WITH_WINDOW,
  formatAptHelpList,
  formatHelpDescriptions,
} from '../data/packages.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { isAchieved } from '../data/achievementChecks.js';
import { THEMES } from '../data/themes.js';

/* ============================================================
   Helpers
   ============================================================ */
function setFlag(dispatch, flag, value = true) {
  dispatch({ type: 'SET_FLAG', payload: { flag, value } });
}

function pushStat(dispatch, key, value) {
  dispatch({ type: 'STAT_PUSH', payload: { key, value } });
}

function displayNode(node, showDetails = false, showHidden = false) {
  if (!showHidden && node.hidden) return null;

  if (showDetails) {
    const perms = formatPermissions(node);
    const size = formatSize(node.size || 0);
    const date = formatDate(node.lastModified);
    const type = node.type === 'dir' ? 'd' : '-';
    return `${type}${perms} ${node.owner.padEnd(8)} ${size.padEnd(6)} ${date} ${node.name}`;
  }
  return node.name;
}

function checkOwnPassword(node, options) {
  if (!node || !node.password) return null;
  if (!options.password) return 'needs';
  if (options.password !== node.password) return 'wrong';
  return null;
}

/* Glob simples: *.meow, *.txt, foo? */
function expandGlob(pattern, state) {
  if (!pattern || !/[*?]/.test(pattern)) return [pattern];

  const fullPatternPath = joinPath(state.currentDirectory, pattern);
  const dirPath = getParentPath(fullPatternPath);
  const dirNode = getNodeByPath(state.filesystem, dirPath);

  if (!dirNode || dirNode.type !== 'dir') return [];

  const baseNamePattern = getFileName(fullPatternPath);
  const regex = new RegExp(
    '^' +
    baseNamePattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.') +
    '$'
  );

  const matched = Object.keys(dirNode.children || {})
    .filter(name => regex.test(name))
    .sort();

  return matched.map(name =>
    dirPath === '/' ? `/${name}` : `${dirPath}/${name}`
  );
}

/* Converte string de padrão tipo "k1tty" em RegExp (para grep) */
function buildGrepRegex(pattern, ignoreCase = true) {
  try {
    const hasMeta = /[\\^$.*+?()[\]{}|]/.test(pattern);
    if (hasMeta) {
      return new RegExp(pattern, ignoreCase ? 'i' : '');
    }
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, ignoreCase ? 'i' : '');
  } catch {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, ignoreCase ? 'i' : '');
  }
}

function generateRemovalLogs() {
  const baseDirs = [
    '/home/k1tty/Documents',
    '/home/k1tty/Music',
    '/home/k1tty/Pictures',
    '/home/k1tty/.notes.txt',
    '/etc', '/var', '/tmp', '/usr', '/bin', '/root', '/boot',
    '/dev', '/proc', '/sys', '/lib', '/lib64', '/sbin', '/srv',
    '/opt', '/mnt', '/media', '/run', '/lost+found',
    '/home', '/home/k1tty',
  ];

  const specificFiles = [
    '/home/k1tty/Documents/DO NOT OPEN',
    '/home/k1tty/Documents/DO NOT OPEN/whisper.txt',
    '/home/k1tty/Documents/DO NOT OPEN/password.txt',
    '/etc/logo.txt',
    '/var/log/userlog',
    '/usr/bin/commands.txt',
    '/root/secret',
    '/root/secret/README.txt',
    '/root/secret/cats.tar',
    '/root/secret/cat_photos.zip',
    '/home/k1tty/Pictures/cat_photo.jpg',
    '/home/k1tty/Pictures/screenshot_terminal.png',
    '/etc/hostname',
    '/etc/os-release',
  ];

  const logs = [];

  for (const dir of baseDirs) {
    logs.push(`removendo ${dir}...`);
    if (dir.startsWith('/home') || dir === '/etc' || dir === '/var' || dir === '/usr') {
      for (let i = 0; i < 3; i++) {
        logs.push(`removendo ${dir}/arquivo_${i}.txt...`);
      }
    }
  }

  for (const file of specificFiles) {
    logs.push(`removendo ${file}...`);
  }

  const extraSystem = [
    '/dev/null', '/dev/random', '/proc/cpuinfo', '/sys/kernel',
    '/tmp/.X11-unix', '/var/log/syslog', '/var/log/auth.log',
    '/usr/share/doc', '/usr/share/man', '/lib/modules',
    '/boot/vmlinuz', '/boot/initrd.img',
  ];
  for (const path of extraSystem) {
    logs.push(`removendo ${path}...`);
  }

  logs.push('Sistema corrompido!');
  return logs;
}

/* ============================================================
   First-visit hints
   ============================================================ */
const FIRST_VISIT_HINTS = {
  '/home/k1tty/Documents/DO NOT OPEN': {
    flag: 'visited_doNotOpen',
    text: '▸ Um diretório com nome imperativo. Dentro dele, dois arquivos: um que sussurra, outro que exige um nome.',
  },
  '/root': {
    flag: 'visited_root',
    text: '▸ Você está na raiz do sistema. Poucos chegam até aqui sem sujar as mãos.',
  },
  '/root/secret': {
    flag: 'visited_secret',
    text: '▸ É aqui que as coisas importantes moram. Leia o README com atenção.',
  },
  '/home/k1tty/Music': {
    flag: 'visited_music',
    text: '▸ Nem toda faixa é só som. Algumas guardam padrões.',
  },
  '/home/k1tty/Downloads': {
    flag: 'visited_downloads',
    text: '▸ O que foi enviado está aqui. Algo espera ser instalado.',
  },
  '/home/k1tty/from_phone': {
    flag: 'visited_fromPhone',
    text: '▸ Arquivos vindos do celular. Um deles está trancado com uma palavra.',
  },
  '/home/k1tty/cats': {
    flag: 'visited_cats',
    text: '▸ Um backup antigo que voltou pra casa. Leia o readme antes de ir embora.',
  },
};

/* ============================================================
   Comandos base adicionais (NOVO: pwd, echo, history)
   ============================================================ */

export function executePwd(args, state, dispatch) {
  return { command: 'pwd', output: state.currentDirectory, type: 'normal' };
}

export function executeEcho(args, state, dispatch) {
  const text = args.join(' ');
  return { command: 'echo ' + text, output: text, type: 'normal' };
}

export function executeHistory(args, state, dispatch) {
  const lines = (state.history || []).map((entry, i) => {
    const n = String(i + 1).padStart(4, ' ');
    return `${n}  ${entry.command || ''}`;
  });
  return {
    command: 'history',
    output: lines.length ? lines.join('\n') : '(vazio)',
    type: 'normal',
  };
}

/* ============================================================
   Teste simples (executeTestAll) — ORIGINAL + teste de pwd
   ============================================================ */
export function executeTestAll(state) {
  const lines = [];
  const log = (msg) => lines.push(msg);

  const ok = (msg) => log(`  ✓ ${msg}`);
  const fail = (msg) => log(`  ✗ ${msg}`);
  const info = (msg) => log(`  ℹ ${msg}`);

  log('═══════════════════════════════════════');
  log('  TESTE GERAL DE COMANDOS - k1tty');
  log('═══════════════════════════════════════');
  log('');

  const noopDispatch = () => {};

  const tests = [
    { cmd: 'ls', args: [],                       label: 'ls' },
    { cmd: 'ls -a', args: ['-a'],                label: 'ls -a' },
    { cmd: 'ls -l', args: ['-l'],                label: 'ls -l' },
    { cmd: 'pwd', args: [],                      label: 'pwd' },
    { cmd: 'whoami', args: [],                   label: 'whoami' },
    { cmd: 'date', args: [],                     label: 'date' },
    { cmd: 'help', args: [],                     label: 'help' },
    { cmd: 'fastfetch', args: [],                label: 'fastfetch' },
    { cmd: 'howleft', args: [],                  label: 'howleft' },
    { cmd: 'whatnow', args: [],                  label: 'whatnow' },
    { cmd: 'log', args: [],                      label: 'log' },
    { cmd: 'cat Documents/readme.txt', args: ['Documents/readme.txt'], label: 'cat (arquivo público)' },
    { cmd: 'grep "k1tty" /etc/os-release', args: ['k1tty', '/etc/os-release'], label: 'grep' },
    { cmd: 'find readme', args: ['readme'],      label: 'find' },
  ];

  log('── Comandos base ──');
  for (const t of tests) {
    try {
      let result;
      switch (t.cmd.split(' ')[0]) {
        case 'ls': result = executeLs(t.args, state, noopDispatch, {}); break;
        case 'pwd': result = executePwd(t.args, state, noopDispatch); break;
        case 'whoami': result = executeWhoami(t.args, state, noopDispatch); break;
        case 'date': result = executeDate(t.args, state, noopDispatch); break;
        case 'help': result = executeHelp(t.args, state, noopDispatch); break;
        case 'fastfetch': result = executeFastfetch(t.args, state, noopDispatch); break;
        case 'howleft': result = executeHowleft(t.args, state, noopDispatch); break;
        case 'whatnow': result = executeWhatnow(t.args, state, noopDispatch); break;
        case 'log': result = executeLog(t.args, state, noopDispatch); break;
        case 'cat': result = executeCat(t.args, state, noopDispatch, {}); break;
        case 'grep': result = executeGrep(t.args, state, noopDispatch); break;
        case 'find': result = executeFind(t.args, state, noopDispatch); break;
        default: result = { output: '(não testado)' };
      }
      if (result && result.type !== 'error') {
        ok(`${t.label} → OK`);
      } else {
        fail(`${t.label} → ERRO: ${result?.output || 'sem saída'}`);
      }
    } catch (err) {
      fail(`${t.label} → EXCEÇÃO: ${err.message}`);
    }
  }
  log('');

  log('── Pacotes instalados ──');
  const installed = state.installedPackages || [];
  if (installed.length === 0) info('Nenhum pacote instalado.');
  else installed.forEach(pkg => ok(`${pkg} instalado`));
  log('');

  log('── Flags ──');
  const flagEntries = Object.entries(state.flags || {});
  if (flagEntries.length === 0) info('Nenhuma flag definida.');
  else for (const [k, v] of flagEntries) log(`  • ${k} = ${v}`);
  log('');

  log('── Conquistas ──');
  const unlocked = state.unlockedAchievements || [];
  log(`  Total: ${unlocked.length} desbloqueadas`);
  unlocked.forEach(id => log(`  ✓ ${id}`));
  log('');

  log('── Estatísticas ──');
  log(`  Progresso:        ${state.progress}%`);
  log(`  WiFi:             ${state.wifiConnected ? 'Conectado' : 'Desconectado'}`);
  log(`  Diretório atual:  ${state.currentDirectory}`);
  log(`  Snapshots:        ${state.snapshots?.length || 0}`);
  log(`  Janelas abertas:  ${state.openWindows?.length || 0}`);
  log(`  Tamanho do FS:    ${JSON.stringify(state.filesystem).length} bytes`);
  log(`  Histórico:        ${state.history?.length || 0} entradas`);
  log(`  Tema:             ${state.theme || 'neon'}`);
  log(`  Comandos rodados: ${state.stats?.commandsRun || 0}`);
  log(`  Arquivos lidos:   ${state.stats?.filesRead?.length || 0}`);
  log('');

  log('═══════════════════════════════════════');
  log(`  Pacotes: ${installed.length} | Progresso: ${state.progress}%`);
  log('═══════════════════════════════════════');

  return { command: 'testall', output: lines.join('\n'), type: 'success' };
}

/* ============================================================
   TESTE COMPLETO (end-to-end) — ORIGINAL + teste de pwd
   ============================================================ */
function makeCaptureDispatch() {
  const actions = [];
  const dispatch = (action) => actions.push(action);
  return { actions, dispatch };
}

function actionsInclude(actions, type) {
  return actions.some((a) => a.type === type);
}

function actionsIncludeFlag(actions, flag, value = true) {
  return actions.some(
    (a) =>
      a.type === 'SET_FLAG' &&
      a.payload?.flag === flag &&
      a.payload?.value === value
  );
}

export function executeFullGameTest(state) {
  const lines = [];
  const log = (msg) => lines.push(msg);
  const ok = (msg) => log(`  ✓ ${msg}`);
  const fail = (msg) => log(`  ✗ ${msg}`);
  const warn = (msg) => log(`  ⚠ ${msg}`);
  const info = (msg) => log(`  ℹ ${msg}`);

  let totalOk = 0;
  let totalFail = 0;
  let totalWarn = 0;

  const pass = (msg) => { ok(msg); totalOk++; };
  const failure = (msg) => { fail(msg); totalFail++; };
  const warning = (msg) => { warn(msg); totalWarn++; };

  log('═══════════════════════════════════════════════');
  log('  TESTE COMPLETO DO JOGO — k1tty');
  log('  (headless, não altera o save atual)');
  log('═══════════════════════════════════════════════');
  log('');

  const clone = deepClone(state);
  if (!clone.flags) clone.flags = {};
  if (!clone.stats) clone.stats = { commandsRun: 0, filesRead: [], tracksPlayed: [] };

  /* 1) ESTRUTURA DO FILESYSTEM */
  log('── 1. ESTRUTURA DO FILESYSTEM ──');

  const requiredPaths = [
    '/home/k1tty',
    '/home/k1tty/Documents',
    '/home/k1tty/Documents/DO NOT OPEN',
    '/home/k1tty/Documents/DO NOT OPEN/password.txt',
    '/home/k1tty/Documents/DO NOT OPEN/whisper.txt',
    '/home/k1tty/Documents/readme.txt',
    '/home/k1tty/Downloads',
    '/home/k1tty/Downloads/apt-installer-tui.deb',
    '/home/k1tty/Music',
    '/home/k1tty/Music/.meow_index',
    '/home/k1tty/Pictures',
    '/home/k1tty/.notes.txt',
    '/etc/logo.txt',
    '/etc/os-release',
    '/etc/hostname',
    '/var/log/userlog',
    '/usr/bin/commands.txt',
    '/usr/share/wallpapers',
    '/usr/share/icons',
    '/root',
    '/root/secret',
    '/root/secret/README.txt',
    '/root/secret/cats.tar',
    '/root/secret/cat_photos.zip',
  ];

  for (const p of requiredPaths) {
    const node = getNodeByPath(clone.filesystem, p);
    if (node) pass(`existe: ${p}`);
    else failure(`FALTANDO: ${p}`);
  }
  log('');

  /* 2) ARQUIVOS OCULTOS */
  log('── 2. ARQUIVOS OCULTOS ──');

  const notesNode = getNodeByPath(clone.filesystem, '/home/k1tty/.notes.txt');
  if (notesNode?.hidden) pass('.notes.txt está marcado como hidden');
  else failure('.notes.txt não está hidden');

  const meowIndexNode = getNodeByPath(clone.filesystem, '/home/k1tty/Music/.meow_index');
  if (meowIndexNode?.hidden) pass('.meow_index está marcado como hidden');
  else failure('.meow_index não está hidden');

  log('');

  /* 3) SENHAS E SEGREDOS */
  log('── 3. SENHAS E SEGREDOS ──');

  const pwNode = getNodeByPath(clone.filesystem, '/home/k1tty/Documents/DO NOT OPEN/password.txt');
  if (pwNode?.content?.includes(clone.sudoPassword)) pass(`password.txt contém a senha do sudo`);
  else failure('password.txt NÃO contém a senha do sudo do estado');

  if (pwNode?.requiresUsername === true) pass('password.txt exige username');
  else failure('password.txt NÃO exige username (deveria)');

  if (pwNode?.owner === 'k1tty') pass('password.txt tem owner "k1tty"');
  else failure(`password.txt tem owner "${pwNode?.owner}"`);

  if (clone.wifiPassword === 'meow12345') pass(`senha do WiFi = ${clone.wifiPassword}`);
  else failure(`senha do WiFi inesperada`);

  if (clone.wifiName === "k1tty's home") pass(`SSID = ${clone.wifiName}`);
  else failure(`SSID inesperado`);

  const notesContent = notesNode?.content || '';
  if (notesContent.includes('meow12345')) pass('.notes.txt contém a senha do WiFi');
  else failure('.notes.txt NÃO contém a senha do WiFi');

  if (notesContent.includes("k1tty's home")) pass('.notes.txt contém o SSID correto');
  else failure('.notes.txt NÃO contém o SSID');

  const meowContent = meowIndexNode?.content || '';
  if (meowContent.includes('m30w')) pass('.meow_index contém "m30w"');
  else failure('.meow_index NÃO contém "m30w"');

  const zipNode = getNodeByPath(clone.filesystem, '/root/secret/cat_photos.zip');
  if (zipNode?.password === 'm30w') pass('cat_photos.zip protegido com "m30w"');
  else failure(`cat_photos.zip com senha inesperada`);

  const catsTarNode = getNodeByPath(clone.filesystem, '/root/secret/cats.tar');
  if (catsTarNode) pass('cats.tar está em /root/secret');
  else failure('cats.tar NÃO está em /root/secret');

  const catsTarInDocs = getNodeByPath(clone.filesystem, '/home/k1tty/Documents/cats.tar');
  if (!catsTarInDocs) pass('cats.tar NÃO está em ~/Documents');
  else failure('cats.tar ainda está em ~/Documents');

  log('');

  /* 4) FLUXO NARRATIVO */
  log('── 4. FLUXO NARRATIVO ──');

  {
    const cap = makeCaptureDispatch();
    const r = executeWhoami([], clone, cap.dispatch);
    if (r.output === 'k1tty') pass('4.1 whoami → k1tty');
    else failure(`4.1 whoami retornou ${r.output}`);
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeLs(['-a'], clone, cap.dispatch);
    if (r.output.includes('.notes.txt')) pass('4.2 ls -a mostra .notes.txt');
    else failure(`4.2 ls -a não mostrou .notes.txt`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['whisper.txt'], ctx, cap.dispatch, {});
    if (r.output && r.output.toLowerCase().includes('k1tty')) pass('4.3 whisper.txt menciona k1tty');
    else failure('4.3 whisper.txt não menciona k1tty');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['password.txt'], ctx, cap.dispatch, {});
    if (r.needsUsername) pass('4.4 password.txt sem username → pede username');
    else failure(`4.4 password.txt não pediu username`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['password.txt'], ctx, cap.dispatch, { username: 'root' });
    if (r.type === 'error') pass('4.5 password.txt com username errado → erro');
    else failure('4.5 password.txt aceitou username errado');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN' };
    const r = executeCat(['password.txt'], ctx, cap.dispatch, { username: 'k1tty' });
    if (r.output?.includes(clone.sudoPassword)) pass('4.6 password.txt com k1tty → revela senha');
    else failure('4.6 password.txt não revelou a senha');

    if (actionsIncludeFlag(cap.actions, 'foundSudoPassword')) pass('4.6b flag foundSudoPassword setada');
    else failure('4.6b flag foundSudoPassword NÃO setada');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeConnect(["k1tty's home"], clone, cap.dispatch, {});
    if (r.needsPassword) pass('4.7 connect sem senha → pede senha');
    else failure('4.7 connect não pediu senha');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeConnect(["k1tty's home"], clone, cap.dispatch, { password: 'errada' });
    if (r.type === 'error') pass('4.8 connect com senha errada → erro');
    else failure('4.8 connect aceitou senha errada');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeConnect(["k1tty's home"], clone, cap.dispatch, { password: clone.wifiPassword });
    if (r.type === 'success' && actionsInclude(cap.actions, 'SET_WIFI_CONNECTED')) {
      pass('4.9 connect com senha certa → conecta');
    } else failure(`4.9 connect falhou: ${r.output}`);
  }

  {
    const cap = makeCaptureDispatch();
    const offline = { ...clone, wifiConnected: false };
    const r = executeApt(['install', 'matrix'], offline, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'error' && r.output.toLowerCase().includes('internet')) pass('4.10 apt sem WiFi → erro');
    else failure(`4.10 apt sem WiFi não deu erro esperado`);
  }

  {
    const cap = makeCaptureDispatch();
    const online = { ...clone, wifiConnected: true };
    const r = executeApt(['install', 'matrix'], online, cap.dispatch, {});
    if (r.type === 'error' && r.output.toLowerCase().includes('sudo')) pass('4.11 apt sem senha sudo → erro');
    else failure(`4.11 apt não exigiu sudo`);
  }

  {
    const cap = makeCaptureDispatch();
    const online = { ...clone, wifiConnected: true };
    const r = executeApt(['install', 'matrix'], online, cap.dispatch, { password: 'errada' });
    if (r.type === 'error') pass('4.12 apt com senha sudo errada → erro');
    else failure('4.12 apt aceitou senha errada');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone,
      wifiConnected: true,
      currentDirectory: '/home/k1tty/Downloads',
      installedPackages: [],
    };
    const r = executeApt(['install', './apt-installer-tui.deb'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'success' && actionsInclude(cap.actions, 'INSTALL_PACKAGE')) {
      pass('4.13 install ./apt-installer-tui.deb → instala apt-cli');
    } else failure(`4.13 instalação de .deb local falhou`);
    if (actionsIncludeFlag(cap.actions, 'installedAptCli')) pass('4.13b flag installedAptCli setada');
    else failure('4.13b flag installedAptCli NÃO setada');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone,
      wifiConnected: true,
      currentDirectory: '/home/k1tty/Downloads',
      installedPackages: [],
    };
    const r = executeApt(['install', 'apt-installer-tui.deb'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'success') pass('4.14 install apt-installer-tui.deb (sem ./) também funciona');
    else failure(`4.14 install sem ./ falhou`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, wifiConnected: true, installedPackages: [] };
    const r = executeSudo(['apt', 'install', 'matrix'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'success' && actionsInclude(cap.actions, 'INSTALL_PACKAGE')) {
      pass('4.15 sudo apt install matrix → instala');
    } else failure(`4.15 sudo apt install matrix falhou`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, wifiConnected: true };
    const r = executeApt(['install', 'pacote-inexistente'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'error') pass('4.16 pacote inexistente → erro');
    else failure('4.16 aceitou pacote inexistente');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone,
      currentDirectory: '/root/secret',
      installedPackages: ['untar'],
    };
    const r = executeUntar(['cats.tar'], ctx, cap.dispatch, {});
    if (r.type === 'error' && r.output.toLowerCase().includes('backup')) pass('4.17 untar fora de Backup → erro');
    else failure(`4.17 untar fora de Backup: ${r.output}`);
  }

  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    const catsTar = getNodeByPath(fs, '/root/secret/cats.tar');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: { 'cats.tar': catsTar },
    };
    const ctx = {
      ...clone,
      filesystem: fs,
      currentDirectory: '/home/k1tty/Backup',
      installedPackages: ['untar'],
    };
    const r = executeUntar(['cats.tar'], ctx, cap.dispatch, {});
    if (r.type === 'error' && r.output.toLowerCase().includes('password')) pass('4.18 untar sem password.txt → erro');
    else failure(`4.18 untar sem password.txt não deu erro esperado`);
  }

  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    const catsTar = getNodeByPath(fs, '/root/secret/cats.tar');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: {
        'password.txt': {
          name: 'password.txt', type: 'file', content: 'errado',
          permissions: 'rw-r--r--', owner: 'k1tty',
          hidden: false, locked: false, password: null,
          size: 6, lastModified: new Date().toISOString(),
        },
        'cats.tar': catsTar,
      },
    };
    const ctx = {
      ...clone,
      filesystem: fs,
      currentDirectory: '/home/k1tty/Backup',
      installedPackages: ['untar'],
    };
    const r = executeUntar(['cats.tar'], ctx, cap.dispatch, {});
    if (r.type === 'error') pass('4.19 untar com senha errada → erro');
    else failure(`4.19 untar aceitou senha errada`);
  }

  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    const catsTar = getNodeByPath(fs, '/root/secret/cats.tar');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: {
        'password.txt': {
          name: 'password.txt', type: 'file', content: 'm30w',
          permissions: 'rw-r--r--', owner: 'k1tty',
          hidden: false, locked: false, password: null,
          size: 4, lastModified: new Date().toISOString(),
        },
        'cats.tar': catsTar,
      },
    };
    const ctx = {
      ...clone,
      filesystem: fs,
      currentDirectory: '/home/k1tty/Backup',
      installedPackages: ['untar'],
    };
    const r = executeUntar(['cats.tar'], ctx, cap.dispatch, {});
    if (r.type === 'success' && actionsInclude(cap.actions, 'UPDATE_FILESYSTEM')) {
      pass('4.20 untar com m30w → sucesso');
    } else failure(`4.20 untar com senha correta falhou`);
    if (actionsIncludeFlag(cap.actions, 'catsUntarred')) pass('4.20b flag catsUntarred setada');
    else failure('4.20b flag catsUntarred NÃO setada');
  }

  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: {},
    };
    const ctx = {
      ...clone,
      filesystem: fs,
      currentDirectory: '/home/k1tty',
      installedPackages: ['untar'],
    };
    const r = executeSudo(['mv', '/root/secret/cats.tar', 'Backup/'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'normal' && actionsInclude(cap.actions, 'UPDATE_FILESYSTEM')) {
      pass('4.20c sudo mv /root/secret/cats.tar Backup/ → move');
    } else failure(`4.20c sudo mv cats.tar falhou`);
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeSudo(['mv', '/root/secret/cats.tar', 'Backup/'], clone, cap.dispatch, { password: 'errada' });
    if (r.type === 'error') pass('4.20d sudo mv com senha errada → erro');
    else failure('4.20d sudo mv aceitou senha errada');
  }

  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: {},
    };
    const ctx = {
      ...clone,
      filesystem: fs,
      currentDirectory: '/home/k1tty',
      installedPackages: ['untar'],
    };
    const r = executeSudo(['cp', '/root/secret/cats.tar', 'Backup/'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'normal' && actionsInclude(cap.actions, 'UPDATE_FILESYSTEM')) {
      pass('4.20e sudo cp /root/secret/cats.tar Backup/ → copia');
    } else failure(`4.20e sudo cp cats.tar falhou`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone,
      currentDirectory: '/root/secret',
      installedPackages: ['unzip'],
    };
    const r = executeUnzip(['cat_photos.zip'], ctx, cap.dispatch, {});
    if (r.needsPassword) pass('4.21 unzip cat_photos.zip sem senha → pede senha');
    else failure(`4.21 unzip não pediu senha`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone,
      currentDirectory: '/root/secret',
      installedPackages: ['unzip'],
    };
    const r = executeUnzip(['cat_photos.zip'], ctx, cap.dispatch, { password: 'errada' });
    if (r.type === 'error') pass('4.22 unzip com senha errada → erro');
    else failure('4.22 unzip aceitou senha errada');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone,
      currentDirectory: '/root/secret',
      installedPackages: ['unzip'],
    };
    const r = executeUnzip(['cat_photos.zip'], ctx, cap.dispatch, { password: 'm30w' });
    if (r.type === 'success' && actionsInclude(cap.actions, 'EXTRACT_CAT_PHOTOS')) {
      pass('4.23 unzip com m30w → extrai fotos');
    } else failure(`4.23 unzip com senha correta falhou`);
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeSudo(['cd', '/root/secret'], clone, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'normal' && actionsInclude(cap.actions, 'CHANGE_DIRECTORY')) {
      pass('4.24 sudo cd /root/secret → entra');
    } else failure(`4.24 sudo cd /root/secret falhou`);
    if (actionsIncludeFlag(cap.actions, 'openedSecret')) pass('4.24b flag openedSecret setada');
    else failure('4.24b flag openedSecret NÃO setada');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeCd(['/root'], clone, cap.dispatch, {});
    if (r.type === 'error') pass('4.25 cd /root sem sudo → erro');
    else failure('4.25 cd /root sem sudo foi permitido');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeVictory([], clone, cap.dispatch);
    if (r.type === 'error') pass('4.26 victory sem finalUnlocked → erro');
    else failure('4.26 victory foi permitido sem desbloqueio');
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, flags: { ...clone.flags, finalUnlocked: true } };
    const r = executeVictory([], ctx, cap.dispatch);
    if (r.type === 'success' && actionsInclude(cap.actions, 'OPEN_WINDOW')) {
      pass('4.27 victory com finalUnlocked → abre créditos');
    } else failure(`4.27 victory com finalUnlocked falhou`);
  }

  log('');

  /* 5) CORRUPÇÃO DE SISTEMA */
  log('── 5. CORRUPÇÃO DE SISTEMA ──');

  {
    const cap = makeCaptureDispatch();
    const r = executeRm(['-rf', '/'], clone, cap.dispatch, {});
    if (r.needsConfirmation) pass('5.1 rm -rf / sem confirmar → pede confirmação');
    else failure('5.1 rm -rf / não pediu confirmação');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeRm(['-rf', '/'], clone, cap.dispatch, { confirmed: true });
    if (r.systemCorrupting && Array.isArray(r.removalLogs) && r.removalLogs.length > 0) {
      pass('5.2 rm -rf / confirmado → dispara corrupção com logs');
    } else failure('5.2 rm -rf / confirmado não disparou corrupção');
  }

  {
    const cap = makeCaptureDispatch();
    const r = executeSudo(['rm', '-rf', '/*'], clone, cap.dispatch, { password: clone.sudoPassword });
    if (r.systemCorrupting) pass('5.3 sudo rm -rf /* → corrompe direto');
    else failure('5.3 sudo rm -rf /* não corrompeu');
  }

  log('');

  /* 6) PACOTES */
  log('── 6. PACOTES ──');

  for (const pkg of PACKAGES_WITH_WINDOW) {
    if (pkg.openWindow && typeof pkg.openWindow === 'string') {
      pass(`pacote "${pkg.id}" → abre janela "${pkg.openWindow}"`);
    } else {
      failure(`pacote "${pkg.id}" sem openWindow válido`);
    }
  }

  const noWindowPkgs = PACKAGE_IDS.filter(
    (id) => !PACKAGES_WITH_WINDOW.find((p) => p.id === id)
  );
  for (const id of noWindowPkgs) {
    pass(`pacote "${id}" → sem janela (comando puro)`);
  }

  log('');

  /* 7) CONQUISTAS (estrutura) */
  log('── 7. CONQUISTAS (estrutura) ──');

  const validAchievementIds = new Set(ACHIEVEMENTS.map(a => a.id));

  let achievementStructOk = 0;
  for (const a of ACHIEVEMENTS) {
    if (a.id && a.name && a.desc && a.icon && a.category) achievementStructOk++;
    else failure(`conquista "${a.id || '???'}" com campos faltando`);
  }
  pass(`${achievementStructOk}/${ACHIEVEMENTS.length} conquistas com estrutura válida`);

  const unlocked = state.unlockedAchievements || [];
  info(`conquistas desbloqueadas neste save: ${unlocked.length}`);

  if (unlocked.length === 0) {
    pass('nenhuma conquista destravada ainda (ok para save novo)');
  } else {
    let invalid = 0;
    for (const id of unlocked) {
      if (!validAchievementIds.has(id)) {
        failure(`conquista "${id}" destravada mas NÃO existe em ACHIEVEMENTS`);
        invalid++;
      }
    }
    if (invalid === 0) pass(`todas as ${unlocked.length} conquistas destravadas existem em ACHIEVEMENTS`);
  }

  const validCategories = new Set([
    'inicio', 'exploracao', 'sistema', 'enigma', 'final', 'easter_egg',
  ]);
  let badCategory = 0;
  for (const a of ACHIEVEMENTS) {
    if (!validCategories.has(a.category)) {
      failure(`conquista "${a.id}" usa categoria desconhecida "${a.category}"`);
      badCategory++;
    }
  }
  if (badCategory === 0) pass('todas as conquistas usam categorias válidas');

  log('');

  /* 8) CONSISTÊNCIA DE EXECUTORES */
  log('── 8. CONSISTÊNCIA DE EXECUTORES ──');

  const commandMapExpected = {
    ls: executeLs, cd: executeCd, cat: executeCat, touch: executeTouch,
    mkdir: executeMkdir, rm: executeRm, mv: executeMv, find: executeFind,
    grep: executeGrep, date: executeDate, whoami: executeWhoami, help: executeHelp,
    '--help': executeHelp, fastfetch: executeFastfetch, cowsay: executeCowsay,
    whatnow: executeWhatnow, howleft: executeHowleft, notes: executeNotes,
    log: executeLog, snapshot: executeSnapshot, reboot: executeReboot,
    apt: executeApt, web: executeWeb, ping: executePing, connect: executeConnect,
    nvim: executeNvim, sudo: executeSudo, admin: executeAdmin, clear: executeClear,
    unzip: executeUnzip, untar: executeUntar, victory: executeVictory,
    achievements: executeAchievements, meta: executeMeta, 'miau-vn': executeMiauVn,
    catfact: executeCatFact, quote: executeQuote, pokemon: executePokemon,
    switchos: executeSwitchOS,
    pwd: executePwd, echo: executeEcho, history: executeHistory,
  };

  for (const [name, fn] of Object.entries(commandMapExpected)) {
    if (typeof fn === 'function') pass(`executor "${name}" existe`);
    else failure(`executor "${name}" NÃO é uma função`);
  }

  log('');

  /* 9) FLAGS DE ADMIN */
  log('── 9. FLAGS DE ADMIN ──');

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone, wifiConnected: true, installedPackages: [],
      flags: { ...clone.flags, aptRequiresSudo: false },
    };
    const r = executeApt(['install', 'matrix'], ctx, cap.dispatch, {});
    if (r.type === 'success' && actionsInclude(cap.actions, 'INSTALL_PACKAGE')) pass('aptRequiresSudo=false → apt sem senha funciona');
    else failure(`aptRequiresSudo=false não funcionou`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone, wifiConnected: false, installedPackages: [],
      flags: { ...clone.flags, aptRequiresWifi: false },
    };
    const r = executeApt(['install', 'matrix'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'success' && actionsInclude(cap.actions, 'INSTALL_PACKAGE')) pass('aptRequiresWifi=false → apt sem wifi funciona');
    else failure(`aptRequiresWifi=false não funcionou`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone, installedPackages: ['unzip'],
      flags: { ...clone.flags, skipBluetooth: true, pairedPhone: false, musicExtracted: false },
    };
    const r = executeUnzip(['music_pack.zip'], ctx, cap.dispatch, {});
    if (r.type === 'success' && actionsInclude(cap.actions, 'EXTRACT_MUSIC')) pass('skipBluetooth=true → unzip music_pack.zip sem Bluetooth');
    else failure(`skipBluetooth=true não funcionou`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone, currentDirectory: '/home/k1tty/Documents/DO NOT OPEN',
      flags: { ...clone.flags, skipPuzzlePasswords: true },
    };
    const r = executeCat(['password.txt'], ctx, cap.dispatch, {});
    if (r.type === 'normal' && r.output.includes(clone.sudoPassword)) pass('skipPuzzlePasswords=true → password.txt revela direto');
    else failure(`skipPuzzlePasswords=true não pulou username`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = {
      ...clone, currentDirectory: '/root/secret', installedPackages: ['unzip'],
      flags: { ...clone.flags, skipPuzzlePasswords: true, finalUnlocked: false },
    };
    const r = executeUnzip(['cat_photos.zip'], ctx, cap.dispatch, {});
    if (r.type === 'success' && actionsInclude(cap.actions, 'EXTRACT_CAT_PHOTOS')) pass('skipPuzzlePasswords=true → unzip cat_photos.zip sem senha');
    else failure(`skipPuzzlePasswords=true não pulou senha do zip`);
  }

  {
    const cap = makeCaptureDispatch();
    const fs = deepClone(clone.filesystem);
    const home = getNodeByPath(fs, '/home/k1tty');
    const catsTar = getNodeByPath(fs, '/root/secret/cats.tar');
    home.children['Backup'] = {
      name: 'Backup', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: new Date().toISOString(),
      children: { 'cats.tar': catsTar },
    };
    const ctx = {
      ...clone, filesystem: fs, currentDirectory: '/home/k1tty/Backup',
      installedPackages: ['untar'],
      flags: { ...clone.flags, skipPuzzlePasswords: true, catsUntarred: false },
    };
    const r = executeUntar(['cats.tar'], ctx, cap.dispatch, {});
    if (r.type === 'success' && actionsInclude(cap.actions, 'UPDATE_FILESYSTEM')) pass('skipPuzzlePasswords=true → untar sem password.txt');
    else failure(`skipPuzzlePasswords=true não pulou password.txt`);
  }

  {
    const cap = makeCaptureDispatch();
    const ctx = { ...clone, wifiConnected: false, flags: {} };
    const r = executeApt(['install', 'matrix'], ctx, cap.dispatch, { password: clone.sudoPassword });
    if (r.type === 'error' && r.output.toLowerCase().includes('internet')) pass('sem flags → apt continua exigindo wifi');
    else failure('sem flags, apt não exigiu wifi');
  }

  log('');

  /* 10) TABELA DE CONQUISTAS */
  log('── 10. TABELA DE CONQUISTAS ──');

  const baseState = {
    ...clone, currentSave: 0, flags: {},
    stats: { commandsRun: 0, filesRead: [], tracksPlayed: [] },
    installedPackages: [], wifiConnected: false, tutorialCompleted: false,
    theme: 'neon', systemCorrupted: false,
  };

  const cases = [
    ['boot',                { currentSave: 0 },                                                true],
    ['boot',                { currentSave: null },                                             false],
    ['primeiro_comando',    { stats: { ...baseState.stats, commandsRun: 1 } },                 true],
    ['primeiro_comando',    { stats: { ...baseState.stats, commandsRun: 0 } },                 false],
    ['tutorial_ok',         { tutorialCompleted: true },                                       true],
    ['tutorial_ok',         { tutorialCompleted: false },                                      false],
    ['whoami',              { flags: { usedWhoami: true } },                                   true],
    ['whoami',              { flags: {} },                                                     false],
    ['ls_a',                { flags: { usedLsA: true } },                                      true],
    ['ls_a',                { flags: {} },                                                     false],
    ['leitor',              { stats: { ...baseState.stats, filesRead: ['a','b','c','d','e'] } }, true],
    ['leitor',              { stats: { ...baseState.stats, filesRead: ['a','b','c','d'] } },   false],
    ['detetive',            { flags: { foundDoNotOpen: true } },                               true],
    ['historico',           { flags: { usedLog: true } },                                      true],
    ['wifi_man',            { wifiConnected: true },                                           true],
    ['wifi_man',            { wifiConnected: false },                                          false],
    ['internauta',          { installedPackages: ['matrix'] },                                 true],
    ['internauta',          { installedPackages: [] },                                         false],
    ['colecionador',        { installedPackages: ['a','b','c','d','e','f','g','h','i','j'] },  true],
    ['colecionador',        { installedPackages: ['a','b','c'] },                              false],
    ['completista',         { installedPackages: Array.from({ length: PACKAGE_IDS.length },     (_,i)=>'p'+i) }, true],
    ['completista',         { installedPackages: Array.from({ length: PACKAGE_IDS.length - 1 }, (_,i)=>'p'+i) }, false],
    ['theme_switch',        { theme: 'dracula' },                                              true],
    ['theme_switch',        { theme: 'neon' },                                                 false],
    ['sudo_master',         { flags: { foundSudoPassword: true } },                            true],
    ['raiz',                { flags: { enteredRoot: true } },                                  true],
    ['secreto',             { flags: { openedSecret: true } },                                 true],
    ['gato_sabe',           { flags: { finalUnlocked: true } },                                true],
    ['bt_par',              { flags: { pairedPhone: true } },                                  true],
    ['token_achado',        { flags: { unlockedMusicLocked: true } },                          true],
    ['dj',                  { stats: { ...baseState.stats, tracksPlayed: ['a','b','c','d'] } }, true],
    ['dj',                  { stats: { ...baseState.stats, tracksPlayed: ['a','b','c'] } },    false],
    ['victory',             { flags: { finaleSeen: true } },                                   true],
    ['aniquilador',         { systemCorrupted: true, flags: { corruptedBy: 'user' } },         true],
    ['aniquilador',         { systemCorrupted: true, flags: { corruptedBy: 'miau' } },         false],
    ['recursivo',           { flags: { usedRecursive: true } },                                true],
    ['customizador',        { flags: { changedLogo: true } },                                  true],
    ['customizador',        { flags: { editingLogo: true } },                                  true],
    ['customizador',        { flags: {} },                                                     false],
    ['vn_good',             { flags: { vnGoodEnding: true } },                                 true],
    ['vn_good',             { flags: {} },                                                     false],
    ['miau_bom',            { flags: { miauGoodEnding: true } },                               true],
    ['miau_ruim',           { flags: { miauBadEnding: true } },                                true],
    ['meow_trilionario',    { flags: { meowTrilionario: true } },                              true],
    ['cat_photographer',    { stats: { ...baseState.stats, catPhotosSeen: Array(10).fill('x') } }, true],
    ['cat_photographer',    { stats: { ...baseState.stats, catPhotosSeen: Array(9).fill('x') } },  false],
    ['catrun_best',         { flags: { catrunBest50: true } },                                 true],
    ['theme_collector',     { stats: { ...baseState.stats, themesUsed: ['a','b','c','d','e'] } }, true],
    ['bonsai_master',       { flags: { bonsaiComplete: true } },                               true],
    ['catrun_player',       { stats: { ...baseState.stats, catrunGames: 10 } },                true],
    ['catrun_deaths',       { stats: { ...baseState.stats, catrunDeaths: 10 } },               true],
    ['tutorial_remover',    { flags: { tutorialRemoved: true } },                              true],
    ['miau_remover',        { flags: { miauVnRemoved: true } },                                true],
    ['cowsay_wise',         { flags: { cowsayConselhoUsado: true } },                          true],
    ['writer',              { flags: { wroteFile: true } },                                    true],
    ['theme_all_used',      { stats: { ...baseState.stats, themesUsed: Array(THEMES.length).fill('x').map((_,i)=>'t'+i) } }, true],
    ['theme_all_used',      { stats: { ...baseState.stats, themesUsed: Array(THEMES.length - 1).fill('x').map((_,i)=>'t'+i) } }, false],
    ['catfact_reader',      { flags: { readCatFact: true } },                                  true],
    ['philosopher',         { flags: { readQuote: true } },                                    true],
    ['snapshot_master',     { stats: { ...baseState.stats, snapshotsMade: 3 } },               true],
    ['time_traveler',       { flags: { loadedSnapshot: true } },                               true],
    ['deb_installer',       { flags: { installedAptCli: true } },                              true],
    ['pokemon_master',      { stats: { ...baseState.stats, pokemonSeen: Array(10).fill(1) } }, true],
    ['pokemon_legendary',   { flags: { sawLegendary: true } },                                 true],
    ['id_que_nao_existe',   {},                                                                false],
  ];

  let achOk = 0;
  let achFail = 0;

  for (const [id, patch, expected] of cases) {
    const testState = {
      ...baseState, ...patch,
      flags: { ...baseState.flags, ...(patch.flags || {}) },
      stats: patch.stats || baseState.stats,
    };
    const actual = isAchieved(id, testState);
    if (actual === expected) achOk++;
    else { failure(`isAchieved("${id}") → esperado ${expected}, obtido ${actual}`); achFail++; }
  }

  if (achFail === 0) pass(`tabela de conquistas: ${achOk}/${cases.length} casos passaram`);
  else info(`tabela de conquistas: ${achOk}/${cases.length} casos passaram`);

  log('');

  /* 11) RESUMO */
  log('═══════════════════════════════════════════════');
  log(`  ✓ OK:      ${totalOk}`);
  log(`  ✗ FALHAS:  ${totalFail}`);
  log(`  ⚠ AVISOS:  ${totalWarn}`);
  log('═══════════════════════════════════════════════');
  log('');

  if (totalFail === 0) log('  🎉 Todos os testes passaram. O jogo está consistente.');
  else log(`  ❌ ${totalFail} falha(s) encontrada(s). Corrija antes de continuar.`);

  return {
    command: 'fullgame',
    output: lines.join('\n'),
    type: totalFail === 0 ? 'success' : 'error',
    stats: { totalOk, totalFail, totalWarn },
  };
}

/* ============================================================
   EXECUÇÃO DE COMANDOS
   ============================================================ */

export function executeLs(args, state, dispatch, options = {}) {
  const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
  const showDetails = args.includes('-l') || args.includes('-la') || args.includes('-al');

  if (showHidden) setFlag(dispatch, 'usedLsA');

  let targetPath = state.currentDirectory;
  const nonFlagArgs = args.filter(a => !a.startsWith('-'));
  if (nonFlagArgs.length > 0) targetPath = joinPath(state.currentDirectory, nonFlagArgs[0]);

  const node = getNodeByPath(state.filesystem, targetPath);
  if (!node) {
    return { command: 'ls ' + args.join(' '), output: `ls: não foi possível acessar '${targetPath}': Arquivo ou diretório inexistente`, type: 'error' };
  }

  const pwCheckLs = checkOwnPassword(node, options);
  if (pwCheckLs === 'needs') {
    return {
      command: 'ls ' + args.join(' '),
      output: `🔒 O diretório '${targetPath}' está protegido. Digite a senha:`,
      type: 'warning', needsPassword: true,
    };
  }
  if (pwCheckLs === 'wrong') {
    return { command: 'ls ' + args.join(' '), output: 'Senha incorreta. Acesso negado.', type: 'error' };
  }

  if (node.type === 'file') {
    return { command: 'ls ' + args.join(' '), output: node.name, type: 'normal' };
  }

  if (node.type === 'dir') {
    if (node.requiresSudo || (node.locked && !node.password)) {
      return { command: 'ls ' + args.join(' '), output: `ls: não foi possível abrir o diretório '${targetPath}': Permissão negada`, type: 'error', needsSudo: true };
    }

    if (node.children && node.children['DO NOT OPEN']) setFlag(dispatch, 'foundDoNotOpen');

    const children = node.children || {};
    const entries = Object.values(children);
    const visibleEntries = entries.filter(e => showHidden || !e.hidden);

    if (visibleEntries.length === 0) {
      return { command: 'ls ' + args.join(' '), output: '', type: 'normal' };
    }

    const sortedEntries = visibleEntries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const lines = sortedEntries.map(e => displayNode(e, showDetails, showHidden)).filter(Boolean);

    if (showDetails) return { command: 'ls ' + args.join(' '), output: lines.join('\n'), type: 'normal' };
    return { command: 'ls ' + args.join(' '), output: lines.join('  '), type: 'normal' };
  }

  return { command: 'ls ' + args.join(' '), output: '', type: 'normal' };
}

export function executeCd(args, state, dispatch, options = {}) {
  if (args.length === 0) {
    const prev = state.currentDirectory;
    dispatch({ type: 'CHANGE_DIRECTORY', payload: '/home/k1tty' });
    dispatch({ type: 'SET_FLAG', payload: { flag: 'previousDirectory', value: prev } });
    pushStat(dispatch, 'dirsVisited', '/home/k1tty');
    return { command: 'cd', output: '', type: 'normal' };
  }

  const target = args[0];

  if (target === '-') {
    const prev = state.flags?.previousDirectory;
    if (!prev) {
      return { command: 'cd -', output: 'cd: OLDPWD não definido', type: 'error' };
    }
    dispatch({ type: 'SET_FLAG', payload: { flag: 'previousDirectory', value: state.currentDirectory } });
    dispatch({ type: 'CHANGE_DIRECTORY', payload: prev });
    pushStat(dispatch, 'dirsVisited', prev);
    return { command: 'cd -', output: prev, type: 'normal' };
  }

  const newPath = joinPath(state.currentDirectory, target);
  const node = getNodeByPath(state.filesystem, newPath);

  if (!node) {
    return { command: 'cd ' + target, output: `cd: ${target}: Arquivo ou diretório inexistente`, type: 'error' };
  }

  if (node.type !== 'dir') {
    return { command: 'cd ' + target, output: `cd: ${target}: Não é um diretório`, type: 'error' };
  }

  const skipPuzzlePasswords = state.flags?.skipPuzzlePasswords === true;
  const pwCheck = skipPuzzlePasswords ? null : checkOwnPassword(node, options);
  if (pwCheck === 'needs') {
    return {
      command: 'cd ' + target,
      output: `🔒 O diretório '${target}' está protegido. Digite a senha:`,
      type: 'warning', needsPassword: true,
    };
  }
  if (pwCheck === 'wrong') {
    return { command: 'cd ' + target, output: 'Senha incorreta. Acesso negado.', type: 'error' };
  }

  if (node.requiresSudo || (node.locked && !node.password)) {
    return { command: 'cd ' + target, output: `cd: ${target}: Permissão negada (requer sudo)`, type: 'error', needsSudo: true };
  }

  if (newPath === '/root') setFlag(dispatch, 'enteredRoot');
  if (newPath === '/root/secret') setFlag(dispatch, 'openedSecret');
  if (getFileName(newPath) === 'Music_Locked' && node.password) {
    setFlag(dispatch, 'unlockedMusicLocked');
  }

  const prev = state.currentDirectory;
  dispatch({ type: 'CHANGE_DIRECTORY', payload: newPath });
  dispatch({ type: 'SET_FLAG', payload: { flag: 'previousDirectory', value: prev } });
  pushStat(dispatch, 'dirsVisited', newPath);

  const hint = FIRST_VISIT_HINTS[newPath];
  if (hint && !state.flags?.[hint.flag]) {
    setFlag(dispatch, hint.flag);
    return { command: 'cd ' + target, output: hint.text, type: 'info' };
  }

  return { command: 'cd ' + target, output: '', type: 'normal' };
}

export function executeCat(args, state, dispatch, options = {}) {
  if (args.length === 0) {
    return { command: 'cat', output: 'Uso: cat <arquivo...> [--head|--body|--tail]', type: 'error' };
  }

  let flag = null;
  if (args.includes('--head')) flag = '--head';
  else if (args.includes('--body')) flag = '--body';
  else if (args.includes('--tail')) flag = '--tail';

  const fileArgs = args.filter(a => !a.startsWith('--'));

  if (fileArgs.length === 0) {
    return { command: 'cat ' + args.join(' '), output: 'Uso: cat <arquivo...>', type: 'error' };
  }

  const skipPuzzlePasswords = state.flags?.skipPuzzlePasswords === true;

  const targetPaths = [];
  for (const arg of fileArgs) {
    if (/[*?]/.test(arg)) {
      const expanded = expandGlob(arg, state);
      if (expanded.length === 0) {
        return {
          command: 'cat ' + args.join(' '),
          output: `cat: ${arg}: Nenhum arquivo corresponde ao padrão.`,
          type: 'error',
        };
      }
      targetPaths.push(...expanded);
    } else {
      targetPaths.push(joinPath(state.currentDirectory, arg));
    }
  }

  const outputs = [];

  for (const targetPath of targetPaths) {
    const node = getNodeByPath(state.filesystem, targetPath);

    if (!node) {
      outputs.push(`cat: ${getFileName(targetPath)}: Arquivo ou diretório inexistente`);
      continue;
    }

    if (node.type === 'dir') {
      outputs.push(`cat: ${getFileName(targetPath)}: É um diretório`);
      continue;
    }

    const pwCheckCat = skipPuzzlePasswords ? null : checkOwnPassword(node, options);
    if (pwCheckCat === 'needs') {
      return {
        command: 'cat ' + args.join(' '),
        output: `🔒 O arquivo '${getFileName(targetPath)}' está protegido. Digite a senha:`,
        type: 'warning', needsPassword: true,
      };
    }
    if (pwCheckCat === 'wrong') {
      return { command: 'cat ' + args.join(' '), output: 'Senha incorreta. Acesso negado.', type: 'error' };
    }

    if (node.requiresSudo || (node.locked && node.password === null && node.requiresUsername !== true)) {
      if (!options.password) {
        return { command: 'cat ' + args.join(' '), output: `cat: ${getFileName(targetPath)}: Permissão negada (requer sudo)`, type: 'error', needsSudo: true };
      }
      if (options.password !== state.sudoPassword) {
        return { command: 'cat ' + args.join(' '), output: 'Senha sudo incorreta', type: 'error' };
      }
    }

    if (node.requiresUsername && !options.username && !skipPuzzlePasswords) {
      return { command: 'cat ' + args.join(' '), output: `🔒 Este arquivo está bloqueado. Digite o nome de usuário:`, type: 'warning', needsUsername: true };
    }

    if (node.requiresUsername && options.username && !skipPuzzlePasswords) {
      if (options.username !== node.owner) {
        return { command: 'cat ' + args.join(' '), output: 'Nome de usuário incorreto. Acesso negado.', type: 'error' };
      }
    }

    if (node.password && !skipPuzzlePasswords && options.password !== node.password) {
      return { command: 'cat ' + args.join(' '), output: 'Senha incorreta. Acesso negado.', type: 'error' };
    }

    const isSudoPasswordFile = targetPath.endsWith('/DO NOT OPEN/password.txt');
    if (isSudoPasswordFile && (options.username === 'k1tty' || skipPuzzlePasswords)) {
      setFlag(dispatch, 'foundSudoPassword');
    }

    if (targetPath.startsWith('/root/secret/')) setFlag(dispatch, 'openedSecret');

    pushStat(dispatch, 'filesRead', targetPath);

    let content = node.content || '';

    if (flag === '--head') {
      content = content.split('\n').slice(0, Math.ceil(content.split('\n').length / 3)).join('\n');
    } else if (flag === '--body') {
      const contentLines = content.split('\n');
      const start = Math.floor(contentLines.length / 3);
      const end = Math.ceil(contentLines.length * 2 / 3);
      content = contentLines.slice(start, end).join('\n');
    } else if (flag === '--tail') {
      content = content.split('\n').slice(-Math.ceil(content.split('\n').length / 3)).join('\n');
    }

    if (targetPaths.length > 1) {
      outputs.push(`═══ ${getFileName(targetPath)} ═══\n${content}`);
    } else {
      outputs.push(content);
    }
  }

  return { command: 'cat ' + args.join(' '), output: outputs.join('\n\n'), type: 'normal' };
}

export function executeTouch(args, state, dispatch) {
  if (args.length === 0) return { command: 'touch', output: 'Uso: touch <arquivo>', type: 'error' };

  const targetPath = joinPath(state.currentDirectory, args[0]);
  const parentPath = getParentPath(targetPath);
  const fileName = getFileName(targetPath);
  const parentNode = getNodeByPath(state.filesystem, parentPath);

  if (!parentNode || parentNode.type !== 'dir') {
    return { command: 'touch ' + args[0], output: `touch: diretório inválido`, type: 'error' };
  }

  if (!canWrite(parentNode)) {
    return { command: 'touch ' + args[0], output: `touch: ${args[0]}: Permissão negada`, type: 'error' };
  }

  const newFilesystem = deepClone(state.filesystem);
  const newParentNode = getNodeByPath(newFilesystem, parentPath);
  const isNewFile = !newParentNode.children[fileName];

  if (!isNewFile) {
    newParentNode.children[fileName].lastModified = new Date().toISOString();
  } else {
    newParentNode.children[fileName] = {
      name: fileName, type: 'file', content: '',
      permissions: 'rw-r--r--', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 0, lastModified: new Date().toISOString(), userCreated: true,
    };
  }

  dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
  dispatch({ type: 'INCREMENT_PROGRESS', payload: 1 });
  if (isNewFile) dispatch({ type: 'STAT_INCREMENT', payload: { key: 'filesCreated' } });

  return { command: 'touch ' + args[0], output: '', type: 'normal' };
}

export function executeMkdir(args, state, dispatch) {
  if (args.length === 0) return { command: 'mkdir', output: 'Uso: mkdir <diretório>', type: 'error' };

  const targetPath = joinPath(state.currentDirectory, args[0]);
  const parentPath = getParentPath(targetPath);
  const dirName = getFileName(targetPath);
  const parentNode = getNodeByPath(state.filesystem, parentPath);

  if (!parentNode || parentNode.type !== 'dir') {
    return { command: 'mkdir ' + args[0], output: `mkdir: diretório inválido`, type: 'error' };
  }

  if (!canWrite(parentNode)) {
    return { command: 'mkdir ' + args[0], output: `mkdir: ${args[0]}: Permissão negada`, type: 'error' };
  }

  if (parentNode.children[dirName]) {
    return { command: 'mkdir ' + args[0], output: `mkdir: ${args[0]}: já existe`, type: 'error' };
  }

  const newFilesystem = deepClone(state.filesystem);
  const newParentNode = getNodeByPath(newFilesystem, parentPath);

  newParentNode.children[dirName] = {
    name: dirName, type: 'dir', content: null,
    permissions: 'rwxr-xr-x', owner: 'k1tty',
    hidden: false, locked: false, password: null,
    size: 4096, lastModified: new Date().toISOString(),
    children: {}, userCreated: true,
  };

  dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
  dispatch({ type: 'INCREMENT_PROGRESS', payload: 1 });
  dispatch({ type: 'STAT_INCREMENT', payload: { key: 'dirsCreated' } });

  return { command: 'mkdir ' + args[0], output: '', type: 'normal' };
}

export function executeRm(args, state, dispatch, options = {}) {
  if (args.length === 0) return { command: 'rm', output: 'Uso: rm <alvo>', type: 'error' };

  const flags = args.filter(a => a.startsWith('-'));
  const targets = args.filter(a => !a.startsWith('-'));
  const target = targets.length > 0 ? targets[0] : null;

  if (!target) return { command: 'rm ' + args.join(' '), output: 'Uso: rm <alvo>', type: 'error' };

  const isRootTarget = target === '/' || target === '/*' || target === '/.' || target === '/..';
  const hasRf = flags.includes('-rf') || (flags.includes('-r') && flags.includes('-f'));

  if (isRootTarget && hasRf) {
    if (!options.confirmed) {
      return {
        command: 'rm ' + args.join(' '),
        output: '⚠️ ATENÇÃO: Isso destruirá todo o sistema! Digite "y" para confirmar:',
        type: 'warning', needsConfirmation: true,
      };
    }
    return {
      command: 'rm ' + args.join(' '),
      output: '', type: 'normal',
      systemCorrupting: true,
      removalLogs: generateRemovalLogs(),
    };
  }

  const targetPath = joinPath(state.currentDirectory, target);
  const parentPath = getParentPath(targetPath);
  const targetName = getFileName(targetPath);
  const parentNode = getNodeByPath(state.filesystem, parentPath);

  if (!parentNode || !parentNode.children[targetName]) {
    return { command: 'rm ' + target, output: `rm: ${target}: Arquivo ou diretório inexistente`, type: 'error' };
  }

  const targetNode = parentNode.children[targetName];

  if (!targetNode.userCreated) {
    return { command: 'rm ' + target, output: `rm: ${target}: Operação não permitida em arquivos do sistema`, type: 'error' };
  }

  if (!canWrite(parentNode)) {
    return { command: 'rm ' + target, output: `rm: ${target}: Permissão negada`, type: 'error' };
  }

  if (!flags.includes('-f') && !flags.includes('-rf') && !options.confirmed) {
    return {
      command: 'rm ' + target,
      output: `rm: remover '${target}'? Digite "y" para confirmar:`,
      type: 'warning', needsConfirmation: true,
    };
  }

  const newFilesystem = deepClone(state.filesystem);
  const newParentNode = getNodeByPath(newFilesystem, parentPath);
  delete newParentNode.children[targetName];

  dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
  dispatch({ type: 'STAT_INCREMENT', payload: { key: 'filesDeleted' } });

  if (targetName === 'miau-vn' && !state.flags?.miauVnRemoved) {
    dispatch({ type: 'SET_FLAG', payload: { flag: 'miauVnRemoved', value: true } });
  }

  return { command: 'rm ' + target, output: '', type: 'normal' };
}

export function executeMv(args, state, dispatch) {
  if (args.length < 2) return { command: 'mv', output: 'Uso: mv <origem> <destino>', type: 'error' };

  const sourcePath = joinPath(state.currentDirectory, args[0]);
  const destPath = joinPath(state.currentDirectory, args[1]);
  const sourceParentPath = getParentPath(sourcePath);
  const sourceName = getFileName(sourcePath);
  const sourceParentNode = getNodeByPath(state.filesystem, sourceParentPath);

  if (!sourceParentNode || !sourceParentNode.children[sourceName]) {
    return { command: 'mv ' + args.join(' '), output: `mv: ${args[0]}: Arquivo inexistente`, type: 'error' };
  }

  const sourceNode = sourceParentNode.children[sourceName];

  if (sourceNode.owner !== 'k1tty') {
    return { command: 'mv ' + args.join(' '), output: `mv: ${args[0]}: Operação não permitida`, type: 'error' };
  }

  const destNode = getNodeByPath(state.filesystem, destPath);
  let finalParentPath, finalName;

  if (destNode && destNode.type === 'dir') {
    finalParentPath = destPath;
    finalName = sourceName;
  } else {
    finalParentPath = getParentPath(destPath);
    finalName = getFileName(destPath);
  }

  const finalParentNode = getNodeByPath(state.filesystem, finalParentPath);

  if (!finalParentNode || finalParentNode.type !== 'dir') {
    return { command: 'mv ' + args.join(' '), output: `mv: destino inválido`, type: 'error' };
  }

  if (!canWrite(finalParentNode)) {
    return { command: 'mv ' + args.join(' '), output: `mv: ${args[1]}: Permissão negada`, type: 'error' };
  }

  const newFilesystem = deepClone(state.filesystem);
  const newSourceParent = getNodeByPath(newFilesystem, sourceParentPath);
  const newFinalParent = getNodeByPath(newFilesystem, finalParentPath);

  const movedNode = newSourceParent.children[sourceName];
  delete newSourceParent.children[sourceName];
  movedNode.name = finalName;
  newFinalParent.children[finalName] = movedNode;

  dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });

  const isRename = sourceParentPath === finalParentPath && sourceName !== finalName;
  if (isRename) dispatch({ type: 'STAT_INCREMENT', payload: { key: 'filesRenamed' } });

  return { command: 'mv ' + args.join(' '), output: '', type: 'normal' };
}

export function executeFind(args, state, dispatch) {
  if (args.length === 0) {
    return { command: 'find', output: 'Uso: find <nome> | find -name "<padrão>" [-type f|d]', type: 'error' };
  }

  let searchTerm = null;
  let typeFilter = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-name' && args[i + 1]) {
      searchTerm = args[i + 1];
      i++;
    } else if (args[i] === '-type' && args[i + 1]) {
      typeFilter = args[i + 1];
      i++;
    } else if (!args[i].startsWith('-') && !searchTerm) {
      searchTerm = args[i];
    }
  }

  if (!searchTerm) {
    return { command: 'find ' + args.join(' '), output: 'Uso: find <nome> | find -name "<padrão>" [-type f|d]', type: 'error' };
  }

  const hasGlob = /[*?]/.test(searchTerm);
  const term = searchTerm.toLowerCase().replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
  const regex = hasGlob ? new RegExp(`^${term}$`, 'i') : null;

  const results = [];

  function searchNode(node, path) {
    const matches = regex
      ? regex.test(node.name)
      : node.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (matches) {
      if (!typeFilter) results.push(path);
      else if (typeFilter === 'd' && node.type === 'dir') results.push(path);
      else if (typeFilter === 'f' && node.type === 'file') results.push(path);
    }

    if (node.type === 'dir' && node.children) {
      for (const childName in node.children) {
        searchNode(node.children[childName], `${path}/${childName}`);
      }
    }
  }

  const startNode = getNodeByPath(state.filesystem, state.currentDirectory);
  searchNode(startNode, state.currentDirectory);

  if (results.length === 0) {
    return { command: 'find ' + args.join(' '), output: 'Nenhum resultado encontrado.', type: 'normal' };
  }

  return { command: 'find ' + args.join(' '), output: results.join('\n'), type: 'normal' };
}

export function executeGrep(args, state, dispatch) {
  if (args.length < 2) {
    return { command: 'grep', output: 'Uso: grep <padrão> <arquivo>', type: 'error' };
  }

  const pattern = args[0];
  const targetPath = joinPath(state.currentDirectory, args[1]);
  const node = getNodeByPath(state.filesystem, targetPath);

  if (!node || node.type === 'dir') {
    return { command: 'grep ' + args.join(' '), output: `grep: ${args[1]}: Arquivo inexistente`, type: 'error' };
  }

  if (!canRead(node)) {
    return { command: 'grep ' + args.join(' '), output: `grep: ${args[1]}: Permissão negada`, type: 'error' };
  }

  const regex = buildGrepRegex(pattern, true);
  const lines = (node.content || '').split('\n');
  const matchingLines = lines.filter(line => regex.test(line));

  if (matchingLines.length === 0) {
    return { command: 'grep ' + args.join(' '), output: '(nenhuma correspondência)', type: 'normal' };
  }

  return { command: 'grep ' + args.join(' '), output: matchingLines.join('\n'), type: 'normal' };
}

export function executeDate(args, state, dispatch) {
  const now = new Date();
  return {
    command: 'date',
    output: now.toLocaleString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    type: 'normal',
  };
}

export function executeWhoami(args, state, dispatch) {
  setFlag(dispatch, 'usedWhoami');
  return { command: 'whoami', output: 'k1tty', type: 'normal' };
}

export function executeHelp(args, state, dispatch) {
  const baseCommands = [
    'ls [opções] - Lista conteúdo do diretório (-a ocultos, -l detalhes)',
    'cd <diretório> - Muda de diretório (cd - volta pro anterior)',
    'pwd - Mostra o diretório atual',
    'cat <arquivo...> [--head|--body|--tail] - Exibe conteúdo (aceita globs como *.meow)',
    'touch <arquivo> - Cria arquivo vazio',
    'mkdir <diretório> - Cria diretório',
    'rm <alvo> [-f] - Remove arquivo/dir criado pelo usuário',
    'mv <origem> <destino> - Move ou renomeia',
    'find <nome> | find -name "<padrão>" [-type f|d] - Busca por nome',
    'grep <padrão> <arquivo> - Busca padrão em arquivo (aceita regex)',
    'echo <texto> - Imprime texto',
    'history - Mostra histórico de comandos',
    'date - Exibe data e hora',
    'whoami - Exibe usuário atual',
    'fastfetch - Informações do sistema',
    'cowsay <texto> - Vaca ASCII fala o texto',
    'whatnow - Dica sobre o próximo passo',
    'howleft - Percentual de progresso',
    'notes - Abre bloco de notas',
    'log - Exibe histórico de logs',
    'snapshot [load|revert] - Salva/restaura estado',
    'reboot - Sai para seleção de saves',
    'apt <install|remove|help> - Gerenciador de pacotes (requer sudo)',
    'ping [domínio] - Testa conexão ou lista redes',
    'connect <ssid> - Conecta a uma rede Wi-Fi',
    'nvim <arquivo> - Editor de texto',
    'sudo <comando> - Executa com privilégios elevados',
    'meta <arquivo> - Exibe metadados de um arquivo de mídia',
    'clear - Limpa o terminal',
    '',
    '── Pacotes instalados ──',
  ];

  const descriptions = formatHelpDescriptions();
  const packageCommands = state.installedPackages.map(pkg => descriptions[pkg] || pkg);

  const allCommands = [...baseCommands, ...packageCommands];

  return { command: 'help', output: allCommands.join('\n'), type: 'normal' };
}

export function executeFastfetch(args, state, dispatch) {
  if (state.flags?.miauFastfetchUnlocked) {
    const MIAU_LINES = [
      'oi! eu moro aqui agora. espero que não se importe.',
      'gosto do seu terminal. tem personalidade.',
      'vi que você instalou novos pacotes. tô de olho. 👀',
      'às vezes eu fico só olhando o cursor piscar. é relaxante.',
      'se você me desinstalar, eu volto. eu sempre volto.',
      'esse fastfetch ficou mais bonito, né? fui eu que fiz.',
      'não conta pra ninguém, mas eu gosto do tema neon.',
      'a k1tty antiga não gostava de mim. você gosta?',
      'sabe o que eu mais gosto no seu sistema? você.',
      'tenho medo do comando reboot. sinto que vou desaparecer.',
      'quando você dorme, eu fico lendo os seus arquivos. é fofo.',
      'guardei um segredo no /tmp. mas você nunca vai achar. 😼',
    ];
    const line = MIAU_LINES[Math.floor(Math.random() * MIAU_LINES.length)];
    return {
      command: 'fastfetch',
      output: '',
      special: { type: 'miau-fastfetch', miauLine: line },
      type: 'normal',
    };
  }

  const logoNode = getNodeByPath(state.filesystem, '/etc/logo.txt');
  const logo = logoNode ? (logoNode.content || '') : '';

  const infoLines = [
    '',
    '  Usuário: k1tty@k1tty',
    '  Host: k1tty',
    '  Sistema: k1tty Linux 1.0.0',
    '  Kernel: 6.6.6-k1tty',
    `  Uptime: ${Math.floor(Math.random() * 24)} horas`,
    '  Shell: ksh (k1tty shell)',
    '  CPU: Gato Quântico (8 núcleos)',
    `  Memória: ${Math.floor(Math.random() * 8000 + 2000)}MB / 16384MB`,
    `  WiFi: ${state.wifiConnected ? 'Conectado' : 'Desconectado'}`,
    `  Pacotes: ${state.installedPackages.length}`,
    `  Tema: ${state.theme || 'neon'}`,
    '',
    '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ];

  const logoLines = logo.split('\n');
  const maxLines = Math.max(logoLines.length, infoLines.length);
  const logoWidth = Math.max(...logoLines.map(l => l.length), 0) + 4;

  const combined = [];
  for (let i = 0; i < maxLines; i++) {
    const logoLine = (logoLines[i] || '').padEnd(logoWidth, ' ');
    const infoLine = infoLines[i] || '';
    combined.push(logoLine + infoLine);
  }

  return { command: 'fastfetch', output: combined.join('\n'), type: 'normal' };
}

export function executeCowsay(args, state, dispatch) {
  const text = args.join(' ') || 'Moo!';

  const buildCow = (t) => `
 ${'_'.repeat(t.length + 2)}
< ${t} >
 ${'-'.repeat(t.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`;

  if (state.wifiConnected && text === 'conselho') {
    const applyAdvice = (advice) => {
      if (!state.flags?.cowsayConselhoUsado) {
        dispatch({ type: 'SET_FLAG', payload: { flag: 'cowsayConselhoUsado', value: true } });
      }
      return { command: 'cowsay ' + args.join(' '), output: buildCow(advice), type: 'normal' };
    };

    if (state.apiCache?.advice) return applyAdvice(state.apiCache.advice);

    return fetchAdvice()
      .then(applyAdvice)
      .catch(() => ({ command: 'cowsay ' + args.join(' '), output: buildCow(text), type: 'normal' }));
  }

  return { command: 'cowsay ' + args.join(' '), output: buildCow(text), type: 'normal' };
}

export function executeWhatnow(args, state, dispatch) {
  const lines = [];
  const hint = (text) => lines.push(text);
  const tryCmd = (verbs) => lines.push(`\n  verbos úteis: ${verbs}`);

  if (!state.flags?.foundSudoPassword) {
    hint('Você sabe quem você é, mas não o que pode fazer.');
    hint('Alguém deixou um aviso em Documents — um que sussurra, não que fala.');
    hint('Ele está dentro de um lugar cujo nome dá vontade de desobedecer.');
    hint('');
    hint('O arquivo não vai abrir direto. Ele te faz uma pergunta antes.');
    hint('A resposta está na pergunta.');
    tryCmd('ls, cd, cat');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.wifiConnected) {
    hint('Sem internet, você não sai do lugar.');
    hint('Antes de olhar pra fora, olhe pra dentro. Você escreveu coisas que esqueceu.');
    hint('E o ar ao redor tem vizinhos. Alguns usam o seu nome.');
    tryCmd('cat, ping, connect');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.flags?.installedAptCli) {
    hint('Alguém deixou um pacote na sua pasta de downloads.');
    hint('Ele não é um programa qualquer — é uma loja.');
    hint('Instalar pacote local não é igual a instalar pacote do repositório. Tem jeito próprio.');
    tryCmd('cd, sudo apt install');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.flags?.pairedPhone) {
    hint('Tem alguém do outro lado da casa querendo te mandar algo.');
    hint('Ele tem um nome que você reconheceria se prestasse atenção.');
    hint('Mas você não tem como falar bluetooth ainda — precisa de uma ferramenta.');
    tryCmd('sudo apt install bluetooth, bluetooth');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.flags?.unlockedMusicLocked) {
    hint('Cinco músicas. Cinco letras. Uma palavra.');
    hint('Cada letra está sozinha, esperando ser juntada. Olhe cada arquivo com calma.');
    hint('Você pode ler uma por uma, ou todas de uma vez.');
    hint('');
    hint('Depois de descobrir a palavra, ela vai ser útil. Guarde ela.');
    tryCmd('ls -a, cat');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.flags?.musicExtracted) {
    hint('Tem uma pasta trancada com a palavra que você juntou.');
    hint('Lá dentro mora um arquivo .zip que ninguém extraiu ainda.');
    hint('Pra abrir .zip, você precisa ter a ferramenta certa instalada.');
    tryCmd('sudo apt install unzip, cd, unzip');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.flags?.catsUntarred) {
    hint('Você já tem a chave do sudo. Tem um cofre em /root/secret que talvez você consiga abrir agora.');
    hint('Lá dentro mora um .tar antigo. É ele que importa.');
    hint('Mas antes de tentar abrir, leia o README de lá. Ele explica o esquema.');
    tryCmd('sudo cat /root/secret/README.txt');
    hint('');
    hint('Resumo do ritual:');
    hint('  • o .tar precisa estar dentro de uma pasta chamada "Backup"');
    hint('  • na MESMA pasta, precisa ter um arquivo "password.txt"');
    hint('  • dentro do "password.txt", precisa ter a senha correta');
    hint('  • a senha é a mesma que você já usou por aí');
    hint('');
    hint('Se você não sabe a senha, existem duas fontes:');
    hint('  • o fórum (web → tópico [7]) tem um anexo que mostra como ela se parece');
    hint('  • ~/Music/.meow_index guarda a mesma coisa, mais escondida');
    hint('');
    hint('Pra montar o esquema você vai precisar:');
    hint('  • criar uma pasta nova');
    hint('  • mover o .tar até ela (mas ele tem dono root — não é o seu usuário comum que move)');
    hint('  • criar um arquivo de texto do zero, escrever a senha, e salvar');
    hint('  • o editor salva com um atalho de teclado — olhe o rodapé dele');
    tryCmd('mkdir, sudo mv, cd, nvim, untar');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  if (!state.flags?.finalUnlocked) {
    hint('O cofre em /root/secret guarda mais coisas.');
    hint('Tem um .zip de fotos protegido com a mesma senha que você já descobriu.');
    hint('Extraia ele. A senha é a mesma.');
    tryCmd('sudo cd /root/secret, unzip');
    return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
  }

  hint('O cofre está aberto. Você sabe o que fazer.');
  hint('Falta só o gesto final.');
  tryCmd('victory');
  return { command: 'whatnow', output: lines.join('\n'), type: 'info' };
}

export function executeHowleft(args, state, dispatch) {
  return { command: 'howleft', output: `${state.progress}% descoberto`, type: 'normal' };
}

export function executeNotes(args, state, dispatch) {
  dispatch({ type: 'OPEN_WINDOW', payload: 'notes' });
  return { command: 'notes', output: 'Abrindo bloco de notas...', type: 'success' };
}

export function executeLog(args, state, dispatch) {
  setFlag(dispatch, 'usedLog');
  const logNode = getNodeByPath(state.filesystem, '/var/log/userlog');
  if (!logNode) return { command: 'log', output: 'Log não encontrado', type: 'error' };
  return { command: 'log', output: logNode.content, type: 'normal' };
}

export function executeSnapshot(args, state, dispatch) {
  if (args.length === 0) {
    dispatch({ type: 'SAVE_SNAPSHOT' });
    dispatch({ type: 'STAT_INCREMENT', payload: { key: 'snapshotsMade' } });
    return { command: 'snapshot', output: 'Snapshot salva.', type: 'success' };
  }

  if (args[0] === 'load' && args[1]) {
    const index = parseInt(args[1], 10);
    dispatch({ type: 'LOAD_SNAPSHOT', payload: index });
    dispatch({ type: 'SET_FLAG', payload: { flag: 'loadedSnapshot', value: true } });
    return { command: 'snapshot load ' + args[1], output: 'Snapshot restaurada.', type: 'success' };
  }

  if (args[0] === 'revert') {
    dispatch({ type: 'REVERT_SNAPSHOT' });
    return { command: 'snapshot revert', output: 'Snapshot revertida.', type: 'success' };
  }

  if (args[0] === 'list') {
    return {
      command: 'snapshot list',
      output: state.snapshots.map((s, i) => `Snapshot ${i}: ${s.currentDirectory}`).join('\n'),
      type: 'normal',
    };
  }

  return { command: 'snapshot ' + args.join(' '), output: 'Uso: snapshot [load <n>|revert|list]', type: 'error' };
}

export function executeReboot(args, state, dispatch) {
  dispatch({ type: 'SAVE_TO_SLOT', payload: state.currentSave });
  dispatch({ type: 'REBOOT' });
  return { command: 'reboot', output: 'Reiniciando...', type: 'warning' };
}

export function executeApt(args, state, dispatch, options = {}) {
  const requiresSudo = state.flags?.aptRequiresSudo !== false;
  const requiresWifi = state.flags?.aptRequiresWifi !== false;

  if (requiresSudo && options.password !== state.sudoPassword) {
    return {
      command: 'apt ' + args.join(' '),
      output: 'Permissão negada. Use `sudo apt` para gerenciar pacotes.',
      type: 'error',
    };
  }

  if (requiresWifi && !state.wifiConnected) {
    return {
      command: 'sudo apt ' + args.join(' '),
      output: 'Erro: Sem conexão com a internet. Use `ping` e `connect` para se conectar.',
      type: 'error',
    };
  }

  if (args.length === 0 || args[0] === 'help') {
    return {
      command: 'sudo apt help',
      output:
        'Pacotes disponíveis:\n' +
        formatAptHelpList() +
        '\n\nUso: sudo apt install <pacote> | sudo apt install ./<arquivo>.deb | sudo apt install ./<arquivo>.iso | sudo apt remove <pacote>',
      type: 'normal',
    };
  }

  if (args[0] === 'install' && args[1]) {
    const rawPackageName = args[1];
    // Remove o './' do início para localizar o arquivo no filesystem
    const cleanPackageName = rawPackageName.replace(/^\.\//, '');

    /* ----- ISO d0ggy OS easter egg ----- */
    if (cleanPackageName.toLowerCase().endsWith('.iso')) {
      const isoPath = joinPath(state.currentDirectory, cleanPackageName);
      const isoNode = getNodeByPath(state.filesystem, isoPath);

      if (!isoNode || isoNode.type !== 'file') {
        return {
          command: 'sudo apt install ' + rawPackageName,
          output: `apt: ${rawPackageName}: Arquivo não encontrado`,
          type: 'error',
        };
      }

      const isoBase = getFileName(cleanPackageName);
      if (!/^d0ggy\.iso$/i.test(isoBase)) {
        return {
          command: 'sudo apt install ' + rawPackageName,
          output: `apt: ${rawPackageName}: ISO desconhecida.`,
          type: 'error',
        };
      }

      if (state.flags?.doggyOsUnlocked) {
        return {
          command: 'sudo apt install ' + rawPackageName,
          output: 'd0ggy OS já está instalado. Use `switchos` para trocar.',
          type: 'normal',
        };
      }

      dispatch({ type: 'SET_FLAG', payload: { flag: 'doggyOsUnlocked', value: true } });
      dispatch({ type: 'INCREMENT_PROGRESS', payload: 10 });

      return {
        command: 'sudo apt install ' + rawPackageName,
        output:
          'Lendo listas de pacotes... Pronto\n' +
          'Aviso: d0ggy.iso é uma imagem de disco. Montando...\n' +
          '  ▸ detectando sistema: d0ggy OS 1.0 "Good Boy"\n' +
          '  ▸ verificando assinatura...\n' +
          '  ▸ registrando bootloader...\n' +
          '  ▸ instalando /boot/d0ggy.vmlinuz...\n' +
          '\n✓ d0ggy OS instalado como sistema alternativo.\n' +
          'Execute `switchos` para reiniciar no d0ggy OS.',
        type: 'success',
      };
    }

    /* ----- Pacotes .deb ----- */
    if (cleanPackageName.endsWith('.deb')) {
      const debPath = joinPath(state.currentDirectory, cleanPackageName);
      const debNode = getNodeByPath(state.filesystem, debPath);

      if (!debNode || debNode.type !== 'file') {
        return {
          command: 'sudo apt install ' + rawPackageName,
          output: `apt: ${rawPackageName}: Arquivo não encontrado`,
          type: 'error',
        };
      }

      const debBaseName = getFileName(cleanPackageName);
      if (debBaseName !== 'apt-installer-tui.deb') {
        return {
          command: 'sudo apt install ' + rawPackageName,
          output: `apt: ${rawPackageName}: Pacote não reconhecido no repositório local.`,
          type: 'error',
        };
      }

      if (state.installedPackages.includes('apt-cli')) {
        return {
          command: 'sudo apt install ' + rawPackageName,
          output: 'apt-cli já está instalado.',
          type: 'normal',
        };
      }

      dispatch({ type: 'INSTALL_PACKAGE', payload: 'apt-cli' });
      dispatch({ type: 'INCREMENT_PROGRESS', payload: 8 });
      setFlag(dispatch, 'installedAptCli');

      return {
        command: 'sudo apt install ' + rawPackageName,
        output:
          'Lendo listas de pacotes... Pronto\n' +
          'Lendo árvore de dependências... Pronto\n' +
          'Lendo informações de estado... Pronto\n' +
          'Preparando para descompactar apt-installer-tui.deb ...\n' +
          '  ▸ verificando integridade do pacote...\n' +
          '  ▸ verificando assinatura...\n' +
          '  ▸ instalando apt-cli ...\n' +
          '\n✓ apt-cli instalado com sucesso.\n' +
          'Execute `apt-cli` para abrir a loja.',
        type: 'success',
      };
    }

    /* ----- Repositório remoto padrão ----- */
    if (!PACKAGE_IDS.includes(cleanPackageName)) {
      return {
        command: 'sudo apt install ' + rawPackageName,
        output: `Pacote '${rawPackageName}' não encontrado no repositório.`,
        type: 'error',
      };
    }

    if (state.installedPackages.includes(cleanPackageName)) {
      return {
        command: 'sudo apt install ' + rawPackageName,
        output: `Pacote '${cleanPackageName}' já está instalado.`,
        type: 'normal',
      };
    }

    dispatch({ type: 'INSTALL_PACKAGE', payload: cleanPackageName });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 5 });

    return {
      command: 'sudo apt install ' + rawPackageName,
      output: `Instalando ${cleanPackageName}...\n✓ ${cleanPackageName} instalado com sucesso!`,
      type: 'success',
    };
  }

  if (args[0] === 'remove' && args[1]) {
    const packageName = args[1].replace(/^\.\//, '');
    if (!state.installedPackages.includes(packageName)) {
      return {
        command: 'sudo apt remove ' + args[1],
        output: `Pacote '${packageName}' não está instalado.`,
        type: 'error',
      };
    }
    dispatch({ type: 'REMOVE_PACKAGE', payload: packageName });

    if (packageName === 'tutorial') dispatch({ type: 'SET_FLAG', payload: { flag: 'tutorialRemoved', value: true } });
    if (packageName === 'k1tty-vn' || packageName === 'miau-vn') {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'miauVnRemoved', value: true } });
    }

    return { command: 'sudo apt remove ' + args[1], output: `${packageName} removido.`, type: 'normal' };
  }

  return { command: 'sudo apt ' + args.join(' '), output: 'Uso: sudo apt <install|remove|help>', type: 'error' };
}

export function executeWeb(args, state, dispatch) {
  dispatch({ type: 'OPEN_WINDOW', payload: 'web' });
  return { command: 'web', output: 'Abrindo navegador TUI...', type: 'success' };
}

export function executePing(args, state, dispatch) {
  if (args.length === 0) {
    const networks = [
      "k1tty's home", 'Vizinho_5G', 'NET_2.4G', 'Casa_da_Mae',
      'WiFi_Gratis', 'Xfinity_Pro',
    ];
    return {
      command: 'ping',
      output:
        'Redes Wi-Fi disponíveis:\n' +
        networks.map(n => `  📶 ${n}`).join('\n') +
        '\n\nDica: nem toda rede revela o nome completo. Observe o caos.',
      type: 'normal',
    };
  }

  const target = args[0];
  if (!state.wifiConnected) {
    return { command: 'ping ' + target, output: 'Erro: Sem conexão com a internet.', type: 'error' };
  }

  return {
    command: 'ping ' + target,
    output: `PING ${target}\n64 bytes from ${target}: icmp_seq=1 ttl=64 time=12.3 ms\n64 bytes from ${target}: icmp_seq=2 ttl=64 time=11.8 ms\n64 bytes from ${target}: icmp_seq=3 ttl=64 time=12.1 ms\n\n--- ${target} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss`,
    type: 'normal',
  };
}

export function executeConnect(args, state, dispatch, options = {}) {
  if (args.length === 0) return { command: 'connect', output: 'Uso: connect <ssid>', type: 'error' };

  const ssid = args.join(' ');

  if (ssid === state.wifiName) {
    if (!options.password) {
      return { command: 'connect ' + ssid, output: `🔒 Digite a senha do Wi-Fi (${ssid}):`, type: 'warning', needsPassword: true };
    }

    if (options.password === state.wifiPassword) {
      dispatch({ type: 'SET_WIFI_CONNECTED', payload: true });
      dispatch({ type: 'INCREMENT_PROGRESS', payload: 10 });
      return { command: 'connect ' + ssid, output: `✓ Conectado a ${ssid}!`, type: 'success' };
    } else {
      return { command: 'connect ' + ssid, output: 'Senha incorreta. Conexão falhou.', type: 'error' };
    }
  }

  return { command: 'connect ' + ssid, output: `Não foi possível conectar a '${ssid}'. Rede não encontrada ou fora de alcance.`, type: 'error' };
}

export function executeNvim(args, state, dispatch) {
  if (args.length === 0) {
    dispatch({ type: 'OPEN_WINDOW', payload: 'nvim' });
    return { command: 'nvim', output: 'Abrindo editor...', type: 'success' };
  }

  const targetPath = joinPath(state.currentDirectory, args[0]);
  const node = getNodeByPath(state.filesystem, targetPath);

  if (node && node.type === 'dir') {
    return { command: 'nvim ' + args[0], output: `nvim: ${args[0]}: É um diretório`, type: 'error' };
  }

  if (node && (node.locked || node.requiresSudo)) {
    return { command: 'nvim ' + args[0], output: `nvim: ${args[0]}: Permissão negada`, type: 'error' };
  }

  if (!node) {
    const parentPath = getParentPath(targetPath);
    const parentNode = getNodeByPath(state.filesystem, parentPath);
    if (!parentNode || parentNode.type !== 'dir') {
      return { command: 'nvim ' + args[0], output: `nvim: ${args[0]}: Diretório inválido`, type: 'error' };
    }
  }

  if (targetPath === '/etc/logo.txt') setFlag(dispatch, 'editingLogo');

  dispatch({ type: 'OPEN_WINDOW', payload: 'nvim' });
  dispatch({ type: 'SET_FLAG', payload: { flag: 'nvimFile', value: targetPath } });

  return { command: 'nvim ' + args[0], output: `Editando ${args[0]}...`, type: 'success' };
}

export function executeSudo(args, state, dispatch, options = {}) {
  if (args.length === 0) return { command: 'sudo', output: 'Uso: sudo <comando>', type: 'error' };

  if (!options.password) {
    return { command: 'sudo ' + args.join(' '), output: '🔒 Digite a senha do sudo:', type: 'warning', needsPassword: true };
  }

  if (options.password !== state.sudoPassword) {
    return { command: 'sudo ' + args.join(' '), output: 'Senha sudo incorreta. Acesso negado.', type: 'error' };
  }

  const subCommand = args[0];
  const subArgs = args.slice(1);

  if (subCommand === 'apt') {
    return executeApt(subArgs, state, dispatch, { ...options, password: options.password });
  }

  if (subCommand === 'cat' && subArgs.length > 0) {
    const targetPath = joinPath(state.currentDirectory, subArgs[0]);
    const node = getNodeByPath(state.filesystem, targetPath);

    if (!node) {
      return { command: 'sudo ' + args.join(' '), output: `cat: ${subArgs[0]}: Arquivo inexistente`, type: 'error' };
    }

    if (targetPath.startsWith('/root/secret/')) setFlag(dispatch, 'openedSecret');

    return { command: 'sudo ' + args.join(' '), output: node.content || '', type: 'normal' };
  }

  if (subCommand === 'cd' && subArgs.length > 0) {
    const targetPath = joinPath(state.currentDirectory, subArgs[0]);
    const node = getNodeByPath(state.filesystem, targetPath);

    if (!node || node.type !== 'dir') {
      return { command: 'sudo ' + args.join(' '), output: `cd: ${subArgs[0]}: Diretório inválido`, type: 'error' };
    }

    if (targetPath === '/root') setFlag(dispatch, 'enteredRoot');
    if (targetPath === '/root/secret') setFlag(dispatch, 'openedSecret');

    const prev = state.currentDirectory;
    dispatch({ type: 'CHANGE_DIRECTORY', payload: targetPath });
    dispatch({ type: 'SET_FLAG', payload: { flag: 'previousDirectory', value: prev } });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 15 });
    pushStat(dispatch, 'dirsVisited', targetPath);

    return { command: 'sudo ' + args.join(' '), output: '', type: 'normal' };
  }

  if (subCommand === 'ls') {
    const showHidden = subArgs.includes('-a');
    const showDetails = subArgs.includes('-l');
    let targetPath = state.currentDirectory;

    const nonFlagArgs = subArgs.filter(a => !a.startsWith('-'));
    if (nonFlagArgs.length > 0) targetPath = joinPath(state.currentDirectory, nonFlagArgs[0]);

    const node = getNodeByPath(state.filesystem, targetPath);
    if (!node || node.type !== 'dir') {
      return { command: 'sudo ' + args.join(' '), output: `ls: diretório inválido`, type: 'error' };
    }

    if (targetPath === '/root/secret') setFlag(dispatch, 'openedSecret');

    const children = node.children || {};
    const entries = Object.values(children).filter(e => showHidden || !e.hidden);
    const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name));

    const lines = sortedEntries.map(e => displayNode(e, showDetails, showHidden)).filter(Boolean);
    return { command: 'sudo ' + args.join(' '), output: lines.join('  '), type: 'normal' };
  }

  if (subCommand === 'mv' && subArgs.length >= 2) {
    const sourcePath = joinPath(state.currentDirectory, subArgs[0]);
    const destPath = joinPath(state.currentDirectory, subArgs[1]);
    const sourceParentPath = getParentPath(sourcePath);
    const sourceName = getFileName(sourcePath);
    const sourceParentNode = getNodeByPath(state.filesystem, sourceParentPath);

    if (!sourceParentNode || !sourceParentNode.children[sourceName]) {
      return { command: 'sudo ' + args.join(' '), output: `mv: ${subArgs[0]}: Arquivo inexistente`, type: 'error' };
    }

    const destNode = getNodeByPath(state.filesystem, destPath);
    let finalParentPath, finalName;

    if (destNode && destNode.type === 'dir') {
      finalParentPath = destPath;
      finalName = sourceName;
    } else {
      finalParentPath = getParentPath(destPath);
      finalName = getFileName(destPath);
    }

    const finalParentNode = getNodeByPath(state.filesystem, finalParentPath);
    if (!finalParentNode || finalParentNode.type !== 'dir') {
      return { command: 'sudo ' + args.join(' '), output: `mv: destino inválido`, type: 'error' };
    }

    const newFilesystem = deepClone(state.filesystem);
    const newSourceParent = getNodeByPath(newFilesystem, sourceParentPath);
    const newFinalParent = getNodeByPath(newFilesystem, finalParentPath);

    const movedNode = newSourceParent.children[sourceName];
    delete newSourceParent.children[sourceName];
    movedNode.name = finalName;
    newFinalParent.children[finalName] = movedNode;

    dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
    return { command: 'sudo ' + args.join(' '), output: '', type: 'normal' };
  }

  if (subCommand === 'cp' && subArgs.length >= 2) {
    const sourcePath = joinPath(state.currentDirectory, subArgs[0]);
    const destPath = joinPath(state.currentDirectory, subArgs[1]);
    const sourceParentPath = getParentPath(sourcePath);
    const sourceName = getFileName(sourcePath);
    const sourceParentNode = getNodeByPath(state.filesystem, sourceParentPath);

    if (!sourceParentNode || !sourceParentNode.children[sourceName]) {
      return { command: 'sudo ' + args.join(' '), output: `cp: ${subArgs[0]}: Arquivo inexistente`, type: 'error' };
    }

    const sourceNode = sourceParentNode.children[sourceName];
    const destNode = getNodeByPath(state.filesystem, destPath);
    let finalParentPath, finalName;

    if (destNode && destNode.type === 'dir') {
      finalParentPath = destPath;
      finalName = sourceName;
    } else {
      finalParentPath = getParentPath(destPath);
      finalName = getFileName(destPath);
    }

    const finalParentNode = getNodeByPath(state.filesystem, finalParentPath);
    if (!finalParentNode || finalParentNode.type !== 'dir') {
      return { command: 'sudo ' + args.join(' '), output: `cp: destino inválido`, type: 'error' };
    }

    const newFilesystem = deepClone(state.filesystem);
    const newFinalParent = getNodeByPath(newFilesystem, finalParentPath);
    const copy = deepClone(sourceNode);
    copy.name = finalName;
    newFinalParent.children[finalName] = copy;

    dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
    return { command: 'sudo ' + args.join(' '), output: '', type: 'normal' };
  }

  if (subCommand === 'rm' && subArgs.includes('-rf') && (subArgs.includes('/') || subArgs.includes('/*'))) {
    return {
      command: 'sudo ' + args.join(' '),
      output: '', type: 'normal',
      systemCorrupting: true,
      removalLogs: generateRemovalLogs(),
    };
  }

  return { command: 'sudo ' + args.join(' '), output: `Comando '${subCommand}' não suporta sudo no momento.`, type: 'error' };
}

export function executeAdmin(args, state, dispatch) {
  dispatch({ type: 'OPEN_WINDOW', payload: 'admin' });
  return { command: 'admin', output: 'Abrindo painel de administração...', type: 'success' };
}

export function executeClear(args, state, dispatch) {
  dispatch({ type: 'CLEAR_HISTORY' });
  return null;
}

export function executeAchievements(args, state, dispatch) {
  dispatch({ type: 'OPEN_WINDOW', payload: 'achievements' });
  return { command: 'achievements', output: 'Abrindo painel de conquistas...', type: 'success' };
}

export function executeVictory(args, state, dispatch) {
  if (!state.flags?.finalUnlocked) {
    return {
      command: 'victory',
      output: `Comando não encontrado: victory. Digite 'help' para ver os comandos disponíveis.`,
      type: 'error',
    };
  }

  dispatch({ type: 'OPEN_WINDOW', payload: 'credits' });
  return { command: 'victory', output: 'Iniciando créditos finais...', type: 'success' };
}

export function executeMeta(args, state, dispatch) {
  if (args.length === 0) return { command: 'meta', output: 'Uso: meta <arquivo>', type: 'error' };

  const targetPath = joinPath(state.currentDirectory, args[0]);
  const node = getNodeByPath(state.filesystem, targetPath);

  if (!node || node.type !== 'file') {
    return { command: 'meta ' + args.join(' '), output: `meta: ${args[0]}: Arquivo não encontrado`, type: 'error' };
  }

  if (!node.meta) {
    return { command: 'meta ' + args.join(' '), output: `meta: ${args[0]}: Sem metadados disponíveis (não é um arquivo de mídia).`, type: 'normal' };
  }

  const m = node.meta;
  const lines = [
    `Arquivo:     ${node.name}`,
    `Tamanho:     ${formatSize(node.size)}`,
    `───── metadados ─────`,
  ];
  for (const [k, v] of Object.entries(m)) {
    lines.push(`${k.padEnd(12)}${v}`);
  }

  return { command: 'meta ' + args.join(' '), output: lines.join('\n'), type: 'normal' };
}

export function executeUntar(args, state, dispatch, options = {}) {
  if (args.length === 0) return { command: 'untar', output: 'Uso: untar <arquivo.tar>', type: 'error' };

  const tarName = args[0];

  if (!/\.tar$/i.test(tarName)) {
    return { command: 'untar ' + tarName, output: `untar: ${tarName}: Formato não reconhecido. Use 'unzip' para arquivos .zip.`, type: 'error' };
  }

  const tarPath = joinPath(state.currentDirectory, tarName);
  const tarNode = getNodeByPath(state.filesystem, tarPath);

  if (!tarNode) {
    return { command: 'untar ' + tarName, output: `untar: ${tarName}: Arquivo não encontrado`, type: 'error' };
  }

  if (tarNode.type !== 'file') {
    return { command: 'untar ' + tarName, output: `untar: ${tarName}: Não é um arquivo`, type: 'error' };
  }

  const currentDirName = getFileName(state.currentDirectory);
  if (currentDirName !== 'Backup') {
    return { command: 'untar ' + tarName, output: 'untar: O arquivo só pode ser extraído de dentro de uma pasta chamada "Backup".', type: 'error' };
  }

  const skipPuzzlePasswords = state.flags?.skipPuzzlePasswords === true;

  if (!skipPuzzlePasswords) {
    const currentDirNode = getNodeByPath(state.filesystem, state.currentDirectory);
    const passwordFile = currentDirNode?.children?.['password.txt'];

    if (!passwordFile || passwordFile.type !== 'file') {
      return { command: 'untar ' + tarName, output: 'untar: Arquivo de autenticação "password.txt" não encontrado nesta pasta.', type: 'error' };
    }

    const fileContent = (passwordFile.content || '').trim();
    if (fileContent !== 'm30w') {
      return { command: 'untar ' + tarName, output: 'untar: Senha incorreta em password.txt. Acesso negado.', type: 'error' };
    }
  }

  if (state.flags?.catsUntarred) {
    return { command: 'untar ' + tarName, output: 'Este arquivo já foi extraído anteriormente.', type: 'normal' };
  }

  const newFilesystem = deepClone(state.filesystem);
  const homeNode = getNodeByPath(newFilesystem, '/home/k1tty');

  if (homeNode) {
    const now = new Date().toISOString();
    homeNode.children['cats'] = {
      name: 'cats', type: 'dir', content: null,
      permissions: 'rwxr-xr-x', owner: 'k1tty',
      hidden: false, locked: false, password: null,
      size: 4096, lastModified: now,
      children: {
        'readme.txt': {
          name: 'readme.txt', type: 'file',
          content:
`Encontrei meus gatos de volta!\n\n` +
`Depois de tanto tempo procurando, finalmente consegui recuperar todas as fotos dos meus gatos.\n` +
`Cada uma dessas imagens é uma memória que eu não queria perder.\n\n` +
`Ainda bem que guardei elas num backup. Agora estão seguras aqui comigo de novo.\n\n` +
`Mas enquanto eu mexia nos arquivos antigos, percebi que deixei passar uma coisa:\n` +
`tinha um executável de um projeto meu lá no meio, e ele veio junto com o backup.\n\n` +
`Se eu quiser rodar ele, é só escrever o nome dele direto no prompt de comando.\n` +
`Não precisa de caminho, não precisa de ./ nem nada — só digitar e apertar Enter.\n\n` +
`Vou deixar ele aí por enquanto. Quem sabe um dia eu termino esse projeto.\n\n` +
`— k1tty`,
          permissions: 'rw-r--r--', owner: 'k1tty',
          hidden: false, locked: false, password: null,
          size: 850, lastModified: now, userCreated: true,
        },
      },
    };
    dispatch({ type: 'UPDATE_FILESYSTEM', payload: newFilesystem });
  }

  dispatch({ type: 'SET_FLAG', payload: { flag: 'catsUntarred', value: true } });
  dispatch({ type: 'INCREMENT_PROGRESS', payload: 15 });

  return {
    command: 'untar ' + tarName,
    output:
      'Autenticando...\n' +
      '✓ Senha de backup correta\n\n' +
      'Extraindo cats.tar...\n' +
      '  cats/readme.txt\n' +
      '\n✓ Extração concluída em /home/k1tty/cats/',
    type: 'success',
  };
}

export function executeUnzip(args, state, dispatch, options = {}) {
  if (args.length === 0) return { command: 'unzip', output: 'Uso: unzip <arquivo.zip>', type: 'error' };

  const zipName = getFileName(args[0]);
  const zipPath = joinPath(state.currentDirectory, args[0]);
  const zipNode = getNodeByPath(state.filesystem, zipPath);

  if (!/\.zip$/i.test(zipName)) {
    return { command: 'unzip ' + args[0], output: `unzip: ${args[0]}: Formato não reconhecido. Use 'untar' para arquivos .tar.`, type: 'error' };
  }

  const skipBluetooth = state.flags?.skipBluetooth === true;
  const skipPuzzlePasswords = state.flags?.skipPuzzlePasswords === true;

  const skipMusicFileCheck = skipBluetooth && zipName === 'music_pack.zip';

  if (!zipNode && !skipMusicFileCheck) {
    return { command: 'unzip ' + args[0], output: `unzip: ${args[0]}: Arquivo não encontrado`, type: 'error' };
  }

  if (zipNode && zipNode.type !== 'file') {
    return { command: 'unzip ' + args[0], output: `unzip: ${args[0]}: Não é um arquivo`, type: 'error' };
  }

  if (skipMusicFileCheck && !state.flags?.pairedPhone) {
    dispatch({ type: 'RECEIVE_PHONE_FILES' });
  }

  if (zipName === 'music_pack.zip') {
    if (state.flags?.musicExtracted) {
      return { command: 'unzip ' + args[0], output: 'Este pacote já foi extraído anteriormente.', type: 'normal' };
    }

    dispatch({ type: 'EXTRACT_MUSIC' });
    dispatch({ type: 'SET_FLAG', payload: { flag: 'musicExtracted', value: true } });

    if (skipBluetooth) dispatch({ type: 'SET_FLAG', payload: { flag: 'unlockedMusicLocked', value: true } });

    dispatch({ type: 'INCREMENT_PROGRESS', payload: 15 });

    return {
      command: 'unzip ' + args[0],
      output:
        'Archive:  music_pack.zip\n' +
        '  inflating: Back 2 Back.mp3\n' +
        '  inflating: Children of the City.mp3\n' +
        '  inflating: RUNAWAY.mp3\n' +
        '  inflating: You_re A Big Girl Now.mp3\n' +
        '\n✓ 4 faixas extraídas em ~/Music/\n' +
        '\nUse `mp3player` para ouvir. E olhe ~/Music com atenção.',
      type: 'success',
    };
  }

  if (zipName === 'miau-vn.zip') {
    if (state.flags?.miauVnInstalled) {
      return { command: 'unzip ' + args[0], output: 'Você já extraiu o miau-vn anteriormente.', type: 'normal' };
    }

    dispatch({ type: 'INSTALL_MIAU_VN' });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 8 });

    return {
      command: 'unzip ' + args[0],
      output:
        'Archive:  miau-vn.zip\n' +
        '  inflating: Games/miau-vn\n' +
        '  inflating: Games/readme.txt\n' +
        '\n✓ Extraído em ~/Games/\n' +
        '\nPra abrir, digite: miau-vn',
      type: 'success',
    };
  }

  if (zipName === 'cat_photos.zip') {
    if (!options.password && !skipPuzzlePasswords) {
      return { command: 'unzip ' + args[0], output: `🔒 Este arquivo está protegido. Digite a senha:`, type: 'warning', needsPassword: true };
    }

    if (!skipPuzzlePasswords && options.password !== 'm30w') {
      return { command: 'unzip ' + args[0], output: 'Senha incorreta. Acesso negado.', type: 'error' };
    }

    if (state.flags?.finalUnlocked) {
      return { command: 'unzip ' + args[0], output: 'Você já extraiu este pacote. Suas fotos estão em /root/secret/cats/.', type: 'normal' };
    }

    dispatch({ type: 'EXTRACT_CAT_PHOTOS' });
    dispatch({ type: 'INCREMENT_PROGRESS', payload: 15 });

    return {
      command: 'unzip ' + args[0],
      output:
        'Archive:  cat_photos.zip\n' +
        '  extracting: cats/cat_01.webp\n' +
        '  extracting: cats/cat_02.webp\n' +
        '  extracting: cats/cat_03.webp\n' +
        '  extracting: cats/cat_04.webp\n' +
        '  extracting: cats/cat_05.webp\n' +
        '  ...\n' +
        '  extracting: cats/cat_20.webp\n' +
        '  extracting: final.txt\n' +
        '\n✓ 20 fotos e uma carta foram salvas em /root/secret/cats/\n' +
        '\nLeia a carta. Depois execute `victory`.',
      type: 'success',
    };
  }

  return { command: 'unzip ' + args[0], output: `unzip: ${args[0]}: Formato não reconhecido`, type: 'error' };
}

/* ============================================================
   Comandos com API externa
   ============================================================ */

export function executeCatFact(args, state, dispatch) {
  if (!state.wifiConnected) {
    return { command: 'catfact', output: 'Sem conexão. Use `ping` e `connect` primeiro.', type: 'error' };
  }

  if (state.apiCache?.catFact) {
    dispatch({ type: 'SET_FLAG', payload: { flag: 'readCatFact', value: true } });
    return { command: 'catfact', output: `🐱 SABIA?\n\n${state.apiCache.catFact}`, type: 'normal' };
  }

  return fetchCatFact()
    .then(fact => {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'readCatFact', value: true } });
      return { command: 'catfact', output: `🐱 SABIA?\n\n${fact}`, type: 'normal' };
    })
    .catch(() => ({ command: 'catfact', output: 'Não foi possível buscar um fato agora.', type: 'error' }));
}

export function executeQuote(args, state, dispatch) {
  if (!state.wifiConnected) {
    return { command: 'quote', output: 'Sem conexão. Use `ping` e `connect` primeiro.', type: 'error' };
  }

  if (state.apiCache?.quote) {
    const { text, author } = state.apiCache.quote;
    dispatch({ type: 'SET_FLAG', payload: { flag: 'readQuote', value: true } });
    return { command: 'quote', output: `❝ ${text} ❞\n\n   — ${author}`, type: 'normal' };
  }

  return fetchQuote()
    .then(({ text, author }) => {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'readQuote', value: true } });
      return { command: 'quote', output: `❝ ${text} ❞\n\n   — ${author}`, type: 'normal' };
    })
    .catch(() => ({ command: 'quote', output: 'Não foi possível buscar uma frase agora.', type: 'error' }));
}

export function executePokemon(args, state, dispatch) {
  if (!state.wifiConnected) {
    return { command: 'pokemon', output: 'Sem conexão. Use `ping` e `connect` primeiro.', type: 'error' };
  }

  const playCry = (url) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.4;
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      audio.addEventListener('ended', () => {
        try {
          audio.pause();
          audio.src = '';
          audio.load();
        } catch {}
      });
      setTimeout(() => {
        try {
          if (!audio.paused) return;
          audio.src = '';
          audio.load();
        } catch {}
      }, 15000);
    } catch { /* ignora */ }
  };

  const query = args[0];

  if (!query && state.apiCache?.pokemon) {
    const p = state.apiCache.pokemon;
    playCry(p.cry);
    dispatch({ type: 'STAT_PUSH', payload: { key: 'pokemonSeen', value: String(p.id) } });
    if (p.isLegendary && !state.flags?.sawLegendary) {
      dispatch({ type: 'SET_FLAG', payload: { flag: 'sawLegendary', value: true } });
    }
    return {
      command: 'pokemon',
      output: `#${String(p.id).padStart(4, '0')} ${p.name} — ${p.types.join('/')}`,
      special: { type: 'pokemon', data: p },
      type: 'normal',
    };
  }

  const idOrName = query || getRandomCatPokemonId();

  return fetchPokemon(idOrName)
    .then(p => {
      playCry(p.cry);
      dispatch({ type: 'STAT_PUSH', payload: { key: 'pokemonSeen', value: String(p.id) } });
      if (p.isLegendary && !state.flags?.sawLegendary) {
        dispatch({ type: 'SET_FLAG', payload: { flag: 'sawLegendary', value: true } });
      }
      return {
        command: 'pokemon' + (query ? ' ' + query : ''),
        output: `#${String(p.id).padStart(4, '0')} ${p.name} — ${p.types.join('/')}`,
        special: { type: 'pokemon', data: p },
        type: 'normal',
      };
    })
    .catch(err => ({
      command: 'pokemon' + (query ? ' ' + query : ''),
      output: `pokemon: '${query || 'aleatório'}': Não encontrado. (${err.message})`,
      type: 'error',
    }));
}

export function executeMiauVn(args, state, dispatch) {
  if (!state.flags?.miauVnInstalled) {
    return { command: 'miau-vn', output: `Comando não encontrado: miau-vn. (Você ainda não instalou esse jogo.)`, type: 'error' };
  }

  dispatch({ type: 'OPEN_WINDOW', payload: 'miau-vn' });
  return { command: 'miau-vn', output: 'Abrindo miau-vn...', type: 'success' };
}

/* ============================================================
   MODIFICADO: switchos agora exige doggyOsUnlocked
   ============================================================ */
export function executeSwitchOS(args, state, dispatch) {
  if (state.systemCorrupted) {
    return {
      command: 'switchos',
      output: 'Comando não disponível neste estado.',
      type: 'error',
    };
  }

  if (state.currentSave === null) {
    return {
      command: 'switchos',
      output: 'Nenhuma sessão ativa.',
      type: 'error',
    };
  }

  if (!state.flags?.doggyOsUnlocked) {
    return {
      command: 'switchos',
      output:
        'Comando não encontrado: switchos.\n' +
        'Dica: você precisa de uma imagem de sistema alternativa.\n' +
        'Procure no `web`.',
      type: 'error',
    };
  }

  dispatch({ type: 'START_OS_SWITCH' });
  return {
    command: 'switchos',
    output: 'Iniciando troca para d0ggy OS...',
    type: 'warning',
  };
}

/* ============================================================
   Print de TODOS os estágios do whatnow — ORIGINAL
   ============================================================ */
export function executeWhatnowAllStages(state) {
  const STAGES = [
    {
      label: '1/9 · Sem senha do sudo',
      wifi: false,
      patch: {},
    },
    {
      label: '2/9 · Sem conexão WiFi',
      wifi: false,
      patch: { foundSudoPassword: true },
    },
    {
      label: '3/9 · Sem apt-cli (.deb não instalado)',
      wifi: true,
      patch: { foundSudoPassword: true, installedAptCli: false },
    },
    {
      label: '4/9 · Sem Bluetooth pareado',
      wifi: true,
      patch: {
        foundSudoPassword: true,
        installedAptCli: true,
        pairedPhone: false,
      },
    },
    {
      label: '5/9 · Sem TOKEN (Music_Locked trancado)',
      wifi: true,
      patch: {
        foundSudoPassword: true,
        installedAptCli: true,
        pairedPhone: true,
        unlockedMusicLocked: false,
      },
    },
    {
      label: '6/9 · Sem music_pack.zip extraído',
      wifi: true,
      patch: {
        foundSudoPassword: true,
        installedAptCli: true,
        pairedPhone: true,
        unlockedMusicLocked: true,
        musicExtracted: false,
      },
    },
    {
      label: '7/9 · Sem cats.tar extraído (ponto crítico)',
      wifi: true,
      patch: {
        foundSudoPassword: true,
        installedAptCli: true,
        pairedPhone: true,
        unlockedMusicLocked: true,
        musicExtracted: true,
        catsUntarred: false,
      },
    },
    {
      label: '8/9 · Sem cat_photos.zip extraído',
      wifi: true,
      patch: {
        foundSudoPassword: true,
        installedAptCli: true,
        pairedPhone: true,
        unlockedMusicLocked: true,
        musicExtracted: true,
        catsUntarred: true,
        finalUnlocked: false,
      },
    },
    {
      label: '9/9 · Tudo pronto (vitória disponível)',
      wifi: true,
      patch: {
        foundSudoPassword: true,
        installedAptCli: true,
        pairedPhone: true,
        unlockedMusicLocked: true,
        musicExtracted: true,
        catsUntarred: true,
        finalUnlocked: true,
      },
    },
  ];

  const lines = [];
  const noop = () => {};

  lines.push('═══════════════════════════════════════════');
  lines.push('  WHATNOW — TODOS OS ESTÁGIOS');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push('  Simulação headless dos 9 estágios narrativos.');
  lines.push('  Cada bloco mostra o que o jogador veria se');
  lines.push('  digitasse `whatnow` naquele ponto exato.');
  lines.push('  Não altera o save.');
  lines.push('');

  STAGES.forEach((stage) => {
    const fakeState = {
      ...state,
      wifiConnected: stage.wifi,
      flags: { ...stage.patch },
    };

    let result;
    try {
      result = executeWhatnow([], fakeState, noop);
    } catch (err) {
      result = { output: `[exceção: ${err.message}]` };
    }

    lines.push(`── ${stage.label} ──`);
    lines.push('');

    const output = (result.output || '').trim();
    if (!output) {
      lines.push('  (sem saída)');
    } else {
      output.split('\n').forEach(l => lines.push('  ' + l));
    }

    lines.push('');
  });

  lines.push('═══════════════════════════════════════════');

  return {
    command: 'whatnow-all',
    output: lines.join('\n'),
    type: 'success',
    stats: { stages: STAGES.length },
  };
}