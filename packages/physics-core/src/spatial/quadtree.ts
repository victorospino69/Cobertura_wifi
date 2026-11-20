import { Vec2, Wall } from '@wifi-planner/shared-types';
import { AABB, aabbOverlap, segmentIntersectsAABB, wallAABB } from '@wifi-planner/geometry';

export interface SpatialIndex {
  insert(w: Wall): void;
  querySegment(p: Vec2, q: Vec2, out?: Set<Wall>): Set<Wall>;
}

/**
 * QuadTree espacial para indexación y aceleración de consultas de muros
 * Implementación optimizada según sección 7.3 de la especificación
 */
export class QuadTree implements SpatialIndex {
  public items: Wall[] = [];
  public children?: [QuadTree, QuadTree, QuadTree, QuadTree];

  constructor(
    public bounds: AABB,
    public depth = 0,
    public maxDepth = 8,
    public cap = 8
  ) {}

  public insert(w: Wall): void {
    if (!aabbOverlap(this.bounds, wallAABB(w))) return;

    if (!this.children && (this.items.length < this.cap || this.depth === this.maxDepth)) {
      this.items.push(w);
      return;
    }

    if (!this.children) {
      this.subdivide();
    }

    for (const c of this.children!) {
      c.insert(w);
    }
  }

  private subdivide(): void {
    const midX = (this.bounds.minX + this.bounds.maxX) / 2;
    const midY = (this.bounds.minY + this.bounds.maxY) / 2;
    const nextDepth = this.depth + 1;

    this.children = [
      new QuadTree({ minX: this.bounds.minX, minY: this.bounds.minY, maxX: midX, maxY: midY }, nextDepth, this.maxDepth, this.cap),
      new QuadTree({ minX: midX, minY: this.bounds.minY, maxX: this.bounds.maxX, maxY: midY }, nextDepth, this.maxDepth, this.cap),
      new QuadTree({ minX: this.bounds.minX, minY: midY, maxX: midX, maxY: this.bounds.maxY }, nextDepth, this.maxDepth, this.cap),
      new QuadTree({ minX: midX, minY: midY, maxX: this.bounds.maxX, maxY: this.bounds.maxY }, nextDepth, this.maxDepth, this.cap)
    ];

    const prev = this.items;
    this.items = [];
    for (const w of prev) {
      for (const c of this.children) {
        c.insert(w);
      }
    }
  }

  public querySegment(p: Vec2, q: Vec2, out: Set<Wall> = new Set<Wall>()): Set<Wall> {
    if (!segmentIntersectsAABB(p, q, this.bounds)) return out;

    for (let i = 0; i < this.items.length; i++) {
      out.add(this.items[i]!);
    }

    if (this.children) {
      this.children[0].querySegment(p, q, out);
      this.children[1].querySegment(p, q, out);
      this.children[2].querySegment(p, q, out);
      this.children[3].querySegment(p, q, out);
    }

    return out;
  }
}
