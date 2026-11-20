import { Scene, SimParams } from '@wifi-planner/shared-types';
import { SimulationEngine } from '@wifi-planner/physics-core';

export interface WorkerRequest {
  type: 'SIMULATE';
  scene: Scene;
  params: SimParams;
  generationId: number;
}

export interface WorkerResponse {
  type: 'SIMULATION_RESULT';
  originX: number;
  originY: number;
  width: number;
  height: number;
  step: number;
  dbmBuffer: ArrayBufferLike;
  stats: any;
  durationMs: number;
  generationId: number;
}

const engine = new SimulationEngine();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, scene, params, generationId } = event.data;

  if (type === 'SIMULATE') {
    try {
      const result = engine.run(scene, params);
      const response: WorkerResponse = {
        type: 'SIMULATION_RESULT',
        originX: result.grid.originX,
        originY: result.grid.originY,
        width: result.grid.width,
        height: result.grid.height,
        step: result.grid.step,
        dbmBuffer: result.grid.dbm.buffer,
        stats: result.stats,
        durationMs: result.durationMs,
        generationId
      };

      // Transferable object para paso de memoria sin copia
      (self as any).postMessage(response, [result.grid.dbm.buffer]);
    } catch (err: any) {
      console.error('Error en sim.worker:', err);
    }
  }
};
