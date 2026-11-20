import { Vec2 } from '@wifi-planner/shared-types';

export interface RayHit {
  t: number;
  u: number;
}

/**
 * Intersección rayo-segmento (especificación sección 7.2)
 * Rayo: o + t·d (t > 0). Segmento: a + u·(b - a), u ∈ [0, 1]
 */
export function raySegment(o: Vec2, d: Vec2, a: Vec2, b: Vec2): RayHit | null {
  const e = { x: b.x - a.x, y: b.y - a.y };
  const denom = d.x * e.y - d.y * e.x; // d × e
  if (Math.abs(denom) < 1e-12) return null; // paralelos

  const ao = { x: a.x - o.x, y: a.y - o.y };
  const t = (ao.x * e.y - ao.y * e.x) / denom;
  const u = (ao.x * d.y - ao.y * d.x) / denom;
  const EPS = 1e-9; // tolerancia en extremos

  return t > EPS && u >= -EPS && u <= 1 + EPS ? { t, u } : null;
}

/**
 * Intersección segmento-segmento: [p1, p2] y [q1, q2]
 */
export function segmentSegment(
  p1: Vec2,
  p2: Vec2,
  q1: Vec2,
  q2: Vec2
): { hit: boolean; pt?: Vec2; t?: number; u?: number } {
  const d = { x: p2.x - p1.x, y: p2.y - p1.y };
  const len = Math.hypot(d.x, d.y);
  if (len < 1e-12) return { hit: false };

  const dir = { x: d.x / len, y: d.y / len };
  const hit = raySegment(p1, dir, q1, q2);

  if (hit && hit.t <= len + 1e-9) {
    return {
      hit: true,
      pt: { x: p1.x + dir.x * hit.t, y: p1.y + dir.y * hit.t },
      t: hit.t / len,
      u: hit.u
    };
  }
  return { hit: false };
}
