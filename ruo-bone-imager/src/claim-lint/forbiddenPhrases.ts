/**
 * Shared forbidden-phrase list for E8 claim linting.
 * Sourced from Project safety policy: docs/bone-imaging-safety-claims.md
 * (Project store path: .../docs/bone-imaging-safety-claims.md).
 *
 * UI and export copy must not contain these strings (case-insensitive).
 * The official RUO banner is allowlisted separately.
 */

export const RUO_BANNER_LINES = [
  'RESEARCH USE ONLY — Not for diagnostic procedures.',
  'Non-ionizing investigational acquisition. Not a substitute for X-ray or clinical judgment.',
] as const;

export const RUO_BANNER_TEXT = RUO_BANNER_LINES.join('\n');

export const RUO_BANNER_VERSION = 'ruo-banner-1.0.0';

export const EXPORT_WATERMARK =
  'Investigational research data. Performance characteristics for fracture diagnosis have not been established. Contains non-ionizing sensor outputs only.';

/** Phrases that must never appear in product UI / README / decks (E8). */
export const FORBIDDEN_PHRASES: readonly string[] = [
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
] as const;

/** Official RUO copy that may mention X-ray / diagnostic in allowed framing. */
export const ALLOWED_CLAIM_SNIPPETS: readonly string[] = [
  RUO_BANNER_LINES[0],
  RUO_BANNER_LINES[1],
  EXPORT_WATERMARK,
  'Not for diagnostic procedures',
  'Not a substitute for X-ray or clinical judgment',
  'Research Use Only',
  'For Research Use Only. Not for use in diagnostic procedures.',
] as const;
