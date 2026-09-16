// src/services/pokeApi.js

const POKE_API = 'https://pokeapi.co/api/v2';
const CRIES_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest';
const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** IDs de Pokémons felinos — tema do jogo. */
export const CAT_POKEMON_IDS = [
  52,   // Meowth
  53,   // Persian
  150,  // Mewtwo
  151,  // Mew
  300,  // Skitty
  301,  // Delcatty
  509,  // Purrloin
  510,  // Liepard
  677,  // Espurr
  678,  // Meowstic
  725,  // Litten
  726,  // Torracat
  727,  // Incineroar
  791,  // Solgaleo
  807,  // Zeraora
];

export const TYPE_ICONS = {
  normal: '⚪', fire: '🔥', water: '💧', electric: '⚡',
  grass: '🌿', ice: '❄️', fighting: '🥊', poison: '☠️',
  ground: '🏜️', flying: '🪶', psychic: '🔮', bug: '🐛',
  rock: '🪨', ghost: '👻', dragon: '🐉', dark: '🌑',
  steel: '⚙️', fairy: '🧚',
};

export const TYPE_PT = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
  grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Veneno',
  ground: 'Terra', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
  steel: 'Aço', fairy: 'Fada',
};

function timeoutFetch(url, ms = 6000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

export async function fetchPokemon(idOrName) {
  const pRes = await timeoutFetch(`${POKE_API}/pokemon/${String(idOrName).toLowerCase()}`);
  if (!pRes.ok) throw new Error(`HTTP ${pRes.status}`);
  const pokemon = await pRes.json();

  const sRes = await timeoutFetch(`${POKE_API}/pokemon-species/${pokemon.id}`);
  const species = sRes.ok ? await sRes.json() : null;

  const flavorEntry = species?.flavor_text_entries?.find(e => e.language?.name === 'en');
  const flavor = flavorEntry?.flavor_text
    ?.replace(/\f/g, ' ')
    ?.replace(/\n/g, ' ')
    ?.replace(/\s+/g, ' ')
    ?.trim() || '—';

  const genus = species?.genera?.find(g => g.language?.name === 'en')?.genus || '—';

  const stats = Object.fromEntries(
    pokemon.stats.map(s => [s.stat.name, s.base_stat])
  );

  return {
    id: pokemon.id,
    name: pokemon.name,
    sprite: `${SPRITES_BASE}/${pokemon.id}.png`,
    cry: `${CRIES_BASE}/${pokemon.id}.ogg`,
    types: pokemon.types.map(t => t.type.name),
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    baseExp: pokemon.base_experience,
    stats,
    abilities: pokemon.abilities.map(a => a.ability.name.replace(/-/g, ' ')),
    genus,
    flavor,
    isLegendary: species?.is_legendary || false,
    isMythical: species?.is_mythical || false,
  };
}

export function getRandomCatPokemonId() {
  return CAT_POKEMON_IDS[Math.floor(Math.random() * CAT_POKEMON_IDS.length)];
}

export function formatPokemonEntry(p) {
  const typeLine = p.types
    .map(t => `${TYPE_ICONS[t] || '❓'} ${TYPE_PT[t] || t}`)
    .join('   ');

  const badge = p.isLegendary
    ? '✦ LENDÁRIO'
    : p.isMythical
      ? '✦ MÍTICO'
      : '';

  const idStr = String(p.id).padStart(4, '0');
  const nameUpper = p.name.toUpperCase();

  const statsLine =
    `HP ${String(p.stats.hp).padStart(3)}   ` +
    `ATK ${String(p.stats.attack).padStart(3)}   ` +
    `DEF ${String(p.stats.defense).padStart(3)}   ` +
    `SP.ATK ${String(p.stats['special-attack']).padStart(3)}   ` +
    `SP.DEF ${String(p.stats['special-defense']).padStart(3)}   ` +
    `SPD ${String(p.stats.speed).padStart(3)}`;

  const lines = [
    `╔══════════════════════════════════════════╗`,
    `║  #${idStr}  ${nameUpper.padEnd(30)}║`,
    `╚══════════════════════════════════════════╝`,
    ``,
    `  Tipo:       ${typeLine}${badge ? '   ' + badge : ''}`,
    `  Categoria:  ${p.genus}`,
    `  Altura:     ${p.height.toFixed(1)} m`,
    `  Peso:       ${p.weight.toFixed(1)} kg`,
    `  Exp base:   ${p.baseExp ?? '—'}`,
    `  Habilidades: ${p.abilities.join(', ')}`,
    ``,
    `  ▸ Stats:`,
    `    ${statsLine}`,
    ``,
    `  "${p.flavor}"`,
    ``,
    `  ▸ sprite:  ${p.sprite}`,
    `  ▸ cry:     ${p.cry}`,
  ];

  return lines.join('\n');
}