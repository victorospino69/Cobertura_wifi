import { C_LIGHT } from './constants.js';

/**
 * Pérdida en espacio libre (FSPL) en dB
 * @param distanceM Distancia en metros (se limita inferiormente a minDistanceM)
 * @param freqGHz Frecuencia en GHz (ej. 2.4 o 5.0)
 * @param minDistanceM Distancia mínima para evitar la singularidad de log10(0) (por defecto 0.1 m)
 */
export function fspl(distanceM: number, freqGHz: number, minDistanceM = 0.1): number {
  const d = Math.max(distanceM, minDistanceM);
  const fHz = freqGHz * 1e9;
  // FSPL(dB) = 20 * log10(4 * PI * d * f / c)
  return 20 * Math.log10((4 * Math.PI * d * fHz) / C_LIGHT);
}
