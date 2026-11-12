import { RUO_BANNER_VERSION } from '../claim-lint/forbiddenPhrases.ts';
import { randomToken, safeFixtureSrc } from '../util/security.ts';
import type { FrameStub, ResearchSession, SessionMeta } from './types.ts';

export const SOFTWARE_VERSION = '0.1.0';

export const DEFAULT_PROTOCOL_ID = 'PHANTOM-TIBIA-v1';
export const DEFAULT_DUAL_MOD_ID = 'DUAL-MW-US-E3-v1';

const FRAME_WIDTH = 640;
const FRAME_HEIGHT = 400;
/** Synthetic fixture scale: ~0.05 mm/px → ~32 mm FOV width. */
const MM_PER_PX = 0.05;

export function createSampleFrames(): FrameStub[] {
  return [0, 1, 2, 3].map((index) => ({
    frame_id: `frame-${index}`,
    index,
    path: safeFixtureSrc(`/fixtures/cine/frame-${index}.svg`),
    width_px: FRAME_WIDTH,
    height_px: FRAME_HEIGHT,
    mm_per_px: MM_PER_PX,
  }));
}

export function createSessionId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `sess-${stamp}-${randomToken(4)}`;
}

/** Re-bind fixture paths after localStorage load so img.src stays allowlisted. */
export function sanitizeLoadedSession(session: ResearchSession): ResearchSession {
  return {
    ...session,
    frames: session.frames.map((frame) => ({
      ...frame,
      path: safeFixtureSrc(frame.path),
    })),
  };
}

export function createDefaultMeta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    session_id: createSessionId(),
    protocol_id: DEFAULT_PROTOCOL_ID,
    dual_mod_id: undefined,
    modality: 'us_bone_interface',
    anatomical_site: 'anteromedial_tibia',
    laterality: 'NA',
    subject_id: 'phantom-demo-001',
    operator_id: 'operator-demo',
    acoustic_or_rf_budget_id: 'us-diagnostic-class-stub-v1',
    reference_imaging: 'none',
    consent_flag: false,
    phantom_serial: 'PHANTOM-TIBIA-v1-DEMO',
    created_at: new Date().toISOString(),
    software_version: SOFTWARE_VERSION,
    banner_version: RUO_BANNER_VERSION,
    ...overrides,
  };
}

export function createEmptyQc() {
  return {
    coupling_ok: null,
    landmark_visible: null,
    motion_acceptable: null,
    cortical_line_qc: null,
    notes: '',
  } as const;
}

export function createSampleSession(
  overrides: Partial<SessionMeta> = {},
): ResearchSession {
  const meta = createDefaultMeta(overrides);
  const frames = createSampleFrames();
  return {
    meta,
    frames,
    current_frame_index: 0,
    annotations_by_frame: Object.fromEntries(frames.map((f) => [f.frame_id, []])),
    qc: {
      coupling_ok: null,
      landmark_visible: null,
      motion_acceptable: null,
      cortical_line_qc: null,
      notes: '',
    },
    ruo_acknowledged: false,
  };
}

export function metaGateErrors(meta: SessionMeta): string[] {
  const errors: string[] = [];
  if (!meta.protocol_id.trim()) {
    errors.push('protocol_id is required (e.g. PHANTOM-TIBIA-v1)');
  }
  if (!meta.anatomical_site.trim()) {
    errors.push('anatomical_site is required');
  }
  if (!meta.laterality) {
    errors.push('laterality is required (L / R / NA)');
  }
  if (!meta.subject_id.trim()) {
    errors.push('subject_id is required (pseudonym)');
  }
  if (!meta.operator_id.trim()) {
    errors.push('operator_id is required');
  }
  if (!meta.acoustic_or_rf_budget_id.trim()) {
    errors.push('acoustic_or_rf_budget_id is required');
  }
  return errors;
}
