// src/filesystem/initialData.js

/* ============================================================
   Gerador de senha do sudo
   ============================================================ */
export function generateSudoPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'Sudo';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return result;
}

/* ============================================================
   Conteúdos dos arquivos do sistema
   ============================================================ */

const MEOW_INDEX_CONTENT = `═══ .meow_index ═══
Um manifesto felino, escrito por alguém que ainda acredita.

[I]
MEOW meow MEOW meow ME0W
meow MEOW meow MEOW meow
MEOW meow MEOW meow MEOW
meow MEOW meow MEOW meow

[II]
MEOW meow MEOW meow MEOW
meow MEOW meow m30w meow
MEOW meow MEOW meow MEOW
meow MEOW meow MEOW meow

[III]
MEOW meow M30W meow MEOW
meow MEOW meow MEOW meow
MEOW meow MEOW meow MEOW
meow MEOW meow MEOW meow

[IV]
MEOW meow MEOW meow MEOW
meow MEOW meow MEOW meow
MEOW m3ow MEOW meow MEOW
meow MEOW meow MEOW meow

────────────────────────
entre todos os iguais, apenas um é exatamente o que você procura.
`;

const WHISPER_CONTENT = `whisper.txt
─────────────

O guardião deste arquivo não responde a nomes.
Ele responde ao nome da casa.

A casa não é "home". A casa não é "user".
A casa é quem mora aqui.
A casa é k1tty.
O usuário é k1tty.
Tudo aqui é k1tty.

Isto não é um enigma.
É um espelho.
`;

const README_SECRET_CONTENT = `README — leia antes de qualquer coisa
─────────────────────────────────────
por k1tty

Eu guardei minhas fotos de gatos neste cofre, mas o processo
de compactação corrompeu o índice do arquivo.

Se você está lendo isto, é porque conseguiu chegar até aqui —
o que significa que passou por tudo o que eu preparei.

Há dois arquivos protegidos neste cofre:

  1. cats.tar — o backup antigo, quando as coisas ainda
     funcionavam.

     O comando de extração exige TRÊS coisas ao mesmo tempo:

       a) que o cats.tar esteja dentro de uma pasta chamada
          "Backup" (no seu home, por exemplo)
       b) que exista um arquivo "password.txt" na MESMA pasta
       c) que o conteúdo do "password.txt" seja a senha correta

     Se faltar qualquer um dos três, o comando falha. O
     sistema é chato assim. Eu nunca terminei de organizar
     isso.

     Dica: para escrever dentro do password.txt, use o
     comando \`nvim password.txt\` e salve com Ctrl+S.

  2. cat_photos.zip — o pacote final, com o índice corrompido.
     A senha é a mesma coisa que você procurou o jogo inteiro.

A senha não é óbvia. Ela está escondida no lugar onde você
guarda suas músicas favoritas. Procure por padrões. Procure
pelo que não deveria estar ali. Compare os iguais, e um deles
será exatamente o que você procura.

Boa sorte.
— k1tty
`;

const NOTES_CONTENT = `Notas pessoais de k1tty:
─────────────────────────

- Lembrar de pagar a conta de internet
- WiFi: k1tty's home
- Senha do WiFi: meow12345
- Comprar ração para o gato
- Não esquecer a senha do sudo (está em Documents/DO NOT OPEN)
- Investigar aquela pasta estranha no /root

Outras coisas:
- Meu celular tem músicas antigas que eu queria passar pro PC.
  Vou tentar via bluetooth algum dia.
- Tem um arquivo estranho em ~/Music chamado .meow_index.
  Não sei quem colocou lá. Não consigo parar de olhar.
- Guardei um .deb em ~/Downloads. Talvez seja útil.
- Fiz um backup antigo (cats.tar) e escondi dentro do cofre
  do /root/secret. Não lembro a senha do arquivo. Alguma
  coisa com gato.
- Se eu morrer, o que importa é o que está em /root/secret.
  Esteja preparado.

Fim das notas.
`;

const COMMANDS_HELP_CONTENT = `Comandos disponíveis:
ls, cd, cat, clear, touch, mkdir, rm, mv, find, grep,
date, whoami, help, fastfetch, cowsay, whatnow, howleft,
notes, log, snapshot, reboot, apt, web, ping, connect,
nvim, sudo, achievements

Pacotes instaláveis via apt:
matrix, mp3player, lens, bonsai, audioview, opsec, meow,
dinorun, btop, ram, tutorial, untar, unzip, k1tty, kitty,
bluetooth, whoisthis, apt-cli, kittens
`;

