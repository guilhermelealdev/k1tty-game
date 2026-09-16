// src/services/adviceApi.js

const FALLBACK_ADVICE = [
  'Não confie em um gato que não pisca.',
  'Se o terminal não responde, ele está pensando. Ou você.',
  'Nem todo arquivo quer ser aberto. Respeite o "NÃO ABRA".',
  'Curiosidade matou o gato. Mas a informação o trouxe de volta.',
  'Sempre faça backup. Sempre.',
  'rm -rf nunca é a resposta. Exceto quando é.',
  'A senha mais forte é aquela que você não anota. A segunda mais forte é a que você anota.',
  'Todo sistema é uma casa mal-assombrada de decisões antigas.',
  'Não existe comando inútil. Existe comando mal usado.',
  'O melhor firewall é desligar o cabo.',
  'Se você não entende o código, ele entende você.',
  'Antes de perguntar "por que não funciona?", pergunte "por que funcionaria?".',
  'O /dev/null aceita tudo. Sem julgamento.',
  'grep não mente. As pessoas mentem sobre o que digitam.',
  'Um gato dormindo é um servidor em standby.',
  'O que é um bug, senão uma feature que se recusa a ser documentada?',
];

export async function fetchAdvice() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://api.adviceslip.com/advice?_=${Date.now()}`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data?.slip?.advice) {
      return data.slip.advice;
    }

    throw new Error('formato inesperado');
  } catch (error) {
    console.warn('[adviceApi] falha ao buscar conselho:', error.message);
    return FALLBACK_ADVICE[Math.floor(Math.random() * FALLBACK_ADVICE.length)];
  }
}