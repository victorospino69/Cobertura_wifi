import { C_LIGHT } from './constants.js';
import { fspl } from './fspl.js';

export function dbmToMW(dBm: number): number {
  return Math.pow(10, dBm / 10);
}

export function mWToDbm(mW: number): number {
  if (mW <= 1e-15) return -150;
  return 10 * Math.log10(mW);
}

/**
 * Calcula la potencia recibida en dBm para un único camino (directo o reflejado)
 */
export function linkBudgetDbm(
  txPowerDbm: number,
  txGainDbi: number,
  rxGainDbi: number,
  distanceM: number,
  freqGHz: number,
  wallLossDb = 0,
  reflectionLossDb = 0,
  minDistanceM = 0.1
): number {
  const d = Math.max(distanceM, minDistanceM);
  const pathLossDb = fspl(d, freqGHz, minDistanceM);
  return txPowerDbm + txGainDbi + rxGainDbi - pathLossDb - wallLossDb - reflectionLossDb;
}

/**
 * Suma incoherente de potencias: P_total = sum(P_i) en mW, convertido a dBm al final
 */
export function incoherentPowerSum(powersDbm: number[]): number {
  if (powersDbm.length === 0) return -150;
  let totalMW = 0;
  for (const p of powersDbm) {
    totalMW += dbmToMW(p);
  }
  return mWToDbm(totalMW);
}

export interface RayPathSignal {
  powerDbm: number;
  distanceM: number;
  phaseShiftRad?: number;
}

/**
 * Suma coherente de señales considerando fase y longitud de camino:
 * E_i = sqrt(P_i) * exp(-j * (2 * PI * d_i / lambda + phi_refl))
 * P_total = |sum(E_i)|^2
 */
export function coherentPowerSum(signals: RayPathSignal[], freqGHz: number): number {
  if (signals.length === 0) return -150;
  const lambda = C_LIGHT / (freqGHz * 1e9);

  let sumRe = 0;
  let sumIm = 0;

  for (const sig of signals) {
    const amplitude = Math.sqrt(dbmToMW(sig.powerDbm));
    const phase = (2 * Math.PI * sig.distanceM) / lambda + (sig.phaseShiftRad || 0);

    sumRe += amplitude * Math.cos(phase);
    sumIm -= amplitude * Math.sin(phase);
  }

  const totalMW = sumRe * sumRe + sumIm * sumIm;
  return mWToDbm(totalMW);
}
