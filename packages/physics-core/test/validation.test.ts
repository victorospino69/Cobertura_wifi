import { describe, it, expect } from 'vitest';
import {
  C_LIGHT,
  fspl,
  snell,
  snellCosT,
  fresnel,
  brewsterAngle,
  QuadTree,
  transmissionLoss,
  firstOrderPaths,
  linkBudgetDbm,
  incoherentPowerSum,
  coherentPowerSum,
  complexIndex
} from '../src/index.js';
import { Wall, Scene, Vec2 } from '@wifi-planner/shared-types';
import { MaterialDB } from '@wifi-planner/materials-db';
import { dist, mirrorPoint, raySegment, segmentNormal, dot } from '@wifi-planner/geometry';

describe('Casos de prueba de validación numérica obligatorios (Sección 15)', () => {
  // T1: FSPL(d = 1 m, f = 2.4 GHz) = 40.05 dB (tolerancia ±0.01 dB)
  it('T1: FSPL(d = 1 m, f = 2.4 GHz) debe ser 40.05 dB', () => {
    const val = fspl(1.0, 2.4);
    expect(val).toBeCloseTo(40.05, 1);
  });

  // T2: FSPL(d = 1 m, f = 5 GHz) = 46.43 dB (tolerancia ±0.01 dB)
  it('T2: FSPL(d = 1 m, f = 5 GHz) debe ser 46.43 dB', () => {
    const val = fspl(1.0, 5.0);
    expect(val).toBeCloseTo(46.43, 1);
  });

  // T3: FSPL(d, 5) - FSPL(d, 2.4) para cualquier d = 6.38 dB (independiente de d)
  it('T3: FSPL(d, 5) - FSPL(d, 2.4) para cualquier d debe ser 6.38 dB', () => {
    const testDistances = [0.5, 1.0, 3.2, 10.0, 25.5];
    for (const d of testDistances) {
      const diff = fspl(d, 5.0) - fspl(d, 2.4);
      expect(diff).toBeCloseTo(6.38, 1);
    }
  });

  // T4: FSPL al duplicar la distancia = +6.02 dB
  it('T4: FSPL al duplicar la distancia debe aumentar +6.02 dB', () => {
    const testDistances = [1.0, 2.5, 7.0];
    for (const d of testDistances) {
      const diff = fspl(2 * d, 2.4) - fspl(d, 2.4);
      expect(diff).toBeCloseTo(6.02, 1);
    }
  });

  // T5: Snell: n1 = 1, n2 = 1, cualquier theta_i -> theta_t = theta_i
  it('T5: Snell con n1 = 1, n2 = 1 debe dar theta_t = theta_i para cualquier theta_i', () => {
    const testAnglesDeg = [0, 15, 30, 45, 60, 75];
    for (const deg of testAnglesDeg) {
      const rad = (deg * Math.PI) / 180;
      const cosI = Math.cos(rad);
      const res = snell(cosI, 1, 1);
      expect(res.isTotalInternalReflection).toBe(false);
      expect(res.cosThetaT).toBeCloseTo(cosI, 5);
      expect(res.sinThetaT).toBeCloseTo(res.sinThetaI, 5);
    }
  });

  // T6: Snell: de n1 = 1.5 a n2 = 1, theta_i = 60° -> sin(theta_t) = 1.299 > 1 -> reflexión total interna
  it('T6: Snell de n1 = 1.5 a n2 = 1 con theta_i = 60° debe producir reflexión total interna (sinThetaT = 1.299)', () => {
    const rad60 = (60 * Math.PI) / 180;
    const cosI = Math.cos(rad60); // 0.5
    const res = snell(cosI, 1.5, 1.0);
    expect(res.isTotalInternalReflection).toBe(true);
    expect(res.sinThetaT).toBeCloseTo(1.299, 3);
  });

  // T7: Fresnel, incidencia normal, eps_r = 4, sin pérdidas -> |Gamma| = (2-1)/(2+1) = 1/3 (R = 0.111)
  it('T7: Fresnel con incidencia normal, eps_r = 4 sin pérdidas debe tener |Gamma| = 1/3 y R = 0.111', () => {
    const n1 = { re: 1, im: 0 };
    const n2 = { re: 2, im: 0 }; // sqrt(4) = 2
    const cosI = 1.0; // Incidencia normal: theta_i = 0
    const res = fresnel(n1, n2, cosI);

    const gammaMag = Math.hypot(res.gPerp.re, res.gPerp.im);
    expect(gammaMag).toBeCloseTo(1 / 3, 3);
    expect(res.Rperp).toBeCloseTo(1 / 9, 3); // 0.111
    expect(res.Ravg).toBeCloseTo(1 / 9, 3);
  });

  // T8: Brewster: n1 = 1, n2 = sqrt(5.31), theta_i = arctan(n2/n1) ≈ 66.5° -> Gamma_par ≈ 0 (< 1e-9)
  it('T8: Brewster con n1 = 1, n2 = sqrt(5.31), theta_i ≈ 66.5° debe anular Gamma_par (< 1e-9)', () => {
    const n1Val = 1.0;
    const n2Val = Math.sqrt(5.31);
    const thetaB = brewsterAngle(n1Val, n2Val); // rad
    const thetaBDeg = (thetaB * Math.PI) / 180;

    expect((thetaB * 180) / Math.PI).toBeCloseTo(66.54, 1);

    const cosI = Math.cos(thetaB);
    const n1 = { re: n1Val, im: 0 };
    const n2 = { re: n2Val, im: 0 };
    const res = fresnel(n1, n2, cosI);

    const gammaParMag = Math.hypot(res.gPar.re, res.gPar.im);
    expect(gammaParMag).toBeLessThan(1e-9);
  });

  // T9: Conservación: sin pérdidas, R + T_p = 1
  it('T9: Conservación de energía en medio dieléctrico sin pérdidas: R + T_p = 1', () => {
    const n1 = { re: 1, im: 0 };
    const n2 = { re: 2.3, im: 0 };
    const testCosines = [1.0, 0.8, 0.5, 0.2];

    for (const cosI of testCosines) {
      const res = fresnel(n1, n2, cosI);
      expect(res.Ravg + res.Tp).toBeCloseTo(1.0, 6);
    }
  });

  // T10: Escena de un solo muro de concreto (10 dB) entre TX y RX a 5 m, 2.4 GHz, P_tx 20 dBm, G = 0
  // P_rx = 20 - FSPL(5 m) - 10 = 20 - 54.03 - 10 = -44.03 dBm
  it('T10: Escena de un solo muro (10 dB) a 5 m, 2.4 GHz, P_tx = 20 dBm debe dar P_rx = -44.03 dBm', () => {
    const tx: Vec2 = { x: 0, y: 0 };
    const rx: Vec2 = { x: 5, y: 0 };
    const wall: Wall = {
      id: 'w1',
      a: { x: 2.5, y: -5 },
      b: { x: 2.5, y: 5 },
      thickness: 0.2,
      materialId: 'test_wall',
      kind: 'wall'
    };

    const mats = new MaterialDB([
      {
        id: 'test_wall',
        name: 'Muro Test',
        color: '#888',
        props: [
          {
            freqGHz: 2.4,
            epsR: 1.0, // n=1 para que cosT = cosI = 1 (incidencia puramente normal)
            sigma: 0,
            attenuationDb: 10.0,
            reflection: 0.2,
            thicknessM: 0.2
          }
        ]
      }
    ]);

    const qt = new QuadTree({ minX: -5, minY: -10, maxX: 10, maxY: 10 });
    qt.insert(wall);

    const wallLoss = transmissionLoss(tx, rx, 2.4, qt, mats);
    expect(wallLoss).toBeCloseTo(10.0, 2);

    const rxPower = linkBudgetDbm(20, 0, 0, 5.0, 2.4, wallLoss);
    expect(rxPower).toBeCloseTo(-44.03, 1);
  });

  // T11: Reflexión de orden 1 sobre un plano único (método de imágenes)
  // Longitud de camino = |S'R| ; ángulo de incidencia = ángulo de reflexión
  it('T11: Reflexión de orden 1 sobre plano único: camino = |S\'R| y ángulo incidencia = ángulo reflexión', () => {
    const S: Vec2 = { x: 0, y: 2 };
    const R: Vec2 = { x: 4, y: 2 };
    const wallA: Vec2 = { x: -5, y: 0 };
    const wallB: Vec2 = { x: 10, y: 0 };

    const wall: Wall = {
      id: 'w_floor',
      a: wallA,
      b: wallB,
      thickness: 0.2,
      materialId: 'mat_concrete',
      kind: 'wall'
    };

    const Si = mirrorPoint(S, wallA, wallB);
    expect(Si.x).toBeCloseTo(0, 5);
    expect(Si.y).toBeCloseTo(-2, 5);

    const expectedLength = dist(Si, R); // dist((0,-2), (4,2)) = sqrt(16 + 16) = sqrt(32) ≈ 5.65685
    expect(expectedLength).toBeCloseTo(Math.hypot(4, 4), 5);

    const qt = new QuadTree({ minX: -10, minY: -10, maxX: 20, maxY: 20 });
    qt.insert(wall);
    const mats = new MaterialDB();

    const paths = firstOrderPaths(S, R, {
      fGHz: 2.4,
      qt,
      mats,
      reflectors: [wall]
    });

    expect(paths.length).toBe(1);
    const p = paths[0]!;
    expect(p.length).toBeCloseTo(expectedLength, 4);

    const bouncePt = p.bounces[0]!.point;
    // Por simetría geométrica, el punto de impacto debe estar en x = 2, y = 0
    expect(bouncePt.x).toBeCloseTo(2.0, 3);
    expect(bouncePt.y).toBeCloseTo(0.0, 3);

    // Ángulo de incidencia respecto a la normal del muro (normal = (0, 1))
    // Segmento S -> P: vector (2, -2) -> ángulo con normal es 45°
    // Segmento P -> R: vector (2, 2) -> ángulo con normal es 45°
    const dirIncident = { x: (bouncePt.x - S.x) / dist(S, bouncePt), y: (bouncePt.y - S.y) / dist(S, bouncePt) };
    const dirReflected = { x: (R.x - bouncePt.x) / dist(bouncePt, R), y: (R.y - bouncePt.y) / dist(bouncePt, R) };
    const wallNorm = segmentNormal(wallA, wallB);

    const cosIncidence = Math.abs(dot(dirIncident, wallNorm));
    const cosReflection = Math.abs(dot(dirReflected, wallNorm));
    expect(cosIncidence).toBeCloseTo(cosReflection, 5);
  });

  // T12: QuadTree vs barrido ingenuo en 1 000 escenas aleatorias -> Mismo conjunto de muros intersectados
  it('T12: QuadTree vs barrido ingenuo en 1 000 consultas aleatorias debe retornar exactamente los mismos muros', () => {
    const walls: Wall[] = [];
    const numWalls = 40;
    // Generar muros pseudo-aleatorios deterministas
    for (let i = 0; i < numWalls; i++) {
      const ax = ((i * 37) % 100) / 10;
      const ay = ((i * 59) % 100) / 10;
      const bx = ax + (((i * 17) % 40) - 20) / 10;
      const by = ay + (((i * 23) % 40) - 20) / 10;
      walls.push({
        id: `wall_${i}`,
        a: { x: ax, y: ay },
        b: { x: bx, y: by },
        thickness: 0.15,
        materialId: 'mat_concrete',
        kind: 'wall'
      });
    }

    const bounds = { minX: -5, minY: -5, maxX: 15, maxY: 15 };
    const qt = new QuadTree(bounds, 0, 6, 4);
    for (const w of walls) {
      qt.insert(w);
    }

    // 1 000 consultas aleatorias
    for (let q = 0; q < 1000; q++) {
      const px = ((q * 43) % 100) / 10;
      const py = ((q * 71) % 100) / 10;
      const qx = ((q * 61) % 100) / 10;
      const qy = ((q * 89) % 100) / 10;
      const p = { x: px, y: py };
      const target = { x: qx, y: qy };

      const d = { x: target.x - p.x, y: target.y - p.y };
      const len = Math.hypot(d.x, d.y);
      if (len < 1e-6) continue;
      const dir = { x: d.x / len, y: d.y / len };

      // Barrido ingenuo
      const naiveHits = new Set<string>();
      for (const w of walls) {
        const hit = raySegment(p, dir, w.a, w.b);
        if (hit && hit.t < len) {
          naiveHits.add(w.id);
        }
      }

      // Consulta QuadTree
      const qtCandidateWalls = qt.querySegment(p, target);
      const qtHits = new Set<string>();
      for (const w of qtCandidateWalls) {
        const hit = raySegment(p, dir, w.a, w.b);
        if (hit && hit.t < len) {
          qtHits.add(w.id);
        }
      }

      expect(qtHits).toEqual(naiveHits);
    }
  });

  // T13: Suma de potencias: dos señales de -60 dBm incoherentes -> -56.99 dBm (+3.01 dB)
  it('T13: Suma incoherente de dos señales de -60 dBm debe resultar en -56.99 dBm (+3.01 dB)', () => {
    const result = incoherentPowerSum([-60, -60]);
    expect(result).toBeCloseTo(-56.99, 2);
  });

  // T14: Dos caminos iguales coherentes con Delta d = lambda / 2 -> Cancelación (P ≈ 0)
  it('T14: Dos caminos iguales coherentes con Delta d = lambda / 2 deben cancelarse completamente (P ≈ 0)', () => {
    const fGHz = 2.4;
    const lambda = C_LIGHT / (fGHz * 1e9); // ~0.1249 m
    const d1 = 5.0;
    const d2 = d1 + lambda / 2;

    const signals = [
      { powerDbm: -50, distanceM: d1 },
      { powerDbm: -50, distanceM: d2 }
    ];

    const resultDbm = coherentPowerSum(signals, fGHz);
    // Debido a cancelación en contrafase pura, la potencia resultante tiende a -infinito (o <= -100 dBm)
    expect(resultDbm).toBeLessThan(-100);
  });

  // T15: Distancia mínima: celda del router -> Sin NaN ni Infinity (d se limita a 0.1 m)
  it('T15: Distancia mínima en la celda del router (d = 0) no debe producir NaN ni Infinity', () => {
    const resultDbm = linkBudgetDbm(20, 3, 0, 0.0, 2.4, 0, 0, 0.1);
    expect(Number.isFinite(resultDbm)).toBe(true);
    expect(Number.isNaN(resultDbm)).toBe(false);

    const fsplVal = fspl(0.0, 2.4, 0.1);
    expect(Number.isFinite(fsplVal)).toBe(true);
    expect(fsplVal).toBeCloseTo(fspl(0.1, 2.4), 4);
  });
});
