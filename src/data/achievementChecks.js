// src/data/achievementChecks.js

import { ACHIEVEMENTS } from './achievements.js';
import { PACKAGE_IDS } from './packages.js';
import { THEMES } from './themes.js';

export function isAchieved(id, state) {
  const flags = state.flags || {};
  const stats = state.stats || {};
  const packages = state.installedPackages || [];

  const filesRead       = stats.filesRead || [];
  const tracksPlayed    = stats.tracksPlayed || [];
  const catPhotosSeen   = stats.catPhotosSeen || [];
  const themesUsed      = stats.themesUsed || [];
  const dirsVisited     = stats.dirsVisited || [];
  const pokemonSeen     = stats.pokemonSeen || [];

  const filesCreated    = stats.filesCreated || 0;
  const dirsCreated     = stats.dirsCreated || 0;
  const filesDeleted    = stats.filesDeleted || 0;
  const filesRenamed    = stats.filesRenamed || 0;
  const catrunGames     = stats.catrunGames || 0;
  const catrunDeaths    = stats.catrunDeaths || 0;
  const snapshotsMade   = stats.snapshotsMade || 0;

  switch (id) {
    case 'boot':                return state.currentSave !== null;
    case 'primeiro_comando':    return (stats.commandsRun || 0) >= 1;
    case 'tutorial_ok':         return state.tutorialCompleted === true;
    case 'whoami':              return flags.usedWhoami === true;

    case 'ls_a':                return flags.usedLsA === true;
    case 'leitor':              return filesRead.length >= 5;
    case 'detetive':            return flags.foundDoNotOpen === true;
    case 'historico':           return flags.usedLog === true;
    case 'arquiteto':           return filesCreated >= 5;
    case 'construtor':          return dirsCreated >= 3;
    case 'faxineiro':           return filesDeleted >= 3;
    case 'renomeador':          return filesRenamed >= 1;
    case 'viajante':            return dirsVisited.length >= 8;
    case 'multitarefa': {
      const types = (state.openWindows || []).map(w => w.type);
      return new Set(types).size >= 5;
    }
    case 'snapshot_master':     return snapshotsMade >= 3;
    case 'time_traveler':       return flags.loadedSnapshot === true;

    case 'wifi_man':            return state.wifiConnected === true;
    case 'internauta':          return packages.length >= 1;
    case 'colecionador':        return packages.length >= 10;
    case 'completista':         return packages.length >= PACKAGE_IDS.length;
    case 'theme_switch':        return state.theme && state.theme !== 'neon';
    case 'deb_installer':       return flags.installedAptCli === true;

    case 'sudo_master':         return flags.foundSudoPassword === true;
    case 'raiz':                return flags.enteredRoot === true;
    case 'secreto':             return flags.openedSecret === true;
    case 'gato_sabe':           return flags.finalUnlocked === true;
    case 'bt_par':              return flags.pairedPhone === true;
    case 'token_achado':        return flags.unlockedMusicLocked === true;
    case 'dj':                  return tracksPlayed.length >= 4;

    case 'victory':             return flags.finaleSeen === true;
    case 'aniquilador':         return state.systemCorrupted === true && flags.corruptedBy !== 'miau';
    case 'os_switch':           return flags.osSwitched === true;

    case 'recursivo':           return flags.usedRecursive === true;
    case 'customizador':        return flags.changedLogo === true || flags.editingLogo === true;
    case 'vn_good':             return flags.vnGoodEnding === true;
    case 'miau_bom':            return flags.miauGoodEnding === true;
    case 'miau_ruim':           return flags.miauBadEnding === true || flags.corruptedBy === 'miau';
    case 'meow_trilionario':    return flags.meowTrilionario === true;
    case 'cat_photographer':    return catPhotosSeen.length >= 10;
    case 'catrun_best':         return flags.catrunBest50 === true;
    case 'theme_collector':     return themesUsed.length >= 5;
    case 'bonsai_master':       return flags.bonsaiComplete === true;
    case 'catrun_player':       return catrunGames >= 10;
    case 'catrun_deaths':       return catrunDeaths >= 10;
    case 'tutorial_remover':    return flags.tutorialRemoved === true;
    case 'miau_remover':        return flags.miauVnRemoved === true;
    case 'cowsay_wise':         return flags.cowsayConselhoUsado === true;
    case 'writer':              return flags.wroteFile === true;
    // FIX: antes era `>= 33` hardcoded, mas THEMES.length === 32. Nunca destravava.
    case 'theme_all_used':      return themesUsed.length >= THEMES.length;
    case 'catfact_reader':      return flags.readCatFact === true;
    case 'philosopher':         return flags.readQuote === true;
    case 'pokemon_master':      return pokemonSeen.length >= 10;
    case 'pokemon_legendary':   return flags.sawLegendary === true;

    default:                    return false;
  }
}

export function listAchievedIds(state) {
  return ACHIEVEMENTS.filter(a => isAchieved(a.id, state)).map(a => a.id);
}