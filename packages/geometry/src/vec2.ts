import { Vec2 } from '@wifi-planner/shared-types';

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const div = (a: Vec2, s: number): Vec2 => ({ x: a.x / s, y: a.y / s });

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;

export const lengthSq = (a: Vec2): number => a.x * a.x + a.y * a.y;
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);
export const distSq = (a: Vec2, b: Vec2): number => lengthSq(sub(a, b));
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

export const norm = (a: Vec2): Vec2 => {
  const len = Math.hypot(a.x, a.y);
  return len > 1e-12 ? { x: a.x / len, y: a.y / len } : { x: 0, y: 0 };
};

/**
 * Returns a unit normal vector perpendicular to segment (a -> b)
 */
export const segmentNormal = (a: Vec2, b: Vec2): Vec2 => {
  const d = sub(b, a);
  const n = { x: -d.y, y: d.x };
  return norm(n);
};

/**
 * Mirrors a point P across the line defined by segment (a, b)
 */
export const mirrorPoint = (p: Vec2, a: Vec2, b: Vec2): Vec2 => {
  const e = norm(sub(b, a));
  const proj = add(a, mul(e, dot(sub(p, a), e))); // pie de la perpendicular
  return sub(mul(proj, 2), p);                   // 2*proj - p
};
