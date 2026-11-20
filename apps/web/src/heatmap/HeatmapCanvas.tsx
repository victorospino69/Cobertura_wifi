import React, { useEffect, useRef } from 'react';
import { HeatmapGrid } from '@wifi-planner/shared-types';
import { dbmToRgba } from './palette.js';

interface HeatmapCanvasProps {
  grid: HeatmapGrid | null;
  deadZoneDbm: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  pixelsPerMeter: number;
}

export const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({
  grid,
  deadZoneDbm,
  scale,
  offsetX,
  offsetY,
  width,
  height,
  pixelsPerMeter
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crear o redimensionar canvas offscreen para los datos crudos del grid
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenRef.current;
    if (offCanvas.width !== grid.width || offCanvas.height !== grid.height) {
      offCanvas.width = grid.width;
      offCanvas.height = grid.height;
    }

    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    const imgData = offCtx.createImageData(grid.width, grid.height);
    const data32 = new Uint32Array(imgData.data.buffer);

    for (let i = 0; i < grid.dbm.length; i++) {
      const v = grid.dbm[i]!;
      const rgba = dbmToRgba(v, deadZoneDbm);
      // Little-endian RGBA packing: ABGR in 32-bit uint
      data32[i] = (rgba.a << 24) | (rgba.b << 16) | (rgba.g << 8) | rgba.r;
    }

    offCtx.putImageData(imgData, 0, 0);

    // Limpiar canvas principal
    ctx.clearRect(0, 0, width, height);

    // Configurar transformaciones de zoom y pan
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Calcular posición y tamaño en píxeles del mundo
    const worldX = grid.originX * pixelsPerMeter;
    const worldY = grid.originY * pixelsPerMeter;
    const worldW = grid.width * grid.step * pixelsPerMeter;
    const worldH = grid.height * grid.step * pixelsPerMeter;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offCanvas, worldX, worldY, worldW, worldH);

    ctx.restore();
  }, [grid, deadZoneDbm, scale, offsetX, offsetY, width, height, pixelsPerMeter]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }}
    />
  );
};
