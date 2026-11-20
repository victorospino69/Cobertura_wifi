import { HeatmapGrid, Scene, SimParams, SimStats } from '@wifi-planner/shared-types';
import { WorkerResponse } from './sim.worker.js';

export type SimulationCallback = (grid: HeatmapGrid, stats: SimStats, durationMs: number) => void;

export class SimulationScheduler {
  private worker: Worker | null = null;
  private currentGeneration = 0;
  private onResult: SimulationCallback | null = null;
  private pendingPasses: number[] = [];
  private activeScene: Scene | null = null;
  private activeParams: SimParams | null = null;

  constructor(onResult: SimulationCallback) {
    this.onResult = onResult;
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined') return;

    this.worker = new Worker(new URL('./sim.worker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === 'SIMULATION_RESULT') {
        // Descartar si pertenece a una generación anterior
        if (data.generationId !== this.currentGeneration) {
          return;
        }

        const grid: HeatmapGrid = {
          originX: data.originX,
          originY: data.originY,
          width: data.width,
          height: data.height,
          step: data.step,
          dbm: new Float32Array(data.dbmBuffer)
        };

        if (this.onResult) {
          this.onResult(grid, data.stats, data.durationMs);
        }

        // Si hay una siguiente pasada de mayor resolución programada
        if (this.pendingPasses.length > 0 && this.activeScene && this.activeParams) {
          const nextStep = this.pendingPasses.shift()!;
          this.runPass(this.activeScene, this.activeParams, nextStep);
        }
      }
    };
  }

  /**
   * Programa una simulación con refinamiento progresivo (pasada rápida 1m -> 0.5m -> paso final)
   */
  public schedule(scene: Scene, params: SimParams, isFastPreview = false): void {
    this.currentGeneration++;
    this.activeScene = scene;
    this.activeParams = params;

    if (isFastPreview) {
      // Arrastre en tiempo real: sólo pasada gruesa de 1.0 metro para respuesta < 50ms
      this.pendingPasses = [];
      this.runPass(scene, params, 1.0);
    } else {
      // Refinamiento progresivo: pasada 0.5m luego paso final (ej. 0.25m)
      const targetStep = params.gridStepM;
      if (targetStep >= 0.5) {
        this.pendingPasses = [];
        this.runPass(scene, params, targetStep);
      } else {
        this.pendingPasses = [targetStep];
        this.runPass(scene, params, 0.5);
      }
    }
  }

  private runPass(scene: Scene, params: SimParams, stepM: number): void {
    if (!this.worker) return;

    const passParams: SimParams = {
      ...params,
      gridStepM: stepM
    };

    this.worker.postMessage({
      type: 'SIMULATE',
      scene,
      params: passParams,
      generationId: this.currentGeneration
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
