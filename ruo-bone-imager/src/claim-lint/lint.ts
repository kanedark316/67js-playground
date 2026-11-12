import {
  ALLOWED_CLAIM_SNIPPETS,
  FORBIDDEN_PHRASES,
} from './forbiddenPhrases.ts';

export type ClaimHit = {
  phrase: string;
  index: number;
  excerpt: string;
};

/**
 * Mask allowlisted RUO / investigational wording so scanners do not false-positive
 * on the required banner and watermark.
 */
export function maskAllowedSnippets(text: string): string {
  let masked = text;
  for (const snippet of ALLOWED_CLAIM_SNIPPETS) {
    const pattern = new RegExp(escapeRegExp(snippet), 'gi');
    masked = masked.replace(pattern, (match) => ' '.repeat(match.length));
  }
  return masked;
}

export function findForbiddenPhrases(text: string): ClaimHit[] {
  const masked = maskAllowedSnippets(text);
  const lower = masked.toLowerCase();
  const hits: ClaimHit[] = [];

  for (const phrase of FORBIDDEN_PHRASES) {
    let from = 0;
    const needle = phrase.toLowerCase();
    while (from < lower.length) {
      const index = lower.indexOf(needle, from);
      if (index === -1) {
        break;
      }
      const excerptStart = Math.max(0, index - 24);
      const excerptEnd = Math.min(text.length, index + phrase.length + 24);
      hits.push({
        phrase,
        index,
        excerpt: text.slice(excerptStart, excerptEnd).replace(/\s+/g, ' ').trim(),
      });
      from = index + needle.length;
    }
  }

  return hits;
}

export function assertNoForbiddenPhrases(text: string, label = 'text'): void {
  const hits = findForbiddenPhrases(text);
  if (hits.length === 0) {
    return;
  }
  const detail = hits
    .map((hit) => `  - "${hit.phrase}" near: ${hit.excerpt}`)
    .join('\n');
  throw new Error(`Claim lint failed in ${label}:\n${detail}`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
