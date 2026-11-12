/** Cryptographically strong hex token for session / annotation IDs. */
export function randomToken(byteLength = 6): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

const FIXTURE_PATH =
  /^\/fixtures\/(?:cine\/)?[A-Za-z0-9][A-Za-z0-9._-]*\.svg$/;

const FALLBACK_FIXTURE = '/fixtures/sample-bmode.svg';

/**
 * Only allow local SVG fixtures under /fixtures/. Rejects schemes, .., and
 * remote URLs so persisted session data cannot drive img.src XSS.
 */
export function safeFixtureSrc(path: string): string {
  if (typeof path === 'string' && FIXTURE_PATH.test(path) && !path.includes('..')) {
    return path;
  }
  return FALLBACK_FIXTURE;
}

/** Strip anything that is not a safe alt/label token. */
export function safeLabel(value: string): string {
  return String(value).replace(/[^A-Za-z0-9._-]+/g, '').slice(0, 64) || 'frame';
}
