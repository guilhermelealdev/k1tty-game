export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function getNodeByPath(filesystem, path) {
  if (!path || path === '/') return filesystem;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const parts = cleanPath.split('/').filter(p => p !== '');
  
  let current = filesystem;
  for (const part of parts) {
    if (part === '..') {
      return null; // Handle separately
    }
    if (!current.children || !current.children[part]) {
      return null;
    }
    current = current.children[part];
  }
  return current;
}

export function getParentPath(path) {
  if (!path || path === '/') return '/';
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const lastSlash = cleanPath.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return cleanPath.substring(0, lastSlash);
}

export function getFileName(path) {
  if (!path || path === '/') return '/';
  const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const lastSlash = cleanPath.lastIndexOf('/');
  return cleanPath.substring(lastSlash + 1);
}

export function joinPath(base, relative) {
  if (!relative || relative === '.') return base || '/';

  // "~" sozinho → home
  if (relative === '~') return '/home/k1tty';

  // FIX: suporte a "~/..." — sem isto, `cat ~/.notes.txt` virava
  // literalmente `/home/k1tty/~/.notes.txt` e falhava silenciosamente.
  if (relative.startsWith('~/')) {
    relative = relative.replace(/^~/, '/home/k1tty');
  }

  if (relative.startsWith('/')) return relative;
  if (relative === '..') return getParentPath(base);
  
  const baseParts = base.split('/').filter(p => p !== '');
  const relParts = relative.split('/').filter(p => p !== '');
  
  for (const part of relParts) {
    if (part === '..') {
      baseParts.pop();
    } else if (part !== '.') {
      baseParts.push(part);
    }
  }
  
  return '/' + baseParts.join('/');
}

export function formatPermissions(node) {
  if (node.permissions === 'sudo') return 'sudo';
  return node.permissions || 'rw-r--r--';
}

export function formatSize(size) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}K`;
  return `${(size / (1024 * 1024)).toFixed(1)}M`;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}