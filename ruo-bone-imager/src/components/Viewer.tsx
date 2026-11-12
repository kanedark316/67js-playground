import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createId, gapWidthMm } from '../annotation/geometry.ts';
import type {
  Annotation,
  AnnotationTag,
  FrameStub,
  GapCaliper,
  Modality,
  PointPx,
} from '../session/types.ts';
import { safeFixtureSrc, safeLabel } from '../util/security.ts';

export type ToolMode = 'pan' | 'cortical' | 'caliper';

type Props = {
  frame: FrameStub;
  annotations: Annotation[];
  tool: ToolMode;
  tag: AnnotationTag;
  modality: Modality;
  operatorId: string;
  disabled?: boolean;
  onAnnotationsChange: (next: Annotation[]) => void;
};

function toImagePoint(
  event: ReactPointerEvent<HTMLDivElement>,
  wrap: HTMLDivElement,
  frame: FrameStub,
): PointPx {
  const rect = wrap.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * frame.width_px;
  const y = ((event.clientY - rect.top) / rect.height) * frame.height_px;
  return {
    x: Math.max(0, Math.min(frame.width_px, x)),
    y: Math.max(0, Math.min(frame.height_px, y)),
  };
}

export function Viewer({
  frame,
  annotations,
  tool,
  tag,
  modality,
  operatorId,
  disabled,
  onAnnotationsChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draftPoints, setDraftPoints] = useState<PointPx[]>([]);
  const [caliperStart, setCaliperStart] = useState<PointPx | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) {
      return;
    }
    canvas.width = frame.width_px;
    canvas.height = frame.height_px;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const ann of annotations) {
      if (ann.kind === 'cortical_polyline') {
        drawPolyline(ctx, ann.points, '#7dffb0', 2);
      } else {
        drawCaliper(ctx, ann.a, ann.b, ann.width_mm);
      }
    }

    if (draftPoints.length) {
      drawPolyline(ctx, draftPoints, '#9effc8', 2, true);
    }
    if (caliperStart) {
      ctx.fillStyle = '#ffc857';
      ctx.beginPath();
      ctx.arc(caliperStart.x, caliperStart.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [annotations, draftPoints, caliperStart, frame]);

  function finishPolyline() {
    if (draftPoints.length < 2) {
      setDraftPoints([]);
      return;
    }
    const next: Annotation = {
      id: createId('poly'),
      kind: 'cortical_polyline',
      points: draftPoints,
      annotator_id: operatorId,
      created_at: new Date().toISOString(),
      source_modality: modality,
      source: 'human',
      tag,
    };
    onAnnotationsChange([...annotations, next]);
    setDraftPoints([]);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !wrapRef.current || tool === 'pan') {
      return;
    }
    const point = toImagePoint(event, wrapRef.current, frame);
    if (tool === 'cortical') {
      setDraftPoints((prev) => [...prev, point]);
      return;
    }
    if (!caliperStart) {
      setCaliperStart(point);
      return;
    }
    const width = gapWidthMm(caliperStart, point, frame.mm_per_px);
    const caliper: GapCaliper = {
      id: createId('gap'),
      kind: 'gap_caliper',
      a: caliperStart,
      b: point,
      width_mm: Number(width.toFixed(3)),
      annotator_id: operatorId,
      created_at: new Date().toISOString(),
      source_modality: modality,
      source: 'human',
      tag,
    };
    onAnnotationsChange([...annotations, caliper]);
    setCaliperStart(null);
  }

  return (
    <section className="panel">
      <h2>B-mode viewer (fixture / cine stub)</h2>
      <p className="muted">
        Sample synthetic frames — no live probe driver in this build. Depth scale and
        probe glyph are research chrome only.
      </p>
      <div
        className="viewer-wrap"
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onDoubleClick={() => {
          if (tool === 'cortical') {
            finishPolyline();
          }
        }}
      >
        <img
          src={safeFixtureSrc(frame.path)}
          alt={`Sample B-mode ${safeLabel(frame.frame_id)}`}
          draggable={false}
        />
        <canvas ref={canvasRef} />
        <div className="depth-scale" aria-hidden="true" />
        <div className="probe-glyph" aria-hidden="true" />
      </div>
      <div className="viewer-meta">
        <span>
          {frame.frame_id} · {frame.width_px}×{frame.height_px} · {frame.mm_per_px} mm/px
        </span>
        <span>
          {tool === 'cortical'
            ? 'Click points · double-click to finish polyline'
            : tool === 'caliper'
              ? 'Click two points for gap caliper'
              : 'Select a bone tool to annotate'}
        </span>
      </div>
      {draftPoints.length > 0 ? (
        <div className="btn-row">
          <button type="button" className="secondary" onClick={finishPolyline}>
            Finish cortical polyline ({draftPoints.length} pts)
          </button>
          <button type="button" className="ghost" onClick={() => setDraftPoints([])}>
            Cancel draft
          </button>
        </div>
      ) : null}
      {caliperStart ? (
        <div className="btn-row">
          <button type="button" className="ghost" onClick={() => setCaliperStart(null)}>
            Cancel caliper start
          </button>
        </div>
      ) : null}
    </section>
  );
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: PointPx[],
  color: string,
  width: number,
  dashed = false,
) {
  if (points.length === 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (dashed) {
    ctx.setLineDash([6, 4]);
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCaliper(
  ctx: CanvasRenderingContext2D,
  a: PointPx,
  b: PointPx,
  widthMm: number,
) {
  ctx.save();
  ctx.strokeStyle = '#ffc857';
  ctx.fillStyle = '#ffc857';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  for (const p of [a, b]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  ctx.font = '14px IBM Plex Mono, monospace';
  ctx.fillText(`${widthMm.toFixed(2)} mm`, midX + 6, midY - 6);
  ctx.restore();
}
