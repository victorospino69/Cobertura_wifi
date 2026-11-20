import { HeatmapGrid, Room, SimStats, Vec2 } from '@wifi-planner/shared-types';
import { AABB, pointInPolygon } from '@wifi-planner/geometry';

export interface GridTile {
  tileX: number;
  tileY: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  step: number;
}

export function createHeatmapGrid(bounds: AABB, step: number, rooms?: Room[]): HeatmapGrid {
  const safeStep = Math.max(0.01, step);
  const widthM = Math.max(1, bounds.maxX - bounds.minX);
  const heightM = Math.max(1, bounds.maxY - bounds.minY);

  const cols = Math.ceil(widthM / safeStep);
  const rows = Math.ceil(heightM / safeStep);

  const dbm = new Float32Array(cols * rows);

  // Si hay habitaciones delimitadas, marcar como NaN las celdas que caen fuera de ellas
  const hasRooms = rooms && rooms.length > 0;

  for (let r = 0; r < rows; r++) {
    const cy = bounds.minY + (r + 0.5) * safeStep;
    for (let c = 0; c < cols; c++) {
      const cx = bounds.minX + (c + 0.5) * safeStep;
      const idx = r * cols + c;

      if (hasRooms) {
        const pt: Vec2 = { x: cx, y: cy };
        const insideAnyRoom = rooms.some((room) => pointInPolygon(pt, room.polygon));
        if (!insideAnyRoom) {
          dbm[idx] = NaN; // Fuera del edificio
          continue;
        }
      }
      dbm[idx] = -150.0; // Inicializado antes del cálculo
    }
  }

  return {
    originX: bounds.minX,
    originY: bounds.minY,
    width: cols,
    height: rows,
    step: safeStep,
    dbm
  };
}

/**
 * Genera particiones en tiles (por defecto 32x32 celdas) para ejecución concurrente en Workers
 */
export function partitionTiles(grid: HeatmapGrid, tileSize = 32): GridTile[] {
  const tiles: GridTile[] = [];
  const tilesX = Math.ceil(grid.width / tileSize);
  const tilesY = Math.ceil(grid.height / tileSize);

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const startX = tx * tileSize;
      const startY = ty * tileSize;
      const w = Math.min(tileSize, grid.width - startX);
      const h = Math.min(tileSize, grid.height - startY);

      tiles.push({
        tileX: tx,
        tileY: ty,
        startX,
        startY,
        width: w,
        height: h,
        step: grid.step
      });
    }
  }

  return tiles;
}

/**
 * Calcula estadísticas de cobertura sobre un HeatmapGrid
 */
export function calculateSimStats(grid: HeatmapGrid, deadZoneThresholdDbm = -75): SimStats {
  const validDbm: number[] = [];

  for (let i = 0; i < grid.dbm.length; i++) {
    const val = grid.dbm[i]!;
    if (!Number.isNaN(val) && Number.isFinite(val)) {
      validDbm.push(val);
    }
  }

  if (validDbm.length === 0) {
    return {
      coveragePct: 0,
      deadZonePct: 100,
      deadZoneAreaM2: 0,
      meanDbm: -100,
      p5Dbm: -100
    };
  }

  validDbm.sort((a, b) => a - b);

  let coveredCount = 0;
  let deadZoneCount = 0;
  let sumLinearMW = 0;

  for (const v of validDbm) {
    if (v >= deadZoneThresholdDbm) {
      coveredCount++;
    } else {
      deadZoneCount++;
    }
    sumLinearMW += Math.pow(10, v / 10);
  }

  const total = validDbm.length;
  const coveragePct = (coveredCount / total) * 100;
  const deadZonePct = (deadZoneCount / total) * 100;
  const cellArea = grid.step * grid.step;
  const deadZoneAreaM2 = deadZoneCount * cellArea;

  const meanLinearMW = sumLinearMW / total;
  const meanDbm = meanLinearMW > 1e-15 ? 10 * Math.log10(meanLinearMW) : -150;

  const p5Index = Math.floor(total * 0.05);
  const p5Dbm = validDbm[Math.min(p5Index, total - 1)]!;

  return {
    coveragePct: Math.round(coveragePct * 100) / 100,
    deadZonePct: Math.round(deadZonePct * 100) / 100,
    deadZoneAreaM2: Math.round(deadZoneAreaM2 * 100) / 100,
    meanDbm: Math.round(meanDbm * 100) / 100,
    p5Dbm: Math.round(p5Dbm * 100) / 100
  };
}
