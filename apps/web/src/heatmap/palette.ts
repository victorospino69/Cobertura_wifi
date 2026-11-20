/**
 * Paleta Turbo (perceptualmente uniforme de Google) adaptada para mapas de calor Wi-Fi
 * Rango fijo: -100 dBm (mínimo) a -30 dBm (máximo)
 */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Polinomio de aproximación para paleta Turbo de Google
function turboColormap(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));

  const r =
    34.61 +
    x * (1172.42 + x * (-1079.01 + x * (-3302.71 + x * (7975.09 - x * 4814.0))));
  const g =
    23.31 +
    x * (557.33 + x * (1225.33 + x * (-3574.96 + x * (1073.77 + x * 707.56))));
  const b =
    27.2 +
    x * (3211.1 - x * (15327.97 - x * (27814.0 - x * (22569.18 - x * 6838.66))));

  return [
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b)))
  ];
}

export const MIN_DBM = -100;
export const MAX_DBM = -30;

/**
 * Convierte un valor de dBm a color RGBA según la paleta Turbo
 */
export function dbmToRgba(dbm: number, deadZoneThreshold = -75, opacity = 0.85): RGBA {
  if (Number.isNaN(dbm)) {
    return { r: 0, g: 0, b: 0, a: 0 }; // Fuera del plano / exterior
  }

  // Normalizar entre 0 y 1
  const t = (dbm - MIN_DBM) / (MAX_DBM - MIN_DBM);
  const clampedT = Math.max(0, Math.min(1, t));
  const [r, g, b] = turboColormap(clampedT);

  // Zona muerta (< deadZoneThreshold): ligera reducción de opacidad o atenuación
  const a = dbm < deadZoneThreshold ? Math.round(opacity * 255 * 0.45) : Math.round(opacity * 255);

  return { r, g, b, a };
}

/**
 * Obtiene el color de calidad para la UI (Excelente, Buena, Aceptable, Débil, Zona Muerta)
 */
export function getQualityLabel(dbm: number): { label: string; color: string } {
  if (dbm >= -50) return { label: 'Excelente', color: '#22c55e' };
  if (dbm >= -67) return { label: 'Buena', color: '#3b82f6' };
  if (dbm >= -75) return { label: 'Aceptable', color: '#eab308' };
  if (dbm >= -85) return { label: 'Débil', color: '#f97316' };
  return { label: 'Zona muerta', color: '#ef4444' };
}
