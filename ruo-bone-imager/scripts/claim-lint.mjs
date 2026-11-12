#!/usr/bin/env node
/**
 * E8 claim linter — scans package copy for forbidden clinical/claims phrases.
 * Phrase list mirrors src/claim-lint/forbiddenPhrases.ts (keep in sync via tests).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const FORBIDDEN_PHRASES = [
  'fracture detected',
  'fracture confirmed',
  'confirms fracture',
  'no fracture',
  'rules out fracture',
  'probability of fracture',
  'safe to return to sport',
  'ai detected a fracture',
  'replaces radiology',
  'replaces x-ray',
  'x-ray parity',
  'x-ray equivalent',
  'equivalent to radiography',
  'diagnostic equivalence',
  'diagnose fracture',
  'clinical diagnosis',
  'home self-diagnosis',
  'consumer self-diagnosis',
];

const ALLOWED_SNIPPETS = [
  'RESEARCH USE ONLY — Not for diagnostic procedures.',
  'Non-ionizing investigational acquisition. Not a substitute for X-ray or clinical judgment.',
  'Investigational research data. Performance characteristics for fracture diagnosis have not been established. Contains non-ionizing sensor outputs only.',
  'Not for diagnostic procedures',
  'Not a substitute for X-ray or clinical judgment',
  'Research Use Only',
  'For Research Use Only. Not for use in diagnostic procedures.',
];

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.md',
  '.html',
  '.css',
  '.json',
]);

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskAllowed(text) {
  let masked = text;
  for (const snippet of ALLOWED_SNIPPETS) {
    masked = masked.replace(new RegExp(escapeRegExp(snippet), 'gi'), (m) =>
      ' '.repeat(m.length),
    );
  }
  return masked;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) {
      continue;
    }
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, files);
      continue;
    }
    if (SCAN_EXTENSIONS.has(extname(name))) {
      files.push(path);
    }
  }
  return files;
}

function findHits(text) {
  const masked = maskAllowed(text).toLowerCase();
  const hits = [];
  for (const phrase of FORBIDDEN_PHRASES) {
    let from = 0;
    const needle = phrase.toLowerCase();
    while (from < masked.length) {
      const index = masked.indexOf(needle, from);
      if (index === -1) {
        break;
      }
      hits.push({ phrase, index });
      from = index + needle.length;
    }
  }
  return hits;
}

const files = walk(root).filter((path) => {
  const rel = relative(root, path);
  // Do not lint the phrase list definitions themselves for containing the phrases.
  return (
    rel !== 'src/claim-lint/forbiddenPhrases.ts' &&
    rel !== 'scripts/claim-lint.mjs' &&
    !rel.startsWith('tests/')
  );
});

let failed = false;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const hits = findHits(text);
  if (hits.length === 0) {
    continue;
  }
  failed = true;
  const rel = relative(root, file);
  console.error(`FAIL ${rel}`);
  for (const hit of hits) {
    const start = Math.max(0, hit.index - 20);
    const excerpt = text
      .slice(start, hit.index + hit.phrase.length + 20)
      .replace(/\s+/g, ' ')
      .trim();
    console.error(`  - "${hit.phrase}" near: ${excerpt}`);
  }
}

if (failed) {
  console.error('\nE8 claim lint failed. Remove forbidden clinical/claims phrasing.');
  process.exit(1);
}

console.log(`E8 claim lint OK (${files.length} files scanned).`);
