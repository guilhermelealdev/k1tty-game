// src/data/packages.js

/* ============================================================
   IDs de todos os pacotes instaláveis via `sudo apt install`.

   Comandos base (ls, cd, cat, web, achievements, etc.) NÃO
   entram aqui — eles já vêm com o sistema.
   ============================================================ */
export const PACKAGE_IDS = [
  // ───── ferramentas de arquivo ─────
  'unzip',
  'untar',

  // ───── utilitários de terminal (sem janela) ─────
  'catfact',
  'quote',
  'pokemon',
  'tutorial',
  'apt-cli',

  // ───── jogos / entretenimento ─────
  'matrix',
  'btop',
  'lens',
  'mp3player',
  'audioview',
  'bonsai',
  'catrun',
  'kitty',
  'meow',
  'ram',
  'opsec',
  'bluetooth',
  'whoisthis',
  'kittens',
  'k1tty',
  'miau-vn',
];

/* ============================================================
   Catálogo completo com metadados.
   `openWindow` = string → abre uma janela flutuante com o tipo
   `openWindow` = null   → roda como comando puro no terminal
   ============================================================ */
export const PACKAGES = [
  // ───── ferramentas de arquivo ─────
  { id: 'unzip',    label: 'unzip — extrai arquivos .zip',         openWindow: null },
  { id: 'untar',    label: 'untar — extrai arquivos .tar',         openWindow: null },

  // ───── utilitários de terminal ─────
  { id: 'catfact',  label: 'catfact — fato aleatório sobre gatos', openWindow: null },
  { id: 'quote',    label: 'quote — frase filosófica aleatória',   openWindow: null },
  { id: 'pokemon',  label: 'pokemon — consulta a Pokédex',         openWindow: null },
  { id: 'tutorial', label: 'tutorial — assistente miau',           openWindow: null },
  { id: 'apt-cli',  label: 'apt-cli — loja de pacotes visual',     openWindow: 'apt-cli' },

  // ───── jogos / entretenimento ─────
  { id: 'matrix',    label: 'matrix — chuva digital',              openWindow: 'matrix' },
  { id: 'btop',      label: 'btop — monitor de sistema',           openWindow: 'btop' },
  { id: 'lens',      label: 'lens — visualizador de imagens',      openWindow: 'lens' },
  { id: 'mp3player', label: 'mp3player — toca músicas',            openWindow: 'mp3player' },
  { id: 'audioview', label: 'audioview — visualizador de áudio',   openWindow: 'audioview' },
  { id: 'bonsai',    label: 'bonsai — árvore ASCII que cresce',    openWindow: 'bonsai' },
  { id: 'catrun',    label: 'catrun — jogo do gatinho correndo',   openWindow: 'catrun' },
  { id: 'kitty',     label: 'kitty — foto aleatória de gato',      openWindow: 'kitty' },
  { id: 'meow',      label: 'meow — k1tty clicker',                openWindow: 'meow' },
  { id: 'ram',       label: 'ram — instalador de RAM virtual',     openWindow: 'ram' },
  { id: 'opsec',     label: 'opsec — cartaz de segurança',         openWindow: 'opsec' },
  { id: 'bluetooth', label: 'bluetooth — gerencia dispositivos',   openWindow: 'bluetooth' },
  { id: 'whoisthis', label: 'whoisthis — detalhes de arquivos',    openWindow: 'whoisthis' },
  { id: 'kittens',   label: 'kittens — gerenciador de temas',      openWindow: 'kittens' },
  { id: 'k1tty',     label: 'k1tty — terminal recursivo',          openWindow: 'k1tty' },
  { id: 'miau-vn',   label: 'miau-vn — visual novel',              openWindow: 'miau-vn' },
];

/* ============================================================
   Pacotes que abrem janela ao rodar o comando.
   (web e achievements não entram: são base, não pacotes)
   ============================================================ */
export const PACKAGES_WITH_WINDOW = PACKAGES.filter(p => p.openWindow);

/* ============================================================
   Formata a lista pro `sudo apt help`.
   Ex: "  unzip          extrai arquivos .zip"
   ============================================================ */
export function formatAptHelpList() {
  return PACKAGES
    .map(p => `  ${p.id.padEnd(14)} ${p.label}`)
    .join('\n');
}

/* ============================================================
   Formata descrições pro `help`.
   Retorna um objeto { id: 'id - descrição' }.
   ============================================================ */
export function formatHelpDescriptions() {
  const map = {};
  for (const pkg of PACKAGES) {
    const clean = pkg.label.split('—')[1]?.trim() || pkg.label;
    map[pkg.id] = `${pkg.id} - ${clean}`;
  }
  return map;
}