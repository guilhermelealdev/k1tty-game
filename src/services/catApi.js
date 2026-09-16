// src/services/catApi.js

const API_URL = 'https://api.thecatapi.com/v1/images/search';
const TIMEOUT_MS = 4000;

// FIX: helper de fetch com timeout, igual ao usado nos outros services.
function timeoutFetch(url, ms = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

export async function fetchCatImage() {
  try {
    const cacheBust = Math.random().toString(36).slice(2, 8);
    // FIX: usava fetch() direto, agora usa timeoutFetch()
    const response = await timeoutFetch(
      `${API_URL}?limit=1&order=RANDOM&_=${cacheBust}`
    );
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data[0]?.url || null;
  } catch (error) {
    console.error('Error fetching cat image:', error);
    return null;
  }
}

export async function fetchMultipleCatImages(count = 20) {
  const safeCount = Math.min(Math.max(1, count), 100);
  const batchSize = Math.min(safeCount * 3, 100);

  const seenIds = new Set();
  const seenUrls = new Set();
  const urls = [];

  const fetchBatch = async (limit) => {
    const cacheBust = Math.random().toString(36).slice(2, 8);
    const url = `${API_URL}?limit=${limit}&order=RANDOM&_=${cacheBust}`;
    // FIX: também com timeout
    const response = await timeoutFetch(url);
    if (!response.ok) throw new Error('Falha ao buscar gatos');
    return response.json();
  };

  try {
    const data = await fetchBatch(batchSize);
    for (const item of data) {
      if (!item?.url) continue;
      const id = item.id || item.url;
      if (seenIds.has(id) || seenUrls.has(item.url)) continue;
      seenIds.add(id);
      seenUrls.add(item.url);
      urls.push(item.url);
    }
  } catch (err) {
    console.error('Error fetching cats (1ª tentativa):', err);
  }

  if (urls.length < safeCount) {
    try {
      const remaining = safeCount - urls.length;
      const data = await fetchBatch(Math.min(remaining * 3, 100));
      for (const item of data) {
        if (!item?.url) continue;
        const id = item.id || item.url;
        if (seenIds.has(id) || seenUrls.has(item.url)) continue;
        seenIds.add(id);
        seenUrls.add(item.url);
        urls.push(item.url);
        if (urls.length >= safeCount) break;
      }
    } catch (err) {
      console.error('Error fetching cats (2ª tentativa):', err);
    }
  }

  if (urls.length === 0) {
    throw new Error('Nenhum gato retornado pela API');
  }

  for (let i = urls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [urls[i], urls[j]] = [urls[j], urls[i]];
  }

  return urls.slice(0, safeCount);
}

export function isImageFile(filename) {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(filename);
}

export function collectImagePathsWithoutUrl(filesystem) {
  const paths = [];

  function walk(node, path) {
    if (!node || !node.children) return;
    for (const name in node.children) {
      const child = node.children[name];
      const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
      if (child.type === 'file' && child.isImage) {
        if (!child.imageUrl) paths.push(childPath);
      } else if (child.type === 'dir') {
        walk(child, childPath);
      }
    }
  }

  walk(filesystem, '/');
  return paths;
}

export async function preloadImagesForPaths(paths) {
  if (!paths || paths.length === 0) return [];
  try {
    const urls = await fetchMultipleCatImages(paths.length);
    return paths
      .map((path, i) => ({ path, url: urls[i] || null }))
      .filter(item => item.url);
  } catch (e) {
    console.error('Falha no preload de imagens:', e);
    return [];
  }
}