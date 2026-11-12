import type { PointPx } from '../session/types.ts';

export function distancePx(a: PointPx, b: PointPx): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function gapWidthMm(
  a: PointPx,
  b: PointPx,
  mmPerPx: number,
): number {
  if (!(mmPerPx > 0)) {
    throw new Error('mm_per_px must be a positive number for calibrated gap width');
  }
  return distancePx(a, b) * mmPerPx;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
