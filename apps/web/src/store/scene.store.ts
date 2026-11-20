import { create } from 'zustand';
import { HeatmapGrid, Router, Scene, SimParams, SimStats, Vec2, Wall } from '@wifi-planner/shared-types';
import { SEED_MATERIALS } from '@wifi-planner/materials-db';

export type EditorTool = 'select' | 'wall' | 'router';

const DEFAULT_SIM_PARAMS: SimParams = {
  gridStepM: 0.25,
  maxReflections: 0,
  coherent: false,
  rxGainDbi: 0,
  noiseFloorDbm: -95,
  deadZoneDbm: -75,
  minDistanceM: 0.1,
  pruneBelowDbm: -100
};

const DEFAULT_SCENE: Scene = {
  walls: [
    { id: 'w1', a: { x: 2, y: 2 }, b: { x: 14, y: 2 }, thickness: 0.2, materialId: 'mat_concrete', kind: 'wall' },
    { id: 'w2', a: { x: 14, y: 2 }, b: { x: 14, y: 10 }, thickness: 0.2, materialId: 'mat_concrete', kind: 'wall' },
    { id: 'w3', a: { x: 14, y: 10 }, b: { x: 2, y: 10 }, thickness: 0.2, materialId: 'mat_concrete', kind: 'wall' },
    { id: 'w4', a: { x: 2, y: 10 }, b: { x: 2, y: 2 }, thickness: 0.2, materialId: 'mat_concrete', kind: 'wall' },
    { id: 'w5', a: { x: 8, y: 2 }, b: { x: 8, y: 10 }, thickness: 0.1, materialId: 'mat_drywall', kind: 'wall' }
  ],
  rooms: [
    {
      id: 'r1',
      name: 'Habitación A',
      polygon: [
        { x: 2, y: 2 },
        { x: 8, y: 2 },
        { x: 8, y: 10 },
        { x: 2, y: 10 }
      ]
    },
    {
      id: 'r2',
      name: 'Habitación B',
      polygon: [
        { x: 8, y: 2 },
        { x: 14, y: 2 },
        { x: 14, y: 10 },
        { x: 8, y: 10 }
      ]
    }
  ],
  routers: [
    {
      id: 'rtr1',
      name: 'Router Principal',
      pos: { x: 5, y: 6 },
      txPowerDbm: 20,
      freqGHz: 2.4,
      gainDbi: 3
    }
  ],
  materials: SEED_MATERIALS
};

interface SceneState {
  scene: Scene;
  history: Scene[];
  historyIndex: number;

  activeTool: EditorTool;
  selectedWallId: string | null;
  selectedRouterId: string | null;
  activeMaterialId: string;

  snapToGrid: boolean;
  gridSnapSizeM: number;
  orthoMode: boolean;

  simParams: SimParams;
  heatmapGrid: HeatmapGrid | null;
  simStats: SimStats | null;
  simDurationMs: number | null;
  isSimulating: boolean;

  hoverDbm: number | null;
  hoverPos: Vec2 | null;

  // Actions
  setTool: (tool: EditorTool) => void;
  setSelectedWall: (id: string | null) => void;
  setSelectedRouter: (id: string | null) => void;
  setActiveMaterial: (id: string) => void;
  setSnapToGrid: (snap: boolean) => void;
  setOrthoMode: (ortho: boolean) => void;
  setSimParams: (params: Partial<SimParams>) => void;
  setHover: (pos: Vec2 | null, dbm: number | null) => void;
  setSimulationResult: (grid: HeatmapGrid, stats: SimStats, durationMs: number) => void;

  addWall: (wall: Wall) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  removeWall: (id: string) => void;

  addRouter: (router: Router) => void;
  updateRouter: (id: string, updates: Partial<Router>) => void;
  removeRouter: (id: string) => void;

  undo: () => void;
  redo: () => void;
  loadDemoScene: () => void;
  clearScene: () => void;
  importSceneJson: (jsonStr: string) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scene: DEFAULT_SCENE,
  history: [DEFAULT_SCENE],
  historyIndex: 0,

  activeTool: 'select',
  selectedWallId: null,
  selectedRouterId: null,
  activeMaterialId: 'mat_concrete',

