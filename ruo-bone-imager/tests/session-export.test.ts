import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gapWidthMm } from '../src/annotation/geometry.ts';
import { buildExportBundle, buildZipBytes } from '../src/export/packager.ts';
import {
  createSampleSession,
  DEFAULT_PROTOCOL_ID,
  metaGateErrors,
} from '../src/session/sampleSession.ts';
import { RUO_BANNER_VERSION } from '../src/claim-lint/forbiddenPhrases.ts';

describe('S0 session defaults', () => {
  it('defaults protocol_id to PHANTOM-TIBIA-v1', () => {
    const session = createSampleSession();
    assert.equal(session.meta.protocol_id, DEFAULT_PROTOCOL_ID);
    assert.equal(session.meta.banner_version, RUO_BANNER_VERSION);
    assert.ok(session.frames.length >= 1);
  });

  it('accepts optional dual_mod_id', () => {
    const session = createSampleSession({ dual_mod_id: 'DUAL-MW-US-E3-v1' });
    assert.equal(session.meta.dual_mod_id, 'DUAL-MW-US-E3-v1');
  });

  it('metadata gate requires core fields', () => {
    const session = createSampleSession({ protocol_id: '', operator_id: '' });
    const errors = metaGateErrors(session.meta);
    assert.ok(errors.some((e) => e.includes('protocol_id')));
    assert.ok(errors.some((e) => e.includes('operator_id')));
  });
});

describe('S2 gap caliper math', () => {
  it('converts pixel span to mm with calibration', () => {
    assert.ok(
      Math.abs(gapWidthMm({ x: 100, y: 200 }, { x: 140, y: 200 }, 0.05) - 2.0) < 1e-9,
    );
  });
});

describe('S0 export stub', () => {
  it('builds manifest with RUO notice and annotations.json', () => {
    const session = createSampleSession();
    const frameId = session.frames[0].frame_id;
    session.annotations_by_frame[frameId] = [
      {
        id: 'gap-1',
        kind: 'gap_caliper',
        a: { x: 10, y: 10 },
        b: { x: 50, y: 10 },
        width_mm: 2,
        annotator_id: 'op',
        created_at: '2026-11-12T00:00:00.000Z',
        source_modality: 'us_bone_interface',
        source: 'human',
        tag: 'possible_gap',
      },
    ];
    const bundle = buildExportBundle(session);
    assert.match(String(bundle.manifest.ruo_notice), /RESEARCH USE ONLY/i);
    assert.equal(bundle.annotations.annotations.length, 1);
    assert.ok(bundle.files['annotations.json'].includes('gap_caliper'));
    assert.ok(bundle.files['qc.json']);
  });

  it('builds a zip byte payload with local file headers', () => {
    const bytes = buildZipBytes({ 'hello.txt': 'hi' });
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
    assert.ok(bytes.length > 30);
  });
});
