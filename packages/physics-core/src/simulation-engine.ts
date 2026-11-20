import { HeatmapGrid, Scene, SimParams, SimStats, Vec2 } from '@wifi-planner/shared-types';
import { AABB, dist } from '@wifi-planner/geometry';
import { MaterialDB } from '@wifi-planner/materials-db';
import { QuadTree } from './spatial/quadtree.js';
import { transmissionLoss } from './raytrace/direct.js';
import { firstOrderPaths, ImageMethodContext } from './raytrace/image-method.js';
import { linkBudgetDbm, dbmToMW, mWToDbm, coherentPowerSum, RayPathSignal } from './link-budget.js';
import { createHeatmapGrid, calculateSimStats } from './grid.js';

export interface SimulationResult {
  grid: HeatmapGrid;
  stats: SimStats;
  durationMs: number;
}

export class SimulationEngine {
  /**
   * Ejecuta la simulación completa de cobertura electromagnética sobre una escena
   */
  public run(scene: Scene, params: SimParams): SimulationResult {
    const startTime = performance.now();

    // 1. Construir índice espacial QuadTree y base de materiales
    const bounds = this.computeSceneBounds(scene);
    const qt = new QuadTree(bounds);
    for (const wall of scene.walls) {
      qt.insert(wall);
    }

    const mats = new MaterialDB(scene.materials);

    // 2. Crear malla discretizada (HeatmapGrid)
    const grid = createHeatmapGrid(bounds, params.gridStepM, scene.rooms);

    // Contexto para método de imágenes si se requieren reflexiones
    const imageCtxList: Map<string, ImageMethodContext> = new Map();
    if (params.maxReflections > 0) {
      for (const r of scene.routers) {
        imageCtxList.set(r.id, {
          fGHz: r.freqGHz,
          qt,
          mats,
          reflectors: scene.walls
        });
      }
    }

    // 3. Evaluar cada celda de la malla
    const cols = grid.width;
    const rows = grid.height;
    const step = grid.step;

    for (let r = 0; r < rows; r++) {
      const cy = grid.originY + (r + 0.5) * step;
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (Number.isNaN(grid.dbm[idx])) {
          continue; // Celda fuera del edificio
        }

        const rxPt: Vec2 = { x: grid.originX + (c + 0.5) * step, y: cy };
        let totalPowerMW = 0;

        for (const router of scene.routers) {
          const d = dist(router.pos, rxPt);
          const wallLossDb = transmissionLoss(router.pos, rxPt, router.freqGHz, qt, mats);

          const directPowerDbm = linkBudgetDbm(
            router.txPowerDbm,
            router.gainDbi,
            params.rxGainDbi,
            d,
            router.freqGHz,
            wallLossDb,
            0,
            params.minDistanceM
          );

          if (params.maxReflections === 0) {
            // Nivel A: solo camino directo
            totalPowerMW += dbmToMW(directPowerDbm);
          } else {
            // Nivel B: directo + reflexiones
            const ctx = imageCtxList.get(router.id)!;
            const reflectedPaths = firstOrderPaths(router.pos, rxPt, ctx);

            if (params.coherent) {
              const signals: RayPathSignal[] = [
                {
                  powerDbm: directPowerDbm,
                  distanceM: Math.max(d, params.minDistanceM)
                }
              ];

              for (const rp of reflectedPaths) {
                const reflPowerDbm = linkBudgetDbm(
                  router.txPowerDbm,
                  router.gainDbi,
                  params.rxGainDbi,
                  rp.length,
                  router.freqGHz,
                  rp.lossDb,
                  rp.reflectionLossDb,
                  params.minDistanceM
                );
                if (reflPowerDbm >= params.pruneBelowDbm) {
                  signals.push({
                    powerDbm: reflPowerDbm,
                    distanceM: rp.length
                  });
                }
              }

              const routerTotalDbm = coherentPowerSum(signals, router.freqGHz);
              totalPowerMW += dbmToMW(routerTotalDbm);
            } else {
              // Incoherente (sumar en mW)
              let routerMW = dbmToMW(directPowerDbm);
              for (const rp of reflectedPaths) {
                const reflPowerDbm = linkBudgetDbm(
                  router.txPowerDbm,
                  router.gainDbi,
                  params.rxGainDbi,
                  rp.length,
                  router.freqGHz,
                  rp.lossDb,
                  rp.reflectionLossDb,
                  params.minDistanceM
                );
                if (reflPowerDbm >= params.pruneBelowDbm) {
                  routerMW += dbmToMW(reflPowerDbm);
                }
              }
              totalPowerMW += routerMW;
            }
          }
        }

        const cellDbm = totalPowerMW > 1e-15 ? mWToDbm(totalPowerMW) : params.noiseFloorDbm;
        grid.dbm[idx] = cellDbm;
      }
    }

    // 4. Estadísticas
    const stats = calculateSimStats(grid, params.deadZoneDbm);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      grid,
      stats,
      durationMs
    };
  }

  private computeSceneBounds(scene: Scene): AABB {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const w of scene.walls) {
      if (w.a.x < minX) minX = w.a.x;
      if (w.b.x < minX) minX = w.b.x;
      if (w.a.y < minY) minY = w.a.y;
      if (w.b.y < minY) minY = w.b.y;

      if (w.a.x > maxX) maxX = w.a.x;
      if (w.b.x > maxX) maxX = w.b.x;
      if (w.a.y > maxY) maxY = w.a.y;
      if (w.b.y > maxY) maxY = w.b.y;
    }

    for (const r of scene.routers) {
      if (r.pos.x < minX) minX = r.pos.x;
      if (r.pos.y < minY) minY = r.pos.y;
      if (r.pos.x > maxX) maxX = r.pos.x;
      if (r.pos.y > maxY) maxY = r.pos.y;
    }

    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 10;
      maxY = 10;
    }

    // Añadir margen de 1 metro alrededor
    const margin = 1.0;
    return {
      minX: minX - margin,
      minY: minY - margin,
      maxX: maxX + margin,
      maxY: maxY + margin
    };
  }
}
