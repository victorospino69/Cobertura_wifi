import { z } from 'zod';

export type Vec2 = { x: number; y: number };
export const Vec2Schema = z.object({
  x: z.number(),
  y: z.number()
});

export interface MaterialProps {
  freqGHz: number;
  epsR: number;            // permitividad relativa (parte real)
  sigma: number;           // conductividad S/m
  attenuationDb: number;   // pérdida de transmisión a incidencia normal
  reflection: number;      // |Gamma| de referencia (informativo; se recalcula con Fresnel)
  thicknessM: number;
}
export const MaterialPropsSchema = z.object({
  freqGHz: z.number().positive(),
  epsR: z.number().min(1),
  sigma: z.number().min(0),
  attenuationDb: z.number().min(0),
  reflection: z.number().min(0).max(1),
  thicknessM: z.number().positive()
});

export interface Material {
  id: string;
  name: string;
  color: string;
  props: MaterialProps[];  // una por frecuencia; interpolar linealmente si falta
}
export const MaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  props: z.array(MaterialPropsSchema)
});

export type WallKind = 'wall' | 'door' | 'window';
export const WallKindSchema = z.enum(['wall', 'door', 'window']);

export interface Wall {
  id: string;
  a: Vec2;
  b: Vec2;
  thickness: number;
  materialId: string;
  kind: WallKind;
  parentWallId?: string;   // puerta/ventana incrustada
}
export const WallSchema = z.object({
  id: z.string(),
  a: Vec2Schema,
  b: Vec2Schema,
  thickness: z.number().positive(),
  materialId: z.string(),
  kind: WallKindSchema.default('wall'),
  parentWallId: z.string().optional()
});

export interface Room {
  id: string;
  name: string;
  polygon: Vec2[];
}
export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  polygon: z.array(Vec2Schema)
});

export interface Router {
  id: string;
  name: string;
  pos: Vec2;
  txPowerDbm: number;
  freqGHz: 2.4 | 5.0;
  gainDbi: number;
  channel?: number;
  pattern?: number[];      // ganancia por ángulo (opcional; omitido = isotrópica)
}
export const RouterSchema = z.object({
  id: z.string(),
  name: z.string(),
  pos: Vec2Schema,
  txPowerDbm: z.number(),
  freqGHz: z.union([z.literal(2.4), z.literal(5.0)]),
  gainDbi: z.number().default(3),
  channel: z.number().int().optional(),
  pattern: z.array(z.number()).optional()
});

export interface Scene {
  walls: Wall[];
  rooms: Room[];
  routers: Router[];
  materials: Material[];
}
export const SceneSchema = z.object({
  walls: z.array(WallSchema),
  rooms: z.array(RoomSchema).default([]),
  routers: z.array(RouterSchema),
  materials: z.array(MaterialSchema)
});

export interface SimParams {
  gridStepM: number;       // 0.25 típico; 0.03 para modo coherente en ventana
  maxReflections: 0 | 1 | 2 | 3;
  coherent: boolean;
  rxGainDbi: number;       // 0 para un cliente típico
  noiseFloorDbm: number;   // -95
  deadZoneDbm: number;     // -75 (configurable)
  minDistanceM: number;    // 0.1, piso de distancia para FSPL
  pruneBelowDbm: number;   // -100, poda de caminos débiles
}
export const SimParamsSchema = z.object({
  gridStepM: z.number().default(0.25),
  maxReflections: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
  coherent: z.boolean().default(false),
  rxGainDbi: z.number().default(0),
  noiseFloorDbm: z.number().default(-95),
  deadZoneDbm: z.number().default(-75),
  minDistanceM: z.number().default(0.1),
  pruneBelowDbm: z.number().default(-100)
});

export interface HeatmapGrid {
  originX: number;
  originY: number;
  width: number;
  height: number;
  step: number;
  dbm: Float32Array;       // width*height; NaN = fuera del edificio
}

export interface SimStats {
  coveragePct: number;
  deadZonePct: number;
  deadZoneAreaM2: number;
  meanDbm: number;
  p5Dbm: number;
}
export const SimStatsSchema = z.object({
  coveragePct: z.number(),
  deadZonePct: z.number(),
  deadZoneAreaM2: z.number(),
  meanDbm: z.number(),
  p5Dbm: z.number()
});
