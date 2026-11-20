export interface Cx {
  re: number;
  im: number;
}

export const cx = (re: number, im = 0): Cx => ({ re, im });

export const cadd = (a: Cx, b: Cx): Cx => ({
  re: a.re + b.re,
  im: a.im + b.im
});

export const csub = (a: Cx, b: Cx): Cx => ({
  re: a.re - b.re,
  im: a.im - b.im
});

export const cmul = (a: Cx, b: Cx): Cx => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re
});

export const cdiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) return { re: Infinity, im: Infinity };
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d
  };
};

export const cabs = (a: Cx): number => Math.hypot(a.re, a.im);

export const csqrt = (z: Cx): Cx => {
  const m = cabs(z);
  return {
    re: Math.sqrt((m + z.re) / 2),
    im: Math.sign(z.im || 1) * Math.sqrt((m - z.re) / 2)
  };
};

export const cconj = (a: Cx): Cx => ({ re: a.re, im: -a.im });
