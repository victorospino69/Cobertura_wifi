import { Material, MaterialProps } from '@wifi-planner/shared-types';

export const SEED_MATERIALS: Material[] = [
  {
    id: 'mat_concrete',
    name: 'Concreto',
    color: '#808080',
    props: [
      {
        freqGHz: 2.4,
        epsR: 5.31,
        sigma: 0.066,
        attenuationDb: 12.5, // Punto medio 10-15 dB
        reflection: 0.39,
        thicknessM: 0.2
      },
      {
        freqGHz: 5.0,
        epsR: 5.31,
        sigma: 0.066,
        attenuationDb: 17.5, // Punto medio 15-20 dB
        reflection: 0.39,
        thicknessM: 0.2
      }
    ]
  },
  {
    id: 'mat_glass',
    name: 'Vidrio',
    color: '#88ccee',
    props: [
      {
        freqGHz: 2.4,
        epsR: 6.27,
        sigma: 0.009,
        attenuationDb: 3.0, // Punto medio 2-4 dB
        reflection: 0.43,
        thicknessM: 0.008 // 8 mm
      },
      {
        freqGHz: 5.0,
        epsR: 6.27,
        sigma: 0.009,
        attenuationDb: 4.5, // Punto medio 3-6 dB
        reflection: 0.43,
        thicknessM: 0.008
      }
    ]
  },
  {
    id: 'mat_wood',
    name: 'Madera',
    color: '#b5651d',
    props: [
      {
        freqGHz: 2.4,
        epsR: 1.99,
        sigma: 0.01,
        attenuationDb: 3.5, // Punto medio 3-4 dB
        reflection: 0.17,
        thicknessM: 0.04 // 4 cm
      },
      {
        freqGHz: 5.0,
        epsR: 1.99,
        sigma: 0.01,
        attenuationDb: 5.0, // Punto medio 4-6 dB
        reflection: 0.17,
        thicknessM: 0.04
      }
    ]
  },
  {
    id: 'mat_drywall',
    name: 'Panel de yeso',
    color: '#e5e0d8',
    props: [
      {
        freqGHz: 2.4,
        epsR: 2.94,
        sigma: 0.023,
        attenuationDb: 2.5, // Punto medio 2-3 dB
        reflection: 0.26,
        thicknessM: 0.024 // 1.2 cm x 2
      },
      {
        freqGHz: 5.0,
        epsR: 2.94,
        sigma: 0.023,
        attenuationDb: 4.0, // Punto medio 3-5 dB
        reflection: 0.26,
        thicknessM: 0.024
      }
    ]
  }
];

export class MaterialDB {
  private materials: Map<string, Material> = new Map();

  constructor(seedMaterials: Material[] = SEED_MATERIALS) {
    for (const m of seedMaterials) {
      this.materials.set(m.id, m);
    }
  }

  public add(m: Material): void {
    this.materials.set(m.id, m);
  }

  public get(id: string): Material | undefined {
    return this.materials.get(id);
  }

  public getAll(): Material[] {
    return Array.from(this.materials.values());
  }

  /**
   * Obtiene las propiedades de un material para una frecuencia dada (GHz),
   * interpolando linealmente si la frecuencia no coincide exactamente.
   */
  public at(id: string, freqGHz: number): MaterialProps {
    const mat = this.materials.get(id);
    if (!mat || mat.props.length === 0) {
      // Default fallback: 10 dB attenuation, standard dielectric
      return {
        freqGHz,
        epsR: 4.0,
        sigma: 0.01,
        attenuationDb: 10.0,
        reflection: 0.333,
        thicknessM: 0.15
      };
    }

    // Exact match
    const exact = mat.props.find((p) => Math.abs(p.freqGHz - freqGHz) < 1e-4);
    if (exact) return exact;

    // Single prop
    if (mat.props.length === 1) {
      const p = mat.props[0]!;
      return { ...p, freqGHz };
    }

    // Sort by frequency
    const sorted = [...mat.props].sort((a, b) => a.freqGHz - b.freqGHz);
    if (freqGHz <= sorted[0]!.freqGHz) {
      return { ...sorted[0]!, freqGHz };
    }
    if (freqGHz >= sorted[sorted.length - 1]!.freqGHz) {
      return { ...sorted[sorted.length - 1]!, freqGHz };
    }

    // Interpolate between two surrounding points
    let p0 = sorted[0]!;
    let p1 = sorted[1]!;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (freqGHz >= sorted[i]!.freqGHz && freqGHz <= sorted[i + 1]!.freqGHz) {
        p0 = sorted[i]!;
        p1 = sorted[i + 1]!;
        break;
      }
    }

    const t = (freqGHz - p0.freqGHz) / (p1.freqGHz - p0.freqGHz);
    return {
      freqGHz,
      epsR: p0.epsR + t * (p1.epsR - p0.epsR),
      sigma: p0.sigma + t * (p1.sigma - p0.sigma),
      attenuationDb: p0.attenuationDb + t * (p1.attenuationDb - p0.attenuationDb),
      reflection: p0.reflection + t * (p1.reflection - p0.reflection),
      thicknessM: p0.thicknessM + t * (p1.thicknessM - p0.thicknessM)
    };
  }
}
