import { Vec2 } from '@wifi-planner/shared-types';
import { distSq } from './vec2.js';

export function snapToGrid(pt: Vec2, step: number): Vec2 {
  if (step <= 0) return pt;
  return {
    x: Math.round(pt.x / step) * step,
    y: Math.round(pt.y / step) * step
  };
}

export function snapToPoints(pt: Vec2, points: Vec2[], threshold: number): { pt: Vec2; snapped: boolean } {
  let closest: Vec2 | null = null;
  let minDistSq = threshold * threshold;

  for (const p of points) {
    const dSq = distSq(pt, p);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      closest = p;
    }
  }

  if (closest) {
    return { pt: closest, snapped: true };
  }
  return { pt, snapped: false };
}

export function snapAngle(start: Vec2, current: Vec2, angleStepDeg: number = 45): Vec2 {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return current;

  const currentAngleRad = Math.atan2(dy, dx);
  const stepRad = (angleStepDeg * Math.PI) / 180;
  const snappedAngle = Math.round(currentAngleRad / stepRad) * stepRad;

  return {
    x: start.x + len * Math.cos(snappedAngle),
    y: start.y + len * Math.sin(snappedAngle)
  };
}
