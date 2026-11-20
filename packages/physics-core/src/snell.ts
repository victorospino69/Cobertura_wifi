/**
 * Ley de Snell y relaciones angulares de refracción
 */

export interface SnellResult {
  sinThetaI: number;
  cosThetaI: number;
  sinThetaT: number;
  cosThetaT: number;
  isTotalInternalReflection: boolean;
}

/**
 * Calcula los senos y cosenos de incidencia y transmisión según la Ley de Snell:
 * n1 * sin(theta_i) = n2 * sin(theta_t)
 *
 * @param cosI Coseno del ángulo de incidencia respecto a la normal (|dot(dir, normal)|), en [0, 1]
 * @param n1 Índice de refracción del medio 1 (típicamente aire, n1 ≈ 1)
 * @param n2 Índice de refracción del medio 2 (ej. n = sqrt(eps_r))
 */
export function snell(cosI: number, n1 = 1, n2: number): SnellResult {
  // Clamping cosI to [0, 1]
  const clampedCosI = Math.max(0, Math.min(1, Math.abs(cosI)));
  const sin2I = Math.max(0, 1 - clampedCosI * clampedCosI);
  const sinI = Math.sqrt(sin2I);

  const sinT = (n1 / n2) * sinI;

  if (sinT > 1 + 1e-9) {
    return {
      sinThetaI: sinI,
      cosThetaI: clampedCosI,
      sinThetaT: sinT,
      cosThetaT: 0,
      isTotalInternalReflection: true
    };
  }

  const clampedSinT = Math.min(1, sinT);
  const cosT = Math.sqrt(Math.max(0, 1 - clampedSinT * clampedSinT));

  return {
    sinThetaI: sinI,
    cosThetaI: clampedCosI,
    sinThetaT: sinT,
    cosThetaT: cosT,
    isTotalInternalReflection: false
  };
}

/**
 * Retorna cos(theta_t) a partir de cos(theta_i) y los índices n1, n2.
 * Si ocurre reflexión total interna o si cosT es extremadamente pequeño,
 * se retorna un límite inferior para evitar división por cero.
 */
export function snellCosT(cosI: number, n1 = 1, n2: number, minCosT = 0.05): number {
  const res = snell(cosI, n1, n2);
  if (res.isTotalInternalReflection) return minCosT;
  return Math.max(minCosT, res.cosThetaT);
}

/**
 * Calcula la longitud efectiva oblicua que el rayo recorre dentro de la pared
 * d_eff = thickness / cos(theta_t)
 */
export function obliqueThickness(thicknessM: number, cosT: number): number {
  const safeCosT = Math.max(0.05, cosT);
  return thicknessM / safeCosT;
}
