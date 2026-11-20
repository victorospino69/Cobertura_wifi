import { EPS0, MU0 } from './constants.js';
import { Cx, csqrt } from './complex.js';

/**
 * Calcula el índice de refracción complejo:
 * n = sqrt(eps_r - j * sigma / (omega * eps0))
 * con convención e^{j omega t} (imaginario negativo)
 */
export function complexIndex(epsR: number, sigma: number, fHz: number): Cx {
  const omega = 2 * Math.PI * fHz;
  const im = -sigma / (omega * EPS0);
  return csqrt({ re: epsR, im });
}

/**
 * Coeficiente de atenuación electromagnética alfa en Neperios por metro (Np/m)
 * alpha = omega * sqrt(mu * eps / 2) * sqrt( sqrt(1 + (sigma / (omega * eps))^2) - 1 )
 */
export function attenuationConstantAlpha(epsR: number, sigma: number, fHz: number): number {
  if (sigma <= 0) return 0;
  const omega = 2 * Math.PI * fHz;
  const eps = epsR * EPS0;
  const mu = MU0;

  const lossTangent = sigma / (omega * eps);
  const factor = Math.sqrt(1 + lossTangent * lossTangent) - 1;
  return omega * Math.sqrt((mu * eps) / 2) * Math.sqrt(factor);
}

/**
 * Pérdida de atenuación específica en decibelios por metro (dB/m)
 * alpha_dB = 20 * log10(e) * alpha ≈ 8.685889638 * alpha
 */
export function attenuationDbPerMeter(epsR: number, sigma: number, fHz: number): number {
  const alpha = attenuationConstantAlpha(epsR, sigma, fHz);
  return 8.685889638 * alpha;
}

/**
 * Estima la pérdida de transmisión normal de un muro a partir de sus parámetros dieléctricos
 */
export function estimateWallLossDb(epsR: number, sigma: number, fHz: number, thicknessM: number): number {
  return attenuationDbPerMeter(epsR, sigma, fHz) * thicknessM;
}
