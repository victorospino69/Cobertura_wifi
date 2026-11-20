import { Vec2, Wall } from '@wifi-planner/shared-types';

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const createAABB = (minX: number, minY: number, maxX: number, maxY: number): AABB => ({
  minX,
  minY,
  maxX,
  maxY
});

export const aabbOverlap = (a: AABB, b: AABB): boolean => {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
};

export const wallAABB = (w: Wall): AABB => {
  const pad = w.thickness ? w.thickness / 2 : 0.05;
  return {
    minX: Math.min(w.a.x, w.b.x) - pad,
    minY: Math.min(w.a.y, w.b.y) - pad,
    maxX: Math.max(w.a.x, w.b.x) + pad,
    maxY: Math.max(w.a.y, w.b.y) + pad
  };
};

export const pointInAABB = (pt: Vec2, box: AABB): boolean => {
  return pt.x >= box.minX && pt.x <= box.maxX && pt.y >= box.minY && pt.y <= box.maxY;
};

/**
 * Fast segment-AABB intersection test using Liang-Barsky / Slab method
 */
export const segmentIntersectsAABB = (p: Vec2, q: Vec2, box: AABB): boolean => {
  // If either endpoint is inside, it intersects
  if (pointInAABB(p, box) || pointInAABB(q, box)) return true;

  const dx = q.x - p.x;
  const dy = q.y - p.y;

  let t0 = 0.0;
  let t1 = 1.0;

  // X slab
  if (Math.abs(dx) < 1e-12) {
    if (p.x < box.minX || p.x > box.maxX) return false;
  } else {
    const invDx = 1.0 / dx;
    let txNear = (box.minX - p.x) * invDx;
    let txFar = (box.maxX - p.x) * invDx;
    if (txNear > txFar) {
      const tmp = txNear;
      txNear = txFar;
      txFar = tmp;
    }
    t0 = Math.max(t0, txNear);
    t1 = Math.min(t1, txFar);
    if (t0 > t1) return false;
  }

  // Y slab
  if (Math.abs(dy) < 1e-12) {
    if (p.y < box.minY || p.y > box.maxY) return false;
  } else {
    const invDy = 1.0 / dy;
    let tyNear = (box.minY - p.y) * invDy;
    let tyFar = (box.maxY - p.y) * invDy;
    if (tyNear > tyFar) {
      const tmp = tyNear;
      tyNear = tyFar;
      tyFar = tmp;
    }
    t0 = Math.max(t0, tyNear);
    t1 = Math.min(t1, tyFar);
    if (t0 > t1) return false;
  }

  return true;
};
