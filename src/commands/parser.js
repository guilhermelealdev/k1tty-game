// src/commands/parser.js

import {
  executeLs, executeCd, executeCat, executeTouch, executeMkdir, executeRm,
  executeMv, executeFind, executeGrep, executeDate, executeWhoami, executeHelp,
  executeFastfetch, executeCowsay, executeWhatnow, executeHowleft, executeNotes,
  executeLog, executeSnapshot, executeReboot, executeApt, executeWeb, executePing,
  executeConnect, executeNvim, executeSudo, executeAdmin, executeClear,
  executeVictory, executeUnzip, executeUntar, executeAchievements, executeMeta,
  executeMiauVn, executeCatFact, executeQuote, executePokemon, executeSwitchOS,
  executePwd, executeEcho, executeHistory,
} from './commands.js';
import { PACKAGES_WITH_WINDOW } from '../data/packages.js';

/* ============================================================
   Comandos que NÃO precisam de pacote.
   Tudo fora desta lista exige que o pacote esteja instalado.

   `web` e `achievements` são BASE porque:
     - web = acesso ao fórum (narrativa principal)
     - achievements = painel de progresso (feedback constante)
   ============================================================ */
export const BASE_COMMANDS = new Set([
  // navegação / arquivos
  'ls', 'cd', 'cat', 'touch', 'mkdir', 'rm', 'mv', 'find', 'grep',
  'pwd', 'echo', 'clear', 'history',
  // sistema
  'whoami', 'date', 'help', '--help',
  'sudo', 'reboot', 'snapshot', 'notes', 'log',
  'howleft', 'whatnow', 'meta',
  // rede
  'ping', 'connect',
  // gerenciador de pacotes (senão não instala nada)
  'apt',
  // editor base do sistema
  'nvim',
  // clássicos que já vêm no SO
  'fastfetch', 'cowsay',
  // acesso essencial à narrativa e progresso
  'web', 'achievements',
  // admin (debug)
  'admin',
  // fim de jogo
  'victory', 'switchos',
]);

/* ============================================================
   Mapa de comandos → pacote necessário (quando não é base).
   `web` e `achievements` NÃO estão aqui: são base.
   ============================================================ */
export const COMMAND_PACKAGE_MAP = {
  // pacotes que abrem janela
  'matrix':      'matrix',
  'btop':        'btop',
  'lens':        'lens',
  'mp3player':   'mp3player',
  'audioview':   'audioview',
  'bonsai':      'bonsai',
  'catrun':      'catrun',
  'kitty':       'kitty',
  'meow':        'meow',
  'ram':         'ram',
  'opsec':       'opsec',
  'bluetooth':   'bluetooth',
  'whoisthis':   'whoisthis',
  'kittens':     'kittens',
  'k1tty':       'k1tty',

  // pacotes que rodam comando puro
  'unzip':       'unzip',
  'untar':       'untar',
  'catfact':     'catfact',
  'quote':       'quote',
  'pokemon':     'pokemon',
  'miau-vn':     'miau-vn',
  'tutorial':    'tutorial',
  'apt-cli':     'apt-cli',
};