const USERLOG_CONTENT = `[2024-01-15 10:23:45] k1tty login
[2024-01-15 11:02:12] k1tty executou: ls -la
[2024-01-15 11:05:33] k1tty executou: cat readme.txt
[2024-01-16 09:15:20] k1tty login
[2024-01-16 14:30:01] k1tty tentou acessar /root (negado - sem sudo)
[2024-01-17 08:45:12] k1tty login
[2024-01-17 10:20:55] k1tty executou: ping (procurando redes...)
[2024-01-18 16:40:30] root login
[2024-01-18 17:00:00] root executou: sudo rm -rf /tmp/*
[2024-01-18 17:01:00] root logout
[2024-02-01 09:00:00] k1tty login
[2024-02-01 09:10:15] k1tty executou: find / -name "secret"
[2024-02-01 09:11:00] k1tty logout
[2024-02-05 22:14:33] k1tty login
[2024-02-05 22:15:01] k1tty executou: sudo mv /root/secret/cats.tar Backup/
[2024-02-05 22:15:30] k1tty executou: cd Backup
[2024-02-05 22:16:12] k1tty logout
`;

/* ============================================================
   Fábricas de nós do filesystem
   ============================================================ */

function createFile(name, content, options = {}) {
  return {
    name,
    type: 'file',
    content: content || '',
    permissions: options.permissions || 'rw-r--r--',
    owner: options.owner || 'k1tty',
    hidden: options.hidden || false,
    locked: options.locked || false,
    password: options.password || null,
    size: (content || '').length,
    lastModified: options.lastModified || new Date().toISOString(),
    ...options,
  };
}

function createDir(name, options = {}) {
  return {
    name,
    type: 'dir',
    content: null,
    permissions: options.permissions || 'rwxr-xr-x',
    owner: options.owner || 'k1tty',
    hidden: options.hidden || false,
    locked: options.locked || false,
    password: options.password || null,
    size: 4096,
    lastModified: options.lastModified || new Date().toISOString(),
    children: options.children || {},
    ...options,
  };
}

function createImageFile(name, options = {}) {
  return createFile(name, `BINARY_IMAGE_${name}`, {
    ...options,
    isImage: true,
    imageUrl: null,
    size: options.size || Math.floor(60000 + Math.random() * 50000),
  });
}

/* ============================================================
   Construção do filesystem inicial

   IMPORTANTE: retorna SEMPRE um objeto novo. A senha do sudo
   fica embutida em /home/k1tty/Documents/DO NOT OPEN/password.txt.
   ============================================================ */
