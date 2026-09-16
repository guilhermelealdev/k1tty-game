// src/data/achievements.js

export const ACHIEVEMENT_CATEGORIES = {
  inicio:      { label: 'Início',          color: '#95C623' },
  exploracao:  { label: 'Exploração',      color: '#C7EF00' },
  sistema:     { label: 'Sistema',         color: '#88c0d0' },
  enigma:      { label: 'Enigmas',         color: '#ffb86c' },
  final:       { label: 'Finais',          color: '#EF6461' },
  easter_egg:  { label: 'Easter Eggs',     color: '#cba6f7' },
};

export const ACHIEVEMENTS = [
  { id: 'boot',                name: 'Primeiro contato',              desc: 'Assista o sistema iniciar do zero.',           icon: '🐱', category: 'inicio' },
  { id: 'primeiro_comando',    name: 'Iniciante',                     desc: 'Execute seu primeiro comando no terminal.',    icon: '⌨️', category: 'inicio' },
  { id: 'tutorial_ok',         name: 'Formado',                       desc: 'Conclua o tutorial do miau.',                  icon: '🎓', category: 'inicio' },
  { id: 'whoami',              name: 'Quem sou eu?',                  desc: 'Use o comando `whoami`.',                      icon: '👤', category: 'inicio' },

  { id: 'ls_a',                name: 'Não é tudo que se vê',          desc: 'Liste arquivos ocultos com `ls -a`.',          icon: '👀', category: 'exploracao' },
  { id: 'leitor',              name: 'Rato de biblioteca',            desc: 'Leia 5 arquivos diferentes.',                  icon: '📖', category: 'exploracao' },
  { id: 'detetive',            name: 'Detetive',                      desc: 'Encontre a pasta "DO NOT OPEN".',              icon: '🔍', category: 'exploracao' },
  { id: 'historico',           name: 'O passado é um livro aberto',   desc: 'Consulte o histórico de logs do sistema.',     icon: '📜', category: 'exploracao' },
  { id: 'arquiteto',           name: 'Arquiteto de arquivos',         desc: 'Crie 5 arquivos com `touch`.',                 icon: '🗂️', category: 'exploracao' },
  { id: 'construtor',          name: 'Construtor',                    desc: 'Crie 3 diretórios com `mkdir`.',               icon: '🏗️', category: 'exploracao' },
  { id: 'faxineiro',           name: 'Faxineiro',                     desc: 'Apague 3 arquivos criados por você.',          icon: '🧹', category: 'exploracao' },
  { id: 'renomeador',          name: 'Renomeador',                    desc: 'Renomeie um arquivo com `mv`.',                icon: '✏️', category: 'exploracao' },
  { id: 'viajante',            name: 'Viajante',                      desc: 'Visite 8 diretórios diferentes.',              icon: '🧭', category: 'exploracao' },
  { id: 'multitarefa',         name: 'Multitarefa',                   desc: 'Tenha 5 janelas diferentes abertas ao mesmo tempo.', icon: '🪟', category: 'exploracao' },
  { id: 'snapshot_master',     name: 'Viajante do tempo',             desc: 'Crie 3 snapshots do sistema.',                 icon: '💾', category: 'exploracao' },
  { id: 'time_traveler',       name: 'De volta ao futuro',            desc: 'Restaure um snapshot com `snapshot load`.',    icon: '⏳', category: 'exploracao' },

  { id: 'wifi_man',            name: 'Conectado',                     desc: 'Conecte-se a uma rede Wi-Fi.',                 icon: '📶', category: 'sistema' },
  { id: 'internauta',          name: 'Internauta',                    desc: 'Instale seu primeiro pacote via apt.',         icon: '🌐', category: 'sistema' },
  { id: 'colecionador',        name: 'Colecionador',                  desc: 'Instale 10 pacotes diferentes.',               icon: '📦', category: 'sistema' },
  { id: 'completista',         name: 'Pacote completo',               desc: 'Instale TODOS os pacotes disponíveis.',        icon: '🏆', category: 'sistema' },
  { id: 'theme_switch',        name: 'Estilista',                     desc: 'Troque o tema do sistema com `kittens`.',      icon: '🎨', category: 'sistema' },
  { id: 'deb_installer',       name: 'Instalador local',              desc: 'Instale um pacote .deb com `sudo apt install ./arquivo.deb`.', icon: '📥', category: 'sistema' },

  { id: 'sudo_master',         name: 'Chave-mestra',                  desc: 'Descubra a senha do sudo.',                    icon: '🔑', category: 'enigma' },
  { id: 'raiz',                name: 'Raiz',                          desc: 'Entre no diretório /root.',                    icon: '🌳', category: 'enigma' },
  { id: 'secreto',             name: 'O que está escondido',          desc: 'Abra a pasta /root/secret.',                   icon: '🤫', category: 'enigma' },
  { id: 'gato_sabe',           name: 'O gato sabe',                   desc: 'Descubra o que o cofre de k1tty guarda.',      icon: '🐈', category: 'enigma' },
  { id: 'bt_par',              name: 'Pareado',                       desc: 'Pareie com o dispositivo k1tty-phone.',        icon: '📱', category: 'enigma' },
  { id: 'token_achado',        name: 'Palavra-chave',                 desc: 'Desbloqueie a pasta Music_Locked.',            icon: '🎵', category: 'enigma' },
  { id: 'dj',                  name: 'DJ felino',                     desc: 'Ouça todas as faixas extraídas do pacote.',    icon: '🎧', category: 'enigma' },

  { id: 'victory',             name: 'Vitória',                       desc: 'Execute o `victory` e veja os créditos.',      icon: '👑', category: 'final' },
  { id: 'aniquilador',         name: 'Aniquilador',                   desc: 'Destrua o sistema com `rm -rf /`.',            icon: '💀', category: 'final', hidden: true },
  { id: 'os_switch',           name: 'Metamorfose',                   desc: 'Troque de sistema operacional com `switchos`.',icon: '🔄', category: 'final', hidden: true },

  { id: 'recursivo',           name: 'Recursivo',                     desc: 'Rode `k1tty` dentro de `k1tty`.',              icon: '🔁', category: 'easter_egg', hidden: true },
  { id: 'customizador',        name: 'Arquiteto de sistema',          desc: 'Edite o logo do fastfetch.',                   icon: '⚙️', category: 'easter_egg', hidden: true },
  { id: 'vn_good',             name: 'Gentileza compensa',            desc: 'Converse com a k1tty sem irritá-la.',          icon: '🌸', category: 'easter_egg', hidden: true },
  { id: 'miau_bom',            name: 'Um lugar seguro',               desc: 'Faça amizade com a miau.',                     icon: '💗', category: 'easter_egg', hidden: true },
  { id: 'miau_ruim',           name: 'A miau te odeia',               desc: 'Irrite a miau até o sistema quebrar.',         icon: '☠️', category: 'easter_egg', hidden: true },
  { id: 'meow_trilionario',    name: 'Trilionário felino',            desc: 'Tenha 1 trilhão de pets no k1tty Clicker.',    icon: '💰', category: 'easter_egg', hidden: true },
  { id: 'cat_photographer',    name: 'Fotógrafo de gatos',            desc: 'Veja 10 fotos diferentes no comando `kitty`.', icon: '📸', category: 'easter_egg', hidden: true },
  { id: 'catrun_best',         name: 'Corredor',                      desc: 'Alcance 50 de score no Cat Run.',              icon: '🏃', category: 'easter_egg', hidden: true },
  { id: 'theme_collector',     name: 'Colecionador de temas',         desc: 'Use 5 temas diferentes no sistema.',           icon: '🌈', category: 'easter_egg', hidden: true },
  { id: 'bonsai_master',       name: 'Jardineiro',                    desc: 'Veja o bonsai crescer por completo.',          icon: '🌳', category: 'easter_egg', hidden: true },
  { id: 'catrun_player',       name: 'Viciado em Cat Run',            desc: 'Jogue 10 partidas do Cat Run.',                icon: '🎮', category: 'easter_egg', hidden: true },
  { id: 'catrun_deaths',       name: 'Colecionador de derrotas',      desc: 'Morra 10 vezes no Cat Run.',                   icon: '💥', category: 'easter_egg', hidden: true },
  { id: 'tutorial_remover',    name: 'Sem professor',                 desc: 'Desinstale o tutorial do miau.',               icon: '🚪', category: 'easter_egg', hidden: true },
  { id: 'miau_remover',        name: 'Adeus, miau',                   desc: 'Desinstale a visual novel da miau.',           icon: '👋', category: 'easter_egg', hidden: true },
  { id: 'cowsay_wise',         name: 'Vaca sábia',                    desc: 'Peça um conselho pro `cowsay`.',               icon: '🐄', category: 'easter_egg', hidden: true },
  { id: 'writer',              name: 'Escritor',                      desc: 'Salve um arquivo seu com o `nvim`.',           icon: '📝', category: 'easter_egg', hidden: true },
  { id: 'theme_all_used',      name: 'Metamorfose total',             desc: 'Use todos os temas disponíveis.',              icon: '🦋', category: 'easter_egg', hidden: true },
  { id: 'catfact_reader',      name: 'Enciclopédia felina',           desc: 'Leia um fato sobre gatos com `catfact`.',      icon: '📚', category: 'easter_egg', hidden: true },
  { id: 'pokemon_master',      name: 'Mestre Pokémon',                desc: 'Veja 10 Pokémons diferentes na pokédex.',      icon: '⚡', category: 'easter_egg', hidden: true },
  { id: 'pokemon_legendary',   name: 'Lenda viva',                    desc: 'Encontre um Pokémon lendário na pokédex.',     icon: '🌟', category: 'easter_egg', hidden: true },
  { id: 'philosopher',         name: 'Filósofo de terminal',          desc: 'Leia uma frase filosófica com `quote`.',       icon: '🧠', category: 'easter_egg', hidden: true },
];

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}