const commandMap = {
  // base
  'ls':         executeLs,
  'cd':         executeCd,
  'cat':        executeCat,
  'touch':      executeTouch,
  'mkdir':      executeMkdir,
  'rm':         executeRm,
  'mv':         executeMv,
  'find':       executeFind,
  'grep':       executeGrep,
  'pwd':        executePwd,
  'echo':       executeEcho,
  'clear':      executeClear,
  'history':    executeHistory,
  'date':       executeDate,
  'whoami':     executeWhoami,
  'help':       executeHelp,
  '--help':     executeHelp,
  'fastfetch':  executeFastfetch,
  'cowsay':     executeCowsay,
  'whatnow':    executeWhatnow,
  'howleft':    executeHowleft,
  'notes':      executeNotes,
  'log':        executeLog,
  'snapshot':   executeSnapshot,
  'reboot':     executeReboot,
  'apt':        executeApt,
  'ping':       executePing,
  'connect':    executeConnect,
  'nvim':       executeNvim,
  'sudo':       executeSudo,
  'admin':      executeAdmin,
  'meta':       executeMeta,
  'victory':    executeVictory,
  'switchos':   executeSwitchOS,

  // base (narrativa / progresso)
  'web':          executeWeb,
  'achievements': executeAchievements,

  // pacotes com janela
  'miau-vn':    executeMiauVn,

  // pacotes sem janela (comando puro)
  'unzip':      executeUnzip,
  'untar':      executeUntar,
  'catfact':    executeCatFact,
  'quote':      executeQuote,
  'pokemon':    executePokemon,
};

export function parseCommand(input) {
  const parts = [];
  let current = '';
  let quoteChar = null;
  let isEscaping = false;

  for (const char of input.trim()) {
    if (isEscaping) {
      current += char;
      isEscaping = false;
      continue;
    }

    if (char === '\\') {
      isEscaping = true;
      continue;
    }

    if (quoteChar) {
      if (char === quoteChar) {
        quoteChar = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quoteChar = char;
      continue;
    }

    if (char === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) parts.push(current);

  const command = parts[0];
  const args = parts.slice(1);
  return { command, args };
}

export function executeCommand(input, state, dispatch, options = {}) {
  const { command, args } = parseCommand(input);

  if (command && command !== 'clear') {
    dispatch({ type: 'STAT_INCREMENT', payload: { key: 'commandsRun' } });
  }

  /* ---- verificação de pacote ---- */
  if (command && !BASE_COMMANDS.has(command)) {
    const requiredPkg = COMMAND_PACKAGE_MAP[command];
    if (requiredPkg && !state.installedPackages.includes(requiredPkg)) {
      return {
        command: input,
        output:
          `Comando não encontrado: ${command}.\n` +
          `Instale com: sudo apt install ${requiredPkg}`,
        type: 'error',
      };
    }
  }

  /* ---- casos especiais ---- */
  if (command === 'k1tty' && state.installedPackages.includes('k1tty')) {
    dispatch({ type: 'SET_FLAG', payload: { flag: 'usedRecursive', value: true } });
  }

  if (command === 'unzip') {
    if (!state.installedPackages.includes('unzip')) {
      return {
        command: input,
        output: `Comando não encontrado: unzip. Instale com 'sudo apt install unzip'.`,
        type: 'error',
      };
    }
    return executeUnzip(args, state, dispatch, options);
  }

  if (command === 'untar') {
    if (!state.installedPackages.includes('untar')) {
      return {
        command: input,
        output: `Comando não encontrado: untar. Instale com 'sudo apt install untar'.`,
        type: 'error',
      };
    }
    return executeUntar(args, state, dispatch, options);
  }

  if (command === 'tutorial' && state.flags?.tutorialRemoved === true
      && !state.installedPackages.includes('tutorial')) {
    return {
      command: 'tutorial',
      output: 'O tutorial foi desinstalado. Reinstale com `sudo apt install tutorial`.',
      type: 'info',
    };
  }

  // pacotes que abrem janela (exclui os base como web/achievements)
  if (state.installedPackages.includes(command)) {
    const pkg = PACKAGES_WITH_WINDOW.find(p => p.id === command);
    if (pkg) {
      dispatch({ type: 'OPEN_WINDOW', payload: pkg.openWindow });
      return {
        command: input,
        output: `Abrindo ${pkg.label}...`,
        type: 'success',
      };
    }
  }

  const executor = commandMap[command];
  if (!executor) {
    return {
      command: input,
      output: `Comando não encontrado: ${command}. Digite 'help' para ver os comandos disponíveis.`,
      type: 'error',
    };
  }

  return executor(args, state, dispatch, options);
}