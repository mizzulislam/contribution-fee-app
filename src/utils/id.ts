/**
 * Utilitas untuk membuat ID yang aman dan unik (UUID).
 */
export function generateSecureId(prefix = ''): string {
  const uuid = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  return prefix ? `${prefix}-${uuid}` : uuid;
}
