/**
 * Soematra Kost - Cryptographic Utilities
 * Menyediakan enkripsi SHA-256 native di browser menggunakan Web Crypto API.
 */

/**
 * Mengubah string menjadi SHA-256 hex hash secara asinkron.
 * @param text Teks asli yang ingin di-hash
 */
export async function sha256(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    console.warn('Web Crypto API (crypto.subtle) tidak tersedia. Menggunakan fallback non-secure.');
    return simpleHash(text);
  }
  try {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Gagal menghitung SHA-256 hash:', error);
    return simpleHash(text);
  }
}

/**
 * Fallback sederhana non-cryptographic jika dijalankan di environment non-HTTPS yang tidak mendukung crypto.subtle
 */
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'fb_' + Math.abs(hash).toString(16).padStart(8, '0');
}
