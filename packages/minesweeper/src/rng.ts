// Deterministic seeded RNG.
// Structural shape matches @arcadivision/shell's SeededRng so it can be
// swapped in one line: pass `seededRng(seed)` from shell into createGame.
// No Math.random anywhere in game logic (style-guide §0.5 / §9).

export interface RngLike {
  /** Float in [0, 1) */
  next(): number;
  /** Integer in [minInclusive, maxExclusive) */
  int(minInclusive: number, maxExclusive: number): number;
  /** Random element */
  pick<T>(items: readonly T[]): T;
}

/** mulberry32 implementation matching shell's SeededRng. */
export class SeededRng implements RngLike {
  private state: number;

  constructor(seed: number | string = 1) {
    this.state = typeof seed === "string" ? hashString(seed) : seed >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(minInclusive: number, maxExclusive: number): number {
    return minInclusive + Math.floor(this.next() * (maxExclusive - minInclusive));
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length)];
  }

  /** Fisher-Yates shuffle of a copy (deterministic given seed). */
  shuffle<T>(items: readonly T[]): T[] {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRng(seed?: number | string): SeededRng {
  return new SeededRng(seed);
}
