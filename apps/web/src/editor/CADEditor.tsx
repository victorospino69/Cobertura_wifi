import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Text, Group } from 'react-konva';
import { Vec2, Wall, Router } from '@wifi-planner/shared-types';
import { snapToGrid, snapAngle, snapToPoints, dist } from '@wifi-planner/geometry';
import { useSceneStore } from '../store/scene.store.js';
import { HeatmapCanvas } from '../heatmap/HeatmapCanvas.js';
import { SimulationScheduler } from '../workers/scheduler.js';

const PIXELS_PER_METER = 40;

export const CADEditor: React.FC = () => {
  const {
    scene,
    activeTool,
    selectedWallId,
    selectedRouterId,
    activeMaterialId,
    snapToGrid: isSnapGrid,
    gridSnapSizeM,
    orthoMode,
    simParams,
    heatmapGrid,
    setSelectedWall,
    setSelectedRouter,
    addWall,
    updateRouter,
    addRouter,
    setHover,
    setSimulationResult
  } = useSceneStore();

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 100, y: 100 });

  // Estado para creación interactiva de muros
  const [drawingWallStart, setDrawingWallStart] = useState<Vec2 | null>(null);
  const [cursorWorldPos, setCursorWorldPos] = useState<Vec2>({ x: 0, y: 0 });

  const stageRef = useRef<any>(null);
  const schedulerRef = useRef<SimulationScheduler | null>(null);

  // Inicializar scheduler de Web Workers
  useEffect(() => {
    schedulerRef.current = new SimulationScheduler((grid, stats, durationMs) => {
      setSimulationResult(grid, stats, durationMs);
    });

    return () => {
      schedulerRef.current?.terminate();
    };
  }, [setSimulationResult]);

  // Ejecutar simulación cuando cambie la escena o los parámetros físicos
  useEffect(() => {
    if (schedulerRef.current) {
      schedulerRef.current.schedule(scene, simParams, false);
    }
  }, [scene, simParams]);

  // Manejar redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Conversión de coordenadas de pantalla a metros del mundo
  const screenToWorldMeters = useCallback(
    (screenX: number, screenY: number): Vec2 => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      const rawX = (screenX - stagePos.x) / (stageScale * PIXELS_PER_METER);
      const rawY = (screenY - stagePos.y) / (stageScale * PIXELS_PER_METER);

      let snapped: Vec2 = { x: rawX, y: rawY };

      // Snap a vértices existentes
      const allVertices: Vec2[] = [];
      scene.walls.forEach((w) => {
        allVertices.push(w.a, w.b);
      });
      const vertexSnap = snapToPoints(snapped, allVertices, 0.3);
      if (vertexSnap.snapped) {
        return vertexSnap.pt;
      }

      // Snap a la rejilla
      if (isSnapGrid) {
        snapped = snapToGrid(snapped, gridSnapSizeM);
      }

      return snapped;
    },
    [stagePos, stageScale, scene.walls, isSnapGrid, gridSnapSizeM]
  );

  // Zoom con rueda del ratón
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.2, Math.min(4.0, newScale));

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale
    };

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    });
  };

  // Movimiento del cursor sobre el canvas (sonda del cursor)
  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    let worldPos = screenToWorldMeters(pointer.x, pointer.y);

    if (activeTool === 'wall' && drawingWallStart) {
      if (orthoMode || e.evt.shiftKey) {
        worldPos = snapAngle(drawingWallStart, worldPos, 90);
      }
    }

    setCursorWorldPos(worldPos);

    // Consulta de valor de señal dBm bajo el puntero (sonda)
    if (heatmapGrid) {
      const col = Math.floor((worldPos.x - heatmapGrid.originX) / heatmapGrid.step);
      const row = Math.floor((worldPos.y - heatmapGrid.originY) / heatmapGrid.step);

      if (col >= 0 && col < heatmapGrid.width && row >= 0 && row < heatmapGrid.height) {
        const dbmVal = heatmapGrid.dbm[row * heatmapGrid.width + col]!;
        if (!Number.isNaN(dbmVal)) {
          setHover(worldPos, Math.round(dbmVal * 10) / 10);
          return;
        }
      }
    }
    setHover(worldPos, null);
  };

  // Clic sobre el lienzo para dibujar o seleccionar
  const handleStageClick = (e: any) => {
    // Si se hizo clic sobre una forma específica, no actuar sobre el fondo
    if (e.target !== stageRef.current) return;

    if (activeTool === 'select') {
      setSelectedWall(null);
      setSelectedRouter(null);
      return;
    }

    if (activeTool === 'wall') {
      if (!drawingWallStart) {
        setDrawingWallStart(cursorWorldPos);
      } else {
        const wallDist = dist(drawingWallStart, cursorWorldPos);
        if (wallDist > 0.2) {
          const newWall: Wall = {
            id: `wall_${Date.now()}`,
            a: drawingWallStart,
            b: cursorWorldPos,
            thickness: activeMaterialId === 'mat_drywall' ? 0.1 : 0.2,
            materialId: activeMaterialId,
            kind: 'wall'
          };
          addWall(newWall);
          setDrawingWallStart(cursorWorldPos); // Continuar trazado encadenado
        }
      }
    } else if (activeTool === 'router') {
      const newRouter: Router = {
        id: `router_${Date.now()}`,
        name: `Router ${scene.routers.length + 1}`,
        pos: cursorWorldPos,
        txPowerDbm: 20,
        freqGHz: 2.4,
        gainDbi: 3
      };
      addRouter(newRouter);
    }
  };

  // Cancelar herramienta con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawingWallStart(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generar líneas de rejilla métrica
  const renderGrid = () => {
    const lines = [];
    const gridSize = 1.0 * PIXELS_PER_METER; // Rejilla principal cada 1 metro
    const extent = 50 * PIXELS_PER_METER;

    for (let x = -extent; x <= extent; x += gridSize) {
      lines.push(
        <Line
          key={`gx_${x}`}
          points={[x, -extent, x, extent]}
          stroke="#1e293b"
          strokeWidth={x === 0 ? 2 : 1}
        />
      );
    }
    for (let y = -extent; y <= extent; y += gridSize) {
      lines.push(
        <Line
          key={`gy_${y}`}
          points={[-extent, y, extent, y]}
          stroke="#1e293b"
          strokeWidth={y === 0 ? 2 : 1}
        />
      );
    }
    return lines;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Capa de fondo: Mapa de calor acelerado */}
      <HeatmapCanvas
        grid={heatmapGrid}
        deadZoneDbm={simParams.deadZoneDbm}
        scale={stageScale}
        offsetX={stagePos.x}
        offsetY={stagePos.y}
        width={dimensions.width}
        height={dimensions.height}
        pixelsPerMeter={PIXELS_PER_METER}
      />

      {/* Capa interactiva: CAD Konva */}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={activeTool === 'select' && !selectedWallId && !selectedRouterId}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        {/* Capa de Rejilla */}
        <Layer listening={false}>{renderGrid()}</Layer>

        {/* Capa de Habitaciones / Polígonos */}
        <Layer listening={false}>
          {scene.rooms.map((room) => {
            const pts = room.polygon.flatMap((p) => [p.x * PIXELS_PER_METER, p.y * PIXELS_PER_METER]);
            return (
              <Group key={room.id}>
                <Line points={pts} closed fill="rgba(59, 130, 246, 0.04)" stroke="rgba(59, 130, 246, 0.3)" strokeWidth={1} dash={[4, 4]} />
                <Text
                  x={room.polygon[0]!.x * PIXELS_PER_METER + 10}
                  y={room.polygon[0]!.y * PIXELS_PER_METER + 10}
                  text={room.name}
                  fontSize={14}
                  fill="#94a3b8"
                  fontFamily="Inter"
                />
              </Group>
            );
          })}
        </Layer>

        {/* Capa de Muros */}
        <Layer>
          {scene.walls.map((wall) => {
            const mat = scene.materials.find((m) => m.id === wall.materialId);
            const isSelected = wall.id === selectedWallId;
            const strokeColor = isSelected ? '#38bdf8' : mat?.color || '#94a3b8';
            const wallWidth = (wall.thickness || 0.2) * PIXELS_PER_METER;

            return (
              <Group
                key={wall.id}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedWall(wall.id);
                }}
              >
                <Line
                  points={[
                    wall.a.x * PIXELS_PER_METER,
                    wall.a.y * PIXELS_PER_METER,
                    wall.b.x * PIXELS_PER_METER,
                    wall.b.y * PIXELS_PER_METER
                  ]}
                  stroke={strokeColor}
                  strokeWidth={wallWidth}
                  lineCap="round"
                  lineJoin="round"
                  shadowColor={isSelected ? '#38bdf8' : undefined}
                  shadowBlur={isSelected ? 10 : 0}
                />
                {/* Extremos del muro */}
                <Circle x={wall.a.x * PIXELS_PER_METER} y={wall.a.y * PIXELS_PER_METER} radius={3} fill="#cbd5e1" />
                <Circle x={wall.b.x * PIXELS_PER_METER} y={wall.b.y * PIXELS_PER_METER} radius={3} fill="#cbd5e1" />
              </Group>
            );
          })}

          {/* Muro en proceso de dibujo */}
          {activeTool === 'wall' && drawingWallStart && (
            <Line
              points={[
                drawingWallStart.x * PIXELS_PER_METER,
                drawingWallStart.y * PIXELS_PER_METER,
                cursorWorldPos.x * PIXELS_PER_METER,
                cursorWorldPos.y * PIXELS_PER_METER
              ]}
              stroke="#38bdf8"
              strokeWidth={4}
              dash={[6, 6]}
              lineCap="round"
            />
          )}
        </Layer>

        {/* Capa de Routers */}
        <Layer>
          {scene.routers.map((router) => {
            const isSelected = router.id === selectedRouterId;
            const rx = router.pos.x * PIXELS_PER_METER;
            const ry = router.pos.y * PIXELS_PER_METER;

            // Círculo de cobertura estimada según cota superior (sección 8.7)
            // d_max = 10^((P_tx + G_tx + G_rx - P_min - 32.45 - 20*log10(f)) / 20)
            const pMin = simParams.deadZoneDbm;
            const fGhz = router.freqGHz;
            const exponent = (router.txPowerDbm + router.gainDbi + simParams.rxGainDbi - pMin - 32.45 - 20 * Math.log10(fGhz)) / 20;
            const dMaxMeters = Math.min(30, Math.pow(10, exponent));
            const dMaxPx = dMaxMeters * PIXELS_PER_METER;

            return (
              <Group
                key={router.id}
                x={rx}
                y={ry}
                draggable
                onDragMove={(e) => {
                  const newX = e.target.x() / PIXELS_PER_METER;
                  const newY = e.target.y() / PIXELS_PER_METER;
                  updateRouter(router.id, { pos: { x: newX, y: newY } });

                  // Disparar recálculo rápido en Worker (< 50ms)
                  if (schedulerRef.current) {
                    const updatedScene = {
                      ...scene,
                      routers: scene.routers.map((r) =>
                        r.id === router.id ? { ...r, pos: { x: newX, y: newY } } : r
                      )
                    };
                    schedulerRef.current.schedule(updatedScene, simParams, true);
                  }
                }}
                onDragEnd={(e) => {
                  const newX = e.target.x() / PIXELS_PER_METER;
                  const newY = e.target.y() / PIXELS_PER_METER;
                  updateRouter(router.id, { pos: { x: newX, y: newY } });

                  // Refinamiento de alta resolución
                  if (schedulerRef.current) {
                    const updatedScene = {
                      ...scene,
                      routers: scene.routers.map((r) =>
                        r.id === router.id ? { ...r, pos: { x: newX, y: newY } } : r
                      )
                    };
                    schedulerRef.current.schedule(updatedScene, simParams, false);
                  }
                }}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedRouter(router.id);
                }}
              >
                {/* Radio de cobertura estimada */}
                <Circle
                  radius={dMaxPx}
                  stroke={router.freqGHz === 2.4 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(168, 85, 247, 0.25)'}
                  strokeWidth={1}
                  dash={[6, 4]}
                  listening={false}
                />

                {/* Resplandor de selección */}
                {isSelected && <Circle radius={20} fill="rgba(56, 189, 248, 0.3)" />}

                {/* Icono del router */}
                <Circle
                  radius={12}
                  fill={router.freqGHz === 2.4 ? '#3b82f6' : '#a855f7'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  shadowColor="#000000"
                  shadowBlur={6}
                />

                {/* Ondas Wi-Fi concéntricas decorativas */}
                <Circle radius={6} stroke="#ffffff" strokeWidth={1.5} listening={false} />

                {/* Etiqueta de texto */}
                <Text
                  x={16}
                  y={-8}
                  text={`${router.name} (${router.freqGHz} GHz)`}
                  fontSize={12}
                  fontStyle="bold"
                  fill="#f8fafc"
                  fontFamily="Inter"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
