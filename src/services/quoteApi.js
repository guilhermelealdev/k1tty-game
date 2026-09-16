// src/services/quoteApi.js

const FALLBACK_QUOTES = [
  { text: 'A simplicidade é o último grau de sofisticação.', author: 'Leonardo da Vinci' },
  { text: 'O que não me mata me fortalece.', author: 'Friedrich Nietzsche' },
  { text: 'Conhece-te a ti mesmo.', author: 'Sócrates' },
  { text: 'A imaginação é mais importante que o conhecimento.', author: 'Albert Einstein' },
  { text: 'Não é o mais forte que sobrevive, mas o que melhor se adapta.', author: 'Charles Darwin' },
  { text: 'O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.', author: 'Winston Churchill' },
  { text: 'Penso, logo existo.', author: 'René Descartes' },
  { text: 'Tudo vale a pena se a alma não é pequena.', author: 'Fernando Pessoa' },
  { text: 'A vida é aquilo que acontece enquanto você faz outros planos.', author: 'John Lennon' },
  { text: 'O único modo de fazer um excelente trabalho é amar o que você faz.', author: 'Steve Jobs' },
];

export async function fetchQuote() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data?.quote) {
      return {
        text: data.quote,
        author: data.author || 'Desconhecido',
      };
    }

    throw new Error('formato inesperado');
  } catch (error) {
    console.warn('[quoteApi] falha:', error.message);
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  }
}