export function getInitialFilesystem(sudoPassword = generateSudoPassword()) {
  const filesystem = createDir('/', {
    owner: 'root',
    permissions: 'rwxr-xr-x',
    children: {
      home: createDir('home', {
        owner: 'root',
        permissions: 'rwxr-xr-x',
        children: {
          k1tty: createDir('k1tty', {
            owner: 'k1tty',
            permissions: 'rwxr-xr-x',
            children: {
              Documents: createDir('Documents', {
                owner: 'k1tty',
                children: {
                  'DO NOT OPEN': createDir('DO NOT OPEN', {
                    owner: 'k1tty',
                    children: {
                      'whisper.txt': createFile('whisper.txt', WHISPER_CONTENT, {
                        owner: 'k1tty',
                        permissions: 'rw-r--r--',
                      }),
                      'password.txt': createFile(
                        'password.txt',
                        `A senha do sudo é: ${sudoPassword}\n\nNão compartilhe esta informação.\nDica: o arquivo pede o nome de usuário para abrir.`,
                        {
                          locked: true,
                          password: null,
                          requiresUsername: true,
                          owner: 'k1tty',
                          permissions: 'rw-------',
                        }
                      ),
                    },
                  }),
                  'readme.txt': createFile(
                    'readme.txt',
                    `Bem-vindo ao k1tty!\n\nEste é seu sistema pessoal. Explore os diretórios e arquivos para descobrir seus segredos.\n\nAlgumas dicas vagas:\n- Nem tudo está à vista. Tente \`ls -a\`.\n- O passado deixa rastros em /var/log.\n- A curiosidade é uma virtude, mas cuidado com a destruição.\n- Quando o terminal não souber te ajudar, use \`web\`.\n\nBoa sorte, k1tty.`,
                    { owner: 'k1tty' }
                  ),
                },
              }),

              Downloads: createDir('Downloads', {
  owner: 'k1tty',
  children: {
    'apt-installer-tui.deb': createFile(
      'apt-installer-tui.deb',
      'BINARY_DEB_PACKAGE_APT_INSTALLER_TUI',
      {
        owner: 'k1tty',
        permissions: 'rw-r--r--',
        size: 245_000,
      }
    ),
    'd0ggy.iso': createFile(
      'd0ggy.iso',
      'BINARY_ISO_IMAGE_D0GGY_OS',
      {
        owner: 'k1tty',
        permissions: 'rw-r--r--',
        size: 650_000_000,
      }
    ),
    'checksums.sha256': createFile(
      'checksums.sha256',
      `# Hashes SHA-256 dos pacotes oficiais do repositório k1tty
# Qualquer pacote que não conste nesta lista deve ser tratado como suspeito.

a1f4e2c9d8b7e6f5a4c3b2e1d0f9c8b7a6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1  apt-installer-tui
e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4  mp3player-pro
c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8  lens-hd
8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6  bonsai-lite

# fim do arquivo`,
      { owner: 'k1tty', permissions: 'rw-r--r--' }
    ),
  },
}),

              Music: createDir('Music', {
                owner: 'k1tty',
                children: {
                  '.meow_index': createFile('.meow_index', MEOW_INDEX_CONTENT, {
                    owner: 'k1tty',
                    hidden: true,
                    permissions: 'rw-r--r--',
                  }),
                },
              }),

              Pictures: createDir('Pictures', {
                owner: 'k1tty',
                children: {
                  'cat_photo.jpg': createImageFile('cat_photo.jpg', { owner: 'k1tty' }),
                  'screenshot_terminal.png': createImageFile('screenshot_terminal.png', { owner: 'k1tty' }),
                  'family_picture.jpg': createImageFile('family_picture.jpg', { owner: 'k1tty' }),
                  'wallpaper.png': createImageFile('wallpaper.png', { owner: 'k1tty' }),
                  'old_backup.jpg': createImageFile('old_backup.jpg', { owner: 'k1tty' }),
                },
              }),

              '.notes.txt': createFile('.notes.txt', NOTES_CONTENT, {
                hidden: true,
                owner: 'k1tty',
              }),
            },
          }),
        },
      }),

      etc: createDir('etc', {
        owner: 'root',
        permissions: 'rwxr-xr-x',
        children: {
          'logo.txt': createFile(
            'logo.txt',
            `   ,-.       _,---._ __  / \\
  /  )    .-'       \`./ /   \\
 (  (   ,'            \`/    /|
  \\  \`-"             \\'\\   / |
   \`.              ,  \\ \\ /  |
    /\`.          ,'-\`----Y   |
   (            ;        |   '
   |  ,-.    ,-'         |  /
   |  | (   |        k1t | /
   )  |  \\  \`.___________|/
   \`--'   \`--'`,
            { owner: 'root', permissions: 'rw-r--r--' }
          ),
          hostname: createFile('hostname', 'k1tty', { owner: 'root', permissions: 'rw-r--r--' }),
          'os-release': createFile(
            'os-release',
            `NAME="k1tty Linux"\nVERSION="1.0.0"\nID=k1tty\nPRETTY_NAME="k1tty Linux 1.0.0"`,
            { owner: 'root', permissions: 'rw-r--r--' }
          ),
        },
      }),

      var: createDir('var', {
        owner: 'root',
        permissions: 'rwxr-xr-x',
        children: {
          log: createDir('log', {
            owner: 'root',
            permissions: 'rwxr-xr-x',
            children: {
              userlog: createFile('userlog', USERLOG_CONTENT, {
                owner: 'root',
                permissions: 'rw-r--r--',
              }),
            },
          }),
        },
      }),

      tmp: createDir('tmp', {
        owner: 'root',
        permissions: 'rwxrwxrwt',
        children: {},
      }),

      usr: createDir('usr', {
        owner: 'root',
        permissions: 'rwxr-xr-x',
        children: {
          share: createDir('share', {
            owner: 'root',
            permissions: 'rwxr-xr-x',
            children: {
              wallpapers: createDir('wallpapers', {
                owner: 'root',
                permissions: 'rwxr-xr-x',
                children: {
                  'default_wallpaper.png': createImageFile('default_wallpaper.png', { owner: 'root' }),
                  'k1tty_theme.jpg': createImageFile('k1tty_theme.jpg', { owner: 'root' }),
                },
              }),
              icons: createDir('icons', {
                owner: 'root',
                permissions: 'rwxr-xr-x',
                children: {
                  'cat_icon.png': createImageFile('cat_icon.png', { owner: 'root' }),
                },
              }),
            },
          }),
          bin: createDir('bin', {
            owner: 'root',
            permissions: 'rwxr-xr-x',
            children: {
              'commands.txt': createFile('commands.txt', COMMANDS_HELP_CONTENT, {
                owner: 'root',
                permissions: 'rw-r--r--',
              }),
            },
          }),
        },
      }),

      root: createDir('root', {
        owner: 'root',
        permissions: 'rwx------',
        locked: true,
        requiresSudo: true,
        children: {
          secret: createDir('secret', {
            owner: 'root',
            permissions: 'rwx------',
            locked: true,
            requiresSudo: true,
            children: {
              'README.txt': createFile('README.txt', README_SECRET_CONTENT, {
                owner: 'root',
                permissions: 'rw-r--r--',
              }),
              'cats.tar': createFile('cats.tar', 'BINARY_TAR_CATS_BACKUP', {
                owner: 'root',
                permissions: 'rw-r--r--',
                size: 4_500_000,
              }),
              'cat_photos.zip': createFile(
                'cat_photos.zip',
                'BINARY_ZIP_CAT_PHOTOS',
                {
                  owner: 'root',
                  permissions: 'rw-------',
                  locked: true,
                  password: 'm30w',
                  size: 12_500_000,
                }
              ),
            },
          }),
        },
      }),

      bin: createDir('bin', {
        owner: 'root',
        permissions: 'rwxr-xr-x',
        children: {
          ls: createFile('ls', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          cd: createFile('cd', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          cat: createFile('cat', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          touch: createFile('touch', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          mkdir: createFile('mkdir', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          rm: createFile('rm', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          mv: createFile('mv', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          find: createFile('find', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          grep: createFile('grep', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          date: createFile('date', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          whoami: createFile('whoami', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          help: createFile('help', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          fastfetch: createFile('fastfetch', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          cowsay: createFile('cowsay', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          whatnow: createFile('whatnow', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          howleft: createFile('howleft', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          notes: createFile('notes', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          log: createFile('log', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          snapshot: createFile('snapshot', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          reboot: createFile('reboot', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          apt: createFile('apt', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          web: createFile('web', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          ping: createFile('ping', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          connect: createFile('connect', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          nvim: createFile('nvim', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          sudo: createFile('sudo', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          clear: createFile('clear', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
          meta: createFile('meta', 'BINARY_EXECUTABLE', { owner: 'root', permissions: 'rwxr-xr-x' }),
        },
      }),
    },
  });

  return filesystem;
}

/* ============================================================
   Template estático do filesystem.

   ATENÇÃO: este é um SINGLETON criado uma vez no import do módulo.
   NÃO USE ESTE OBJETO DIRETO como `state.filesystem` — qualquer
   mutação acidental corromperia todos os saves.

   Use `getInitialFilesystem()` ou `getInitialState()` para obter
   uma cópia fresca e independente.

   Mantido exportado apenas para compatibilidade com imports antigos
   (ex: GameContext.jsx que importa `initialFilesystem`).
   ============================================================ */
export const initialFilesystem = getInitialFilesystem();

/* ============================================================
   Stats iniciais completos

   Espelha o INITIAL_STATS de GameContext.jsx para que jogo novo
   e jogo carregado tenham EXATAMENTE o mesmo shape de stats.
   Sem isto, achievements que checam `stats.pokemonSeen.length`
   quebram em jogo novo (undefined).
   ============================================================ */
function makeInitialStats() {
  return {
    commandsRun: 0,
    filesRead: [],
    tracksPlayed: [],
    catPhotosSeen: [],
    themesUsed: [],
    dirsVisited: [],
    filesCreated: 0,
    dirsCreated: 0,
    filesDeleted: 0,
    filesRenamed: 0,
    catrunGames: 0,
    catrunDeaths: 0,
    snapshotsMade: 0,
    pokemonSeen: [],
  };
}

/* ============================================================
   Estado inicial de um novo save (slot novo)

   Gera um novo sudoPassword E um filesystem novo com esse password
   já embutido em password.txt. Coerente consigo mesmo.
   ============================================================ */
export function getInitialState(slot, skipTutorial = false) {
  const sudoPassword = generateSudoPassword();
  const filesystem = getInitialFilesystem(sudoPassword);

  return {
    filesystem,
    currentDirectory: '/home/k1tty',
    history: [],
    sudoPassword,
    wifiConnected: false,
    wifiName: "k1tty's home",
    wifiPassword: 'meow12345',
    installedPackages: [],
    openWindows: [],
    windowPositions: {},
    snapshots: [],
    snapshotError: null,
    currentSave: slot,
    progress: 0,
    tutorialCompleted: skipTutorial,
    flags: {},
    systemCorrupted: false,
    finaleActive: false,
    miauFinaleActive: false,
    osSwitchActive: false,
    theme: 'neon',
    stats: makeInitialStats(),
    unlockedAchievements: [],
    pendingUnlocks: [],
    seenEndings: [],
    apiCache: {},
  };
}