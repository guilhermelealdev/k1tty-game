// src/services/catFactApi.js

const FALLBACK_FACTS = [
  'Gatos passam cerca de 70% da vida dormindo.',
  'Um gato tem 32 músculos em cada orelha.',
  'Gatos não conseguem sentir o gosto doce.',
  'O nariz de um gato é único, como uma impressão digital.',
  'Gatos podem saltar até 6 vezes a própria altura.',
  'Um grupo de gatos é chamado de "clowder".',
  'Gatos ronronam numa frequência que ajuda a curar ossos.',
  'O gato mais velho registrado viveu 38 anos.',
  'Gatos têm 230 ossos — humanos têm 206.',
  'O cérebro de um gato é 90% similar ao de um humano.',
];

export async function fetchCatFact() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://catfact.ninja/fact', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data?.fact) return data.fact;

    throw new Error('formato inesperado');
  } catch (error) {
    console.warn('[catFactApi] falha:', error.message);
    return FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
  }
}