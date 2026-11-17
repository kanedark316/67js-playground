#!/usr/bin/env node
/**
 * CI audit gate: fail on high/critical advisories, with a narrow allowlist for
 * advisories that still have no patched upstream release.
 *
 * Remove an entry once npm/GitHub Advisory lists a first_patched_version and
 * Dependabot (or a manual bump) can clear it.
 */
import { spawnSync } from 'node:child_process';

/** Advisories with no patched release yet (verify before extending). */
const UNPATCHED_ALLOWLIST = new Map([
  [
    'GHSA-fc5q-39xc-vjpf',
    'picomatch <=4.0.7 ReDoS; no patched npm release (CVE-2026-112366). Pulled in by vite via tinyglobby/fdir. Do not force-downgrade vite to 6.x.',
  ],
]);

const result = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch (error) {
  console.error('ci-audit: failed to parse npm audit JSON');
  console.error(error);
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const blocking = [];
const allowed = [];

for (const [name, entry] of Object.entries(vulnerabilities)) {
  const severity = entry.severity;
  if (severity !== 'high' && severity !== 'critical') {
    continue;
  }
  if (isAllowedByUnpatchedList(entry, vulnerabilities, new Set())) {
    allowed.push({ name, severity, reason: describeAllowReason(entry) });
    continue;
  }
  blocking.push({ name, severity, via: summarizeVia(entry.via) });
}

if (allowed.length > 0) {
  console.log('ci-audit: allowing unpatched high/critical advisories:');
  for (const item of allowed) {
    console.log(`  - ${item.name} (${item.severity}): ${item.reason}`);
  }
}

if (blocking.length > 0) {
  console.error('ci-audit: blocking high/critical advisories:');
  for (const item of blocking) {
    console.error(`  - ${item.name} (${item.severity}): ${item.via}`);
  }
  console.error('Run `npm audit --audit-level=high` for details.');
  process.exit(1);
}

console.log('ci-audit: OK (no blocking high/critical advisories).');
process.exit(0);

function isAllowedByUnpatchedList(entry, all, seen) {
  for (const item of entry.via ?? []) {
    if (typeof item === 'string') {
      if (seen.has(item)) {
        continue;
      }
      seen.add(item);
      const parent = all[item];
      if (!parent) {
        return false;
      }
      if (!isAllowedByUnpatchedList(parent, all, seen)) {
        return false;
      }
      continue;
    }
    const ghsa = ghsaFromVia(item);
    if (!ghsa || !UNPATCHED_ALLOWLIST.has(ghsa)) {
      return false;
    }
  }
  return (entry.via ?? []).length > 0;
}

function describeAllowReason(entry) {
  for (const item of entry.via ?? []) {
    if (typeof item === 'object' && item) {
      const ghsa = ghsaFromVia(item);
      if (ghsa && UNPATCHED_ALLOWLIST.has(ghsa)) {
        return `${ghsa} — ${UNPATCHED_ALLOWLIST.get(ghsa)}`;
      }
    }
  }
  return 'transitive of allowlisted unpatched advisory';
}

function ghsaFromVia(item) {
  const url = typeof item?.url === 'string' ? item.url : '';
  const match = url.match(/GHSA-[\w-]+/);
  return match ? match[0] : null;
}

function summarizeVia(via) {
  return (via ?? [])
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      return ghsaFromVia(item) || item?.title || 'unknown';
    })
    .join(', ');
}
