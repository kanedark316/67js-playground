import {
  EXPORT_WATERMARK,
  RUO_BANNER_TEXT,
  RUO_BANNER_VERSION,
} from '../claim-lint/forbiddenPhrases.ts';
import type {
  AnnotationsDoc,
  QcForm,
  ResearchSession,
} from '../session/types.ts';

export type ExportBundle = {
  manifest: Record<string, unknown>;
  meta: ResearchSession['meta'];
  annotations: AnnotationsDoc;
  qc: QcForm;
  software_versions: Record<string, string>;
  files: Record<string, string>;
};

export function buildExportBundle(session: ResearchSession): ExportBundle {
  const frame = session.frames[session.current_frame_index];
  const annotations = session.annotations_by_frame[frame.frame_id] ?? [];

  const annotationsDoc: AnnotationsDoc = {
    schema_version: '1.0.0',
    session_id: session.meta.session_id,
    frame_id: frame.frame_id,
    mm_per_px: frame.mm_per_px,
    annotations,
  };

  const software_versions = {
    app: session.meta.software_version,
    banner: session.meta.banner_version || RUO_BANNER_VERSION,
  };

  const manifest = {
    schema_version: '1.0.0',
    session_id: session.meta.session_id,
    ruo_notice: RUO_BANNER_TEXT,
    export_watermark: EXPORT_WATERMARK,
    banner_version: software_versions.banner,
    created_at: new Date().toISOString(),
    frame_count: session.frames.length,
    annotation_count: annotations.length,
    dual_mod_id: session.meta.dual_mod_id ?? null,
    protocol_id: session.meta.protocol_id,
  };

  const files: Record<string, string> = {
    'manifest.json': JSON.stringify(manifest, null, 2),
    'meta.json': JSON.stringify(session.meta, null, 2),
    'annotations.json': JSON.stringify(annotationsDoc, null, 2),
    'qc.json': JSON.stringify(session.qc, null, 2),
    'software_versions.json': JSON.stringify(software_versions, null, 2),
    'derived/frames/README.txt':
      'Sample fixture frames ship under public/fixtures/cine/. Live probe drivers are out of scope for Phase 1.',
  };

  return {
    manifest,
    meta: session.meta,
    annotations: annotationsDoc,
    qc: session.qc,
    software_versions,
    files,
  };
}

/** Minimal ZIP (store / no compression) for browser download stub. */
export function buildZipBytes(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const entries: {
    name: string;
    data: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  let localParts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const data = encoder.encode(content);
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(8, 0, true); // store
    view.setUint16(26, nameBytes.length, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    localHeader.set(nameBytes, 30);

    entries.push({ name, data, crc, offset });
    localParts.push(localHeader, data);
    offset += localHeader.length + data.length;
  }

  const centralParts: Uint8Array[] = [];
  let centralSize = 0;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const central = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(central.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.data.length, true);
    view.setUint32(24, entry.data.length, true);
    view.setUint32(42, entry.offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    centralSize += central.length;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concatBytes([...localParts, ...centralParts, end]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
