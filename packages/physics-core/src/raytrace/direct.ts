import { Vec2, Wall } from '@wifi-planner/shared-types';
import { sub, dot, segmentNormal, raySegment } from '@wifi-planner/geometry';
import { MaterialDB } from '@wifi-planner/materials-db';
import { snellCosT } from '../snell.js';
import { SpatialIndex } from '../spatial/quadtree.js';

export interface WallHitDetail {
  wall: Wall;
  cosI: number;
  cosT: number;
  lossDb: number;
  t: number;
}

export interface TransmissionResult {
  lossDb: number;
  crossedWalls: WallHitDetail[];
}

/**
 * Nivel A: Calcula la pérdida por penetración acumulada en decibelios (dB)
 * a lo largo de la línea directa de vista (LOS) entre un transmisor TX y un receptor RX.
 *
 * Fórmula por muro (sección 7.4):
 * L = L_0 * (espesor / espesor_ref) / cos(theta_t)
 */
export function transmissionLoss(
  tx: Vec2,
  rx: Vec2,
  freqGHz: number,
  qt: SpatialIndex,
  mats: MaterialDB,
  skip?: Wall
): number {
  const d = sub(rx, tx);
  const len = Math.hypot(d.x, d.y);
  if (len < 1e-12) return 0;

  const dir = { x: d.x / len, y: d.y / len };
  let lossDb = 0;

  for (const w of qt.querySegment(tx, rx)) {
    if (skip && w.id === skip.id) continue;
    const hit = raySegment(tx, dir, w.a, w.b);
    if (!hit || hit.t >= len) continue;

    const normal = segmentNormal(w.a, w.b);
    const cosI = Math.abs(dot(dir, normal));
    const m = mats.at(w.materialId, freqGHz);
    const cosT = snellCosT(cosI, 1, Math.sqrt(m.epsR));
    const thicknessRatio = m.thicknessM > 0 ? w.thickness / m.thicknessM : 1;

    lossDb += (m.attenuationDb * thicknessRatio) / cosT;
  }

  return lossDb;
}

/**
 * Variante con desglose detallado para inspección / sonda del cursor (sección 13)
 */
export function transmissionLossDetailed(
  tx: Vec2,
  rx: Vec2,
  freqGHz: number,
  qt: SpatialIndex,
  mats: MaterialDB,
  skip?: Wall
): TransmissionResult {
  const d = sub(rx, tx);
  const len = Math.hypot(d.x, d.y);
  const crossedWalls: WallHitDetail[] = [];
  if (len < 1e-12) return { lossDb: 0, crossedWalls };

  const dir = { x: d.x / len, y: d.y / len };
  let totalLossDb = 0;

  for (const w of qt.querySegment(tx, rx)) {
    if (skip && w.id === skip.id) continue;
    const hit = raySegment(tx, dir, w.a, w.b);
    if (!hit || hit.t >= len) continue;

    const normal = segmentNormal(w.a, w.b);
    const cosI = Math.abs(dot(dir, normal));
    const m = mats.at(w.materialId, freqGHz);
    const cosT = snellCosT(cosI, 1, Math.sqrt(m.epsR));
    const thicknessRatio = m.thicknessM > 0 ? w.thickness / m.thicknessM : 1;
    const lossDb = (m.attenuationDb * thicknessRatio) / cosT;

    totalLossDb += lossDb;
    crossedWalls.push({
      wall: w,
      cosI,
      cosT,
      lossDb,
      t: hit.t
    });
  }

  crossedWalls.sort((a, b) => a.t - b.t);
  return { lossDb: totalLossDb, crossedWalls };
}
