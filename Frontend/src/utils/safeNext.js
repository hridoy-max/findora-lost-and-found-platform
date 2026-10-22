export function safeNext(next) {
  if (!next || typeof next !== 'string') return '/';
  const backslash = String.fromCharCode(92);
  const isInvalid = !next.startsWith('/') || next.startsWith('//') || next.includes('://') || next.includes(backslash);
  if (isInvalid) return '/';
  return next;
}
