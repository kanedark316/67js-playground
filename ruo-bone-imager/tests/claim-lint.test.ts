import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  FORBIDDEN_PHRASES,
  RUO_BANNER_TEXT,
  EXPORT_WATERMARK,
} from '../src/claim-lint/forbiddenPhrases.ts';
import {
  assertNoForbiddenPhrases,
  findForbiddenPhrases,
  maskAllowedSnippets,
} from '../src/claim-lint/lint.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('E8 forbidden phrase list', () => {
  it('includes core safety-doc bans', () => {
    const required = [
      'fracture detected',
      'fracture confirmed',
      'no fracture',
      'rules out fracture',
      'probability of fracture',
      'safe to return to sport',
      'replaces radiology',
      'x-ray parity',
      'diagnose fracture',
      'clinical diagnosis',
    ];
    const lower = FORBIDDEN_PHRASES.map((p) => p.toLowerCase());
    for (const phrase of required) {
      assert.ok(lower.includes(phrase), `missing phrase: ${phrase}`);
    }
  });

  it('keeps scripts/claim-lint.mjs list in sync with TypeScript source', () => {
    const script = readFileSync(join(root, 'scripts/claim-lint.mjs'), 'utf8');
    for (const phrase of FORBIDDEN_PHRASES) {
      assert.ok(
        script.toLowerCase().includes(`'${phrase.toLowerCase()}'`),
        `script missing ${phrase}`,
      );
    }
  });
});

describe('E8 claim lint scanner', () => {
  it('allows official RUO banner and export watermark', () => {
    assert.deepEqual(findForbiddenPhrases(RUO_BANNER_TEXT), []);
    assert.deepEqual(findForbiddenPhrases(EXPORT_WATERMARK), []);
    assert.doesNotThrow(() => assertNoForbiddenPhrases(RUO_BANNER_TEXT, 'banner'));
  });

  it('fails on banned clinical strings', () => {
    const bad = 'UI: Fracture detected — treat as clinical diagnosis.';
    const hits = findForbiddenPhrases(bad);
    assert.ok(hits.length > 0);
    assert.throws(() => assertNoForbiddenPhrases(bad, 'ui'), /Claim lint failed/);
  });

  it('fails on rules-out and x-ray parity language', () => {
    assert.ok(findForbiddenPhrases('This rules out fracture today.').length > 0);
    assert.ok(findForbiddenPhrases('Claims X-ray parity with DR.').length > 0);
  });

  it('masks allowlisted snippets before scanning', () => {
    const masked = maskAllowedSnippets(RUO_BANNER_TEXT);
    assert.ok(!masked.toLowerCase().includes('research use only'));
  });
});

describe('App copy hygiene', () => {
  it('App.tsx and README have no forbidden phrases', () => {
    for (const rel of ['src/App.tsx', 'README.md', 'src/components/RuoSplash.tsx']) {
      const text = readFileSync(join(root, rel), 'utf8');
      assert.deepEqual(findForbiddenPhrases(text), [], rel);
    }
  });
});
