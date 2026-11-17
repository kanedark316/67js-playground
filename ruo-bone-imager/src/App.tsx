import { useEffect, useMemo, useState } from 'react';
import { EXPORT_WATERMARK } from './claim-lint/forbiddenPhrases.ts';
import { RuoBanner } from './components/RuoBanner.tsx';
import { RuoSplash } from './components/RuoSplash.tsx';
import { QcForm } from './components/QcForm.tsx';
import { SessionForm } from './components/SessionForm.tsx';
import { Viewer, type ToolMode } from './components/Viewer.tsx';
import {
  buildExportBundle,
  buildZipBytes,
  downloadBlob,
} from './export/packager.ts';
import {
  createSampleSession,
  metaGateErrors,
  sanitizeLoadedSession,
} from './session/sampleSession.ts';
import type {
  Annotation,
  AnnotationTag,
  ResearchSession,
} from './session/types.ts';

const STORAGE_KEY = 'ruo-bone-imager.session.v1';

function loadSession(): ResearchSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return sanitizeLoadedSession(JSON.parse(raw) as ResearchSession);
  } catch {
    return null;
  }
}

function saveSession(session: ResearchSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export default function App() {
  const [session, setSession] = useState<ResearchSession>(
    () => loadSession() ?? createSampleSession(),
  );
  const [splashScrollDone, setSplashScrollDone] = useState(false);
  const [splashChecked, setSplashChecked] = useState(false);
  const [tool, setTool] = useState<ToolMode>('cortical');
  const [tag, setTag] = useState<AnnotationTag>('possible_gap');
  const [cinePlaying, setCinePlaying] = useState(false);
  const [lastExportNote, setLastExportNote] = useState<string | null>(null);

  const gateErrors = useMemo(
    () => metaGateErrors(session.meta),
    [session.meta],
  );
  const gated = gateErrors.length > 0;
  const frame = session.frames[session.current_frame_index];
  const annotations = session.annotations_by_frame[frame.frame_id] ?? [];

  function updateSession(next: ResearchSession) {
    setSession(next);
    saveSession(next);
  }

  function setAnnotations(next: Annotation[]) {
    updateSession({
      ...session,
      annotations_by_frame: {
        ...session.annotations_by_frame,
        [frame.frame_id]: next,
      },
    });
  }

  function exportJson() {
    const bundle = buildExportBundle(session);
    const blob = new Blob([JSON.stringify(bundle.files, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(`${session.meta.session_id}-export.json`, blob);
    setLastExportNote(
      `JSON map written · ${Object.keys(bundle.files).length} files · frame ${frame.frame_id}`,
    );
  }

  function exportZip() {
    const bundle = buildExportBundle(session);
    const bytes = buildZipBytes(bundle.files);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: 'application/zip' });
    downloadBlob(`${session.meta.session_id}-export.zip`, blob);
    setLastExportNote(
      `ZIP package · ${bytes.byteLength} bytes · ${annotations.length} annotations on ${frame.frame_id}`,
    );
  }

  useEffect(() => {
    if (!cinePlaying) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setSession((prev) => {
        const nextIndex = (prev.current_frame_index + 1) % prev.frames.length;
        const next = { ...prev, current_frame_index: nextIndex };
        saveSession(next);
        return next;
      });
    }, 450);
    return () => window.clearInterval(id);
  }, [cinePlaying]);

  return (
    <>
      <RuoBanner />
      <div className="app-shell">
        {!session.ruo_acknowledged ? (
          <RuoSplash
            scrolled={splashScrollDone}
            checked={splashChecked}
            onScroll={setSplashScrollDone}
            onCheck={setSplashChecked}
            onContinue={() =>
              updateSession({ ...session, ruo_acknowledged: true })
            }
          />
        ) : (
          <>
            <header className="workspace-top">
              <div className="brand-mark">
                <h1 className="product">
                  RUO <em>Bone</em> Imager
                </h1>
                <p className="lede">
                  Bone-interface ultrasound research workspace. Annotate cortical
                  polylines and gap calipers on PHANTOM-TIBIA-v1 fixtures, then
                  export an auditable package.
                </p>
              </div>
              <div className="session-chip-row">
                <span className="meta-chip">
                  protocol <strong>{session.meta.protocol_id}</strong>
                </span>
                <span className="meta-chip">
                  modality <strong>{session.meta.modality}</strong>
                </span>
                <span className="meta-chip">
                  frame{' '}
                  <strong>
                    {session.current_frame_index + 1}/{session.frames.length}
                  </strong>
                </span>
              </div>
            </header>

            <SessionForm
              meta={session.meta}
              gateErrors={gateErrors}
              onChange={(meta) => updateSession({ ...session, meta })}
              onNewSession={() => {
                const next = createSampleSession({
                  operator_id: session.meta.operator_id,
                });
                next.ruo_acknowledged = true;
                setCinePlaying(false);
                setLastExportNote(null);
                updateSession(next);
              }}
            />

            <div className="workspace-grid">
              <div className="viewer-stage">
                <section className="panel">
                  <div className="viewer-toolbar">
                    <h2 style={{ margin: 0 }}>Fixture B-mode stage</h2>
                    <div className="cine-rail">
                      <button
                        type="button"
                        className="secondary"
                        disabled={gated}
                        onClick={() =>
                          updateSession({
                            ...session,
                            current_frame_index: Math.max(
                              0,
                              session.current_frame_index - 1,
                            ),
                          })
                        }
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={gated}
                        onClick={() => setCinePlaying((v) => !v)}
                      >
                        {cinePlaying ? 'Pause cine' : 'Play cine'}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={gated}
                        onClick={() =>
                          updateSession({
                            ...session,
                            current_frame_index:
                              (session.current_frame_index + 1) %
                              session.frames.length,
                          })
                        }
                      >
                        Next
                      </button>
                      <div className="frame-dots" aria-label="Frame selector">
                        {session.frames.map((f, index) => (
                          <button
                            key={f.frame_id}
                            type="button"
                            className={`frame-dot ${
                              index === session.current_frame_index
                                ? 'active'
                                : ''
                            }`}
                            disabled={gated}
                            title={f.frame_id}
                            aria-label={`Show ${f.frame_id}`}
                            onClick={() =>
                              updateSession({
                                ...session,
                                current_frame_index: index,
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="muted" style={{ marginTop: '0.55rem' }}>
                    Synthetic cine stills — offline demo without a probe. Depth
                    scale and probe glyph are research chrome only.
                  </p>
                </section>

                <Viewer
                  frame={frame}
                  annotations={annotations}
                  tool={tool}
                  tag={tag}
                  modality={session.meta.modality}
                  operatorId={session.meta.operator_id}
                  disabled={gated}
                  onAnnotationsChange={setAnnotations}
                />
              </div>

              <aside className="side-stack">
                <section className="panel">
                  <h2>Bone tools</h2>
                  <p className="muted">
                    Cortical polyline and gap caliper for discontinuity
                    candidates. Tags are operator research labels only.
                  </p>
                  <div className="btn-row" style={{ marginTop: '0.55rem' }}>
                    <button
                      type="button"
                      className={`tool ${tool === 'cortical' ? 'active' : ''}`}
                      disabled={gated}
                      onClick={() => setTool('cortical')}
                    >
                      Cortical polyline
                    </button>
                    <button
                      type="button"
                      className={`tool ${tool === 'caliper' ? 'active' : ''}`}
                      disabled={gated}
                      onClick={() => setTool('caliper')}
                    >
                      Gap caliper
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      disabled={gated || annotations.length === 0}
                      onClick={() => setAnnotations([])}
                    >
                      Clear frame
                    </button>
                  </div>
                  <label style={{ marginTop: '0.75rem' }}>
                    annotation tag
                    <select
                      value={tag}
                      onChange={(e) =>
                        setTag(e.target.value as AnnotationTag)
                      }
                    >
                      <option value="step-off">step-off</option>
                      <option value="possible_gap">possible_gap</option>
                      <option value="uncertain">uncertain</option>
                      <option value="artifact_suspected">
                        artifact_suspected
                      </option>
                    </select>
                  </label>
                  <ul className="annotation-list">
                    {annotations.length === 0 ? (
                      <li>No annotations on this frame yet.</li>
                    ) : (
                      annotations.map((ann) => (
                        <li key={ann.id}>
                          <span className="tag-chip">{ann.kind}</span>
                          {ann.kind === 'gap_caliper'
                            ? `${ann.width_mm.toFixed(2)} mm · ${ann.tag}`
                            : `${ann.points.length} pts${
                                ann.tag ? ` · ${ann.tag}` : ''
                              }`}
                        </li>
                      ))
                    )}
                  </ul>
                </section>

                <QcForm
                  qc={session.qc}
                  onChange={(qc) => updateSession({ ...session, qc })}
                />

                <section className="panel">
                  <h2>Export package</h2>
                  <p className="export-note">{EXPORT_WATERMARK}</p>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="primary"
                      disabled={gated}
                      onClick={exportZip}
                    >
                      Export ZIP
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={gated}
                      onClick={exportJson}
                    >
                      Export JSON map
                    </button>
                  </div>
                  {lastExportNote ? (
                    <p className="muted" style={{ marginTop: '0.65rem' }}>
                      {lastExportNote}
                    </p>
                  ) : null}
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </>
  );
}