  snapToGrid: true,
  gridSnapSizeM: 0.5,
  orthoMode: false,

  simParams: DEFAULT_SIM_PARAMS,
  heatmapGrid: null,
  simStats: null,
  simDurationMs: null,
  isSimulating: false,

  hoverDbm: null,
  hoverPos: null,

  setTool: (activeTool) => set({ activeTool, selectedWallId: null, selectedRouterId: null }),
  setSelectedWall: (selectedWallId) => set({ selectedWallId, selectedRouterId: null }),
  setSelectedRouter: (selectedRouterId) => set({ selectedRouterId, selectedWallId: null }),
  setActiveMaterial: (activeMaterialId) => set({ activeMaterialId }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setOrthoMode: (orthoMode) => set({ orthoMode }),
  setSimParams: (params) =>
    set((state) => ({ simParams: { ...state.simParams, ...params } })),
  setHover: (hoverPos, hoverDbm) => set({ hoverPos, hoverDbm }),
  setSimulationResult: (heatmapGrid, simStats, simDurationMs) =>
    set({ heatmapGrid, simStats, simDurationMs, isSimulating: false }),

  addWall: (wall) => {
    const { scene, history, historyIndex } = get();
    const newScene: Scene = { ...scene, walls: [...scene.walls, wall] };
    const newHistory = [...history.slice(0, historyIndex + 1), newScene];
    set({ scene: newScene, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  updateWall: (id, updates) => {
    const { scene, history, historyIndex } = get();
    const newScene: Scene = {
      ...scene,
      walls: scene.walls.map((w) => (w.id === id ? { ...w, ...updates } : w))
    };
    const newHistory = [...history.slice(0, historyIndex + 1), newScene];
    set({ scene: newScene, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  removeWall: (id) => {
    const { scene, history, historyIndex } = get();
    const newScene: Scene = {
      ...scene,
      walls: scene.walls.filter((w) => w.id !== id)
    };
    const newHistory = [...history.slice(0, historyIndex + 1), newScene];
    set({
      scene: newScene,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedWallId: null
    });
  },

  addRouter: (router) => {
    const { scene, history, historyIndex } = get();
    const newScene: Scene = { ...scene, routers: [...scene.routers, router] };
    const newHistory = [...history.slice(0, historyIndex + 1), newScene];
    set({ scene: newScene, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  updateRouter: (id, updates) => {
    const { scene, history, historyIndex } = get();
    const newScene: Scene = {
      ...scene,
      routers: scene.routers.map((r) => (r.id === id ? { ...r, ...updates } : r))
    };
    const newHistory = [...history.slice(0, historyIndex + 1), newScene];
    set({ scene: newScene, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  removeRouter: (id) => {
    const { scene, history, historyIndex } = get();
    const newScene: Scene = {
      ...scene,
      routers: scene.routers.filter((r) => r.id !== id)
    };
    const newHistory = [...history.slice(0, historyIndex + 1), newScene];
    set({
      scene: newScene,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedRouterId: null
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        scene: history[historyIndex - 1]!
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        scene: history[historyIndex + 1]!
      });
    }
  },

  loadDemoScene: () => {
    set({
      scene: DEFAULT_SCENE,
      history: [DEFAULT_SCENE],
      historyIndex: 0,
      selectedWallId: null,
      selectedRouterId: null
    });
  },

  clearScene: () => {
    const emptyScene: Scene = {
      walls: [],
      rooms: [],
      routers: [],
      materials: SEED_MATERIALS
    };
    set({
      scene: emptyScene,
      history: [emptyScene],
      historyIndex: 0,
      selectedWallId: null,
      selectedRouterId: null,
      heatmapGrid: null,
      simStats: null
    });
  },

  importSceneJson: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.walls) && Array.isArray(parsed.routers)) {
        const scene: Scene = {
          walls: parsed.walls,
          rooms: parsed.rooms || [],
          routers: parsed.routers,
          materials: parsed.materials || SEED_MATERIALS
        };
        set({
          scene,
          history: [scene],
          historyIndex: 0,
          selectedWallId: null,
          selectedRouterId: null
        });
      }
    } catch (e) {
      console.error('Error importando escena:', e);
    }
  }
}));
