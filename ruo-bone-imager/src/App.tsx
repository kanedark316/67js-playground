import { useEffect, useMemo, useState } from 'react';
import {
  EXPORT_WATERMARK,
} from './claim-lint/forbiddenPhrases.ts';
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
    return JSON.parse(raw) as ResearchSession;
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
  }

  function exportZip() {
    const bundle = buildExportBundle(session);
    const bytes = buildZipBytes(bundle.files);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: 'application/zip' });
    downloadBlob(`${session.meta.session_id}-export.zip`, blob);
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
        <div className="brand-row">
          <div>
            <h1>RUO Bone Imager</h1>
            <p>
              Phase-1 research shell for cortical-interface review on
              PHANTOM-TIBIA-v1 fixtures. Non-ionizing acquisition stubs only — no
              diagnose CTA, no live probe drivers.
            </p>
          </div>
        </div>

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
            <SessionForm
              meta={session.meta}
              gateErrors={gateErrors}
              onChange={(meta) => updateSession({ ...session, meta })}
              onNewSession={() => {
                const next = createSampleSession({
                  operator_id: session.meta.operator_id,
                });
                next.ruo_acknowledged = true;
                updateSession(next);
              }}
            />

            <section className="panel">
              <h2>Capture chrome (fixture)</h2>
              <p className="muted">
                Fake B-mode cine stub for offline demo. Hardware adapters are deferred.
              </p>
              <div className="btn-row">
                <button
                  type="button"
                  className="secondary"
                  disabled={gated}
                  onClick={() =>
                    updateSession({
                      ...session,
                      current_frame_index: Math.max(0, session.current_frame_index - 1),
                    })
                  }
                >
                  Prev frame
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={gated}
                  onClick={() => setCinePlaying((v) => !v)}
                >
                  {cinePlaying ? 'Pause cine' : 'Play cine stub'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={gated}
                  onClick={() =>
                    updateSession({
                      ...session,
                      current_frame_index:
                        (session.current_frame_index + 1) % session.frames.length,
                    })
                  }
                >
                  Next frame
                </button>
              </div>
            </section>

            <div className="grid-two">
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

              <div>
                <section className="panel">
                  <h2>Bone tools (S2)</h2>
                  <div className="btn-row">
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
                      Clear frame annotations
                    </button>
                  </div>
                  <label style={{ marginTop: '0.75rem' }}>
                    annotation tag
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value as AnnotationTag)}
                    >
                      <option value="step-off">step-off</option>
                      <option value="possible_gap">possible_gap</option>
                      <option value="uncertain">uncertain</option>
                      <option value="artifact_suspected">artifact_suspected</option>
                    </select>
                  </label>
                  <ul className="muted">
                    {annotations.length === 0 ? (
                      <li>No annotations on this frame yet.</li>
                    ) : (
                      annotations.map((ann) => (
                        <li key={ann.id}>
                          <span className="tag-chip">{ann.kind}</span>
                          {ann.kind === 'gap_caliper'
                            ? `${ann.width_mm.toFixed(2)} mm · ${ann.tag}`
                            : `${ann.points.length} pts${ann.tag ? ` · ${ann.tag}` : ''}`}
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
                  <h2>Export (S0 stub)</h2>
                  <p className="muted">{EXPORT_WATERMARK}</p>
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
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
