// src/services/apiPreloader.js

import { fetchCatImage } from './catApi.js';
import { fetchCatFact } from './catFactApi.js';
import { fetchAdvice } from './adviceApi.js';
import { fetchQuote } from './quoteApi.js';
import { fetchPokemon, getRandomCatPokemonId } from './pokeApi.js';

export const API_STEPS = [
  { id: 'catImage', label: 'Conectando a api.thecatapi.com' },
  { id: 'catFact',  label: 'Consultando fatos felinos' },
  { id: 'advice',   label: 'Buscando conselho do dia' },
  { id: 'quote',    label: 'Lendo uma frase filosófica' },
  { id: 'pokemon',  label: 'Consultando a Pokédex' },
];

/**
 * Roda todos os preloads em paralelo.
 * onStatus(id, status, payload) é chamado a cada mudança.
 * Retorna um objeto { catImage, catFact, advice, quote, pokemon }.
 */
export async function preloadAllApis(onStatus) {
  const cache = {};

  const tasks = [
    {
      id: 'catImage',
      run: async () => {
        const url = await fetchCatImage();
        if (!url) throw new Error('sem imagem');
        return { catImage: url };
      },
    },
    {
      id: 'catFact',
      run: async () => {
        const fact = await fetchCatFact();
        return { catFact: fact };
      },
    },
    {
      id: 'advice',
      run: async () => {
        const advice = await fetchAdvice();
        return { advice };
      },
    },
    {
      id: 'quote',
      run: async () => {
        const quote = await fetchQuote();
        return { quote };
      },
    },
    {
      id: 'pokemon',
      run: async () => {
        const p = await fetchPokemon(getRandomCatPokemonId());
        return { pokemon: p };
      },
    },
  ];

  await Promise.all(tasks.map(async (task) => {
    onStatus?.(task.id, 'pending');
    try {
      const result = await task.run();
      Object.assign(cache, result);
      onStatus?.(task.id, 'ok', result);
    } catch (err) {
      onStatus?.(task.id, 'error', err?.message);
    }
  }));

  return cache;
}