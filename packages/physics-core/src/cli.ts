import * as fs from 'fs';
import * as path from 'path';
import { SceneSchema, SimParams } from '@wifi-planner/shared-types';
import { SimulationEngine } from './simulation-engine.js';

function formatAsciiHeatmap(dbmGrid: Float32Array, width: number, height: number): string {
  // Mapeo ASCII según umbrales de la sección 8.8
  const chars: string[] = [];
  for (let r = 0; r < height; r++) {
    let line = '';
    for (let c = 0; c < width; c++) {
      const v = dbmGrid[r * width + c]!;
      if (Number.isNaN(v)) {
        line += ' ';
      } else if (v >= -50) {
        line += '█'; // Excelente
      } else if (v >= -67) {
        line += '▓'; // Buena
      } else if (v >= -75) {
        line += '▒'; // Aceptable
      } else if (v >= -85) {
        line += '░'; // Débil
      } else {
        line += '·'; // Zona muerta (< -85 dBm)
      }
    }
    chars.push(line);
  }
  return chars.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0] || 'escena.json';
  const resolvedPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Archivo de escena no encontrado en '${resolvedPath}'`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`📡 Simulación de Cobertura Wi-Fi (CLI physics-core)`);
  console.log(`📄 Archivo: ${filePath}`);
  console.log(`======================================================\n`);

  const fileData = fs.readFileSync(resolvedPath, 'utf-8');
  const rawJson = JSON.parse(fileData);
  const scene = SceneSchema.parse(rawJson);

  const params: SimParams = {
    gridStepM: 0.5, // 0.5m para visualización limpia en terminal
    maxReflections: 0,
    coherent: false,
    rxGainDbi: 0,
    noiseFloorDbm: -95,
    deadZoneDbm: -75,
    minDistanceM: 0.1,
    pruneBelowDbm: -100
  };

  const engine = new SimulationEngine();
  const result = engine.run(scene, params);

  console.log(`Mapa de Cobertura ASCII (${result.grid.width}x${result.grid.height} celdas, resolución: ${result.grid.step}m):`);
  console.log(`[█ >= -50 dBm | ▓ -67 dBm | ▒ -75 dBm | ░ -85 dBm | · Zona muerta]\n`);
  console.log(formatAsciiHeatmap(result.grid.dbm, result.grid.width, result.grid.height));

  console.log(`\n------------------ Estadísticas ------------------`);
  console.log(`Cobertura (>= ${params.deadZoneDbm} dBm):  ${result.stats.coveragePct}%`);
  console.log(`Zona muerta (< ${params.deadZoneDbm} dBm): ${result.stats.deadZonePct}% (${result.stats.deadZoneAreaM2} m²)`);
  console.log(`RSSI medio:                  ${result.stats.meanDbm} dBm`);
  console.log(`Percentil 5 (p5):            ${result.stats.p5Dbm} dBm`);
  console.log(`Tiempo de cómputo:           ${result.durationMs} ms`);
  console.log(`--------------------------------------------------\n`);
}

main().catch((err) => {
  console.error('Error durante la simulación:', err);
  process.exit(1);
});
