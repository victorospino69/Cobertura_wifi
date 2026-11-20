import { Vec2, Wall } from '@wifi-planner/shared-types';
import { sub, add, mul, dot, segmentNormal, raySegment, mirrorPoint } from '@wifi-planner/geometry';
import { MaterialDB } from '@wifi-planner/materials-db';
import { fresnel } from '../fresnel.js';
import { complexIndex } from '../dielectric.js';
import { SpatialIndex } from '../spatial/quadtree.js';
import { transmissionLoss } from './direct.js';

export interface BouncePoint {
  wall: Wall;
  point: Vec2;
  cosI: number;
  reflectionLossDb: number;
}

export interface ReflectedPath {
  length: number;
  lossDb: number;         // Pérdida por muros atravesados en los tramos
  reflectionLossDb: number; // Pérdida por coeficiente de reflexión (|Gamma|^2)
  bounces: BouncePoint[];
  rxPowerDbm?: number;
}

export interface ImageMethodContext {
  fGHz: number;
  qt: SpatialIndex;
  mats: MaterialDB;
  reflectors: Wall[];
}

/**
 * Calcula trayectorias especulares de orden 1 utilizando el método de fuentes imagen
 */
export function firstOrderPaths(S: Vec2, R: Vec2, ctx: ImageMethodContext): ReflectedPath[] {
  const paths: ReflectedPath[] = [];

  for (const W of ctx.reflectors) {
    const Si = mirrorPoint(S, W.a, W.b);
    const dSR = sub(R, Si);
    const L = Math.hypot(dSR.x, dSR.y);
    if (L < 1e-12) continue;

    const dir = { x: dSR.x / L, y: dSR.y / L };
    const hit = raySegment(Si, dir, W.a, W.b);
    if (!hit || hit.t >= L || hit.t <= 1e-9) continue;

    const P = add(Si, mul(dir, hit.t));

    // Pérdidas por penetración en los dos tramos (S -> P y P -> R), excluyendo la pared reflectora W
    const legLoss =
      transmissionLoss(S, P, ctx.fGHz, ctx.qt, ctx.mats, W) +
      transmissionLoss(P, R, ctx.fGHz, ctx.qt, ctx.mats, W);

    // Coeficiente de reflexión de Fresnel en el punto de impacto
    const wallNorm = segmentNormal(W.a, W.b);
    const cosI = Math.abs(dot(dir, wallNorm));

    const m = ctx.mats.at(W.materialId, ctx.fGHz);
    const nAir = { re: 1, im: 0 };
    const nWall = complexIndex(m.epsR, m.sigma, ctx.fGHz * 1e9);
    const fRes = fresnel(nAir, nWall, cosI);

    // L_refl = -10 * log10(Ravg)
    const Rpower = Math.max(1e-10, fRes.Ravg);
    const reflLossDb = -10 * Math.log10(Rpower);

    paths.push({
      length: L,
      lossDb: legLoss,
      reflectionLossDb: reflLossDb,
      bounces: [
        {
          wall: W,
          point: P,
          cosI,
          reflectionLossDb: reflLossDb
        }
      ]
    });
  }

  return paths;
}
