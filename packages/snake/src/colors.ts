import { SeededRng } from "@arcadivision/shell";

/** Player/food color assignment (spec §3): random HSL hues, min angular separation. */
const SATURATION = 100;
const LIGHTNESS = 55;
const MIN_SEPARATION = 90; // degrees — 3 hues on the wheel, all pairwise ≥ 90°

export interface Hsl {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

export function hslCss({ h, s, l }: Hsl): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Roll three hues (p1, p2, food) with pairwise separation ≥ MIN_SEPARATION.
 * Food hue additionally avoids sitting exactly on green phosphor text tone.
 */
export function rollColors(rng: SeededRng): { p1: Hsl; p2: Hsl; food: Hsl } {
  const base = rng.int(0, 360);
  // evenly stagger three hues with random jitter that preserves min separation
  const gapJitter = () => rng.int(0, 120 - MIN_SEPARATION + 1); // leftover slack = 30°
  const g1 = MIN_SEPARATION + gapJitter();
  const g2 = MIN_SEPARATION + gapJitter();
  const p1: Hsl = { h: base % 360, s: SATURATION, l: LIGHTNESS };
  const p2: Hsl = { h: (base + g1) % 360, s: SATURATION, l: LIGHTNESS };
  const food: Hsl = { h: (base + g1 + g2) % 360, s: SATURATION, l: LIGHTNESS + 5 };
  return { p1, p2, food };
}
