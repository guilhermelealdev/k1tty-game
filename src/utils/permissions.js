// src/utils/permissions.js

/*
  As permissões do jogo são strings de 9 caracteres SEM prefixo de tipo:
    r w -  r - -  r - -
    0 1 2  3 4 5  6 7 8
    ↑     ↑      ↑
    owner group  other
*/

export function canRead(node, user = 'k1tty') {
  if (!node) return false;
  const perms = node.permissions || 'rw-r--r--';
  if (node.owner === user) return perms[0] === 'r';
  return perms[3] === 'r' || perms[6] === 'r';
}

export function canWrite(node, user = 'k1tty') {
  if (!node) return false;
  const perms = node.permissions || 'rw-r--r--';
  if (node.owner === user) return perms[1] === 'w';
  return perms[4] === 'w' || perms[7] === 'w';
}

export function canExecute(node, user = 'k1tty') {
  if (!node) return false;
  const perms = node.permissions || 'rw-r--r--';
  if (node.owner === user) return perms[2] === 'x';
  return perms[5] === 'x' || perms[8] === 'x';
}

export function requiresSudo(node) {
  return node?.requiresSudo === true || node?.locked === true;
}