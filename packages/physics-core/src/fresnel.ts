import { Cx, cadd, csub, cmul, cdiv, cabs, csqrt } from './complex.js';

export interface FresnelResult {
  gPerp: Cx; // Coeficiente de reflexión perpendicular (TE)
  gPar: Cx;  // Coeficiente de reflexión paralelo (TM)
  Rperp: number; // Reflectancia de potencia TE (|gPerp|^2)
  Rpar: number;  // Reflectancia de potencia TM (|gPar|^2)
  Ravg: number;  // Reflectancia promedio: (Rperp + Rpar) / 2
  Tp: number;    // Transmitancia de potencia en medio sin pérdidas: 1 - Ravg
}

/**
 * Coeficientes de Fresnel para ondas electromagnéticas con índice complejo
 * @param n1 Índice de refracción del medio incidente (ej. aire = { re: 1, im: 0 })
 * @param n2 Índice de refracción del medio transmisor/reflector
 * @param cosI Coseno del ángulo de incidencia con respecto a la normal (|dir · normal|)
 */
export function fresnel(n1: Cx, n2: Cx, cosI: number): FresnelResult {
  const clampedCosI = Math.max(0, Math.min(1, Math.abs(cosI)));
  const sin2 = Math.max(0, 1 - clampedCosI * clampedCosI);

  const r = cdiv(n1, n2);
  const cosT = csqrt(csub({ re: 1, im: 0 }, cmul(cmul(r, r), { re: sin2, im: 0 })));

  const a = cmul(n1, { re: clampedCosI, im: 0 });
  const b = cmul(n2, cosT);
  const c = cmul(n2, { re: clampedCosI, im: 0 });
  const d = cmul(n1, cosT);

  const gPerp = cdiv(csub(a, b), cadd(a, b)); // TE
  const gPar = cdiv(csub(c, d), cadd(c, d));  // TM

  const Rperp = cabs(gPerp) ** 2;
  const Rpar = cabs(gPar) ** 2;
  const Ravg = (Rperp + Rpar) / 2;
  const Tp = Math.max(0, 1 - Ravg);

  return {
    gPerp,
    gPar,
    Rperp,
    Rpar,
    Ravg,
    Tp
  };
}

/**
 * Ángulo de Brewster en radianes para dos medios dieléctricos sin pérdidas
 * theta_B = arctan(n2 / n1)
 */
export function brewsterAngle(n1: number, n2: number): number {
  return Math.atan(n2 / n1);
}
