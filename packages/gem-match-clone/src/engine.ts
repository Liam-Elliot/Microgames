/** Gem-match engine — deterministic randomness via injected RNG. Spec: decision-locked. */

export const SIZE = 8;
export const COLOR_COUNT = 6;

export type Special = null | "line-h" | "line-v" | "color" | "radius";

export interface Cell {
  readonly color: number;
  readonly special: Special;
}

export interface ResolutionStep {
  cleared: number;          // gems cleared this step (incl. special detonations)
  specialsTriggered: number;
  points: number;           // after multiplier
}

export interface MoveResult {
  legal: boolean;
  steps: readonly ResolutionStep[];
  totalPoints: number;
}

export type Rng = { int(a: number, b: number): number };

const cell = (color: number, special: Special = null): Cell => ({ color, special });

export function normal(color: number): Cell {
  return cell(color);
}

export function randomCell(rng: Rng): Cell {
  return cell(rng.int(0, COLOR_COUNT));
}

export type Board = Cell[][]; // [row][col], row 0 = top

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => cell(0)));
}

/** Fill avoiding initial matches (spec §2). */
export function fillBoard(rng: Rng): Board {
  const b = emptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let color = rng.int(0, COLOR_COUNT);
      let guard = 0;
      // avoid creating an immediate 3-line with left/up neighbors
      while (guard++ < 20 && createsMatchAt(b, r, c, color)) color = rng.int(0, COLOR_COUNT);
      b[r][c] = cell(color);
    }
  }
  return b;
}

function createsMatchAt(b: Board, r: number, c: number, color: number): boolean {
  if (c >= 2 && b[r][c - 1].color === color && b[r][c - 2].color === color) return true;
  if (r >= 2 && b[r - 1][c].color === color && b[r - 2][c].color === color) return true;
  return false;
}

/** All match runs (≥3) as coordinate lists. */
export function findMatches(b: Board): Array<Array<{ r: number; c: number }>> {
  const runs: Array<Array<{ r: number; c: number }>> = [];
  // horizontal
  for (let r = 0; r < SIZE; r++) {
    let c = 0;
    while (c < SIZE) {
      const run = sameRun(b, r, c, 0, 1);
      if (run.length >= 3) runs.push(run);
      c += run.length || 1;
    }
  }
  // vertical
  for (let c = 0; c < SIZE; c++) {
    let r = 0;
    while (r < SIZE) {
      const run = sameRun(b, r, c, 1, 0);
      if (run.length >= 3) runs.push(run);
      r += run.length || 1;
    }
  }
  return runs;
}

function sameRun(b: Board, r0: number, c0: number, dr: number, dc: number): Array<{ r: number; c: number }> {
  const color = b[r0][c0].color;
  const run = [{ r: r0, c: c0 }];
  let r = r0 + dr, c = c0 + dc;
  while (r < SIZE && c < SIZE && b[r][c].color === color) {
    run.push({ r, c });
    r += dr; c += dc;
  }
  return run;
}

export function swapLegal(b: Board, r1: number, c1: number, r2: number, c2: number): boolean {
  // color bomb: swapping it with anything triggers it (spec §5)
  if (b[r1][c1].special === "color" || b[r2][c2].special === "color") return true;
  const t = clone(b);
  swapCells(t, r1, c1, r2, c2);
  return findMatches(t).length > 0;
}

export function clone(b: Board): Board {
  return b.map((row) => row.map((x) => ({ ...x })));
}

function swapCells(b: Board, r1: number, c1: number, r2: number, c2: number): void {
  const t = b[r1][c1];
  b[r1][c1] = b[r2][c2];
  b[r2][c2] = t;
}

export function anyLegalMove(b: Board): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE && swapLegal(b, r, c, r, c + 1)) return true;
      if (r + 1 < SIZE && swapLegal(b, r, c, r + 1, c)) return true;
    }
  }
  return false;
}

export function makePlayable(b: Board, rng: Rng): Board {
  let out = b;
  let guard = 0;
  while (guard++ < 200 && (findMatches(out).length > 0 || !anyLegalMove(out))) {
    if (findMatches(out).length > 0) {
      // clear unintended spawn matches, refill those cells (spec §2)
      for (const run of findMatches(out)) {
        for (const { r, c } of run) out[r][c] = randomCell(rng);
      }
    } else {
      // deadlock → reshuffle existing gems into new positions (spec §7)
      const gems = out.flat();
      shuffle(gems, rng);
      out = gems.reduce<Board>(
        (acc, g, i) => {
          acc[Math.floor(i / SIZE)][i % SIZE] = { ...g };
          return acc;
        },
        emptyBoard(),
      );
    }
  }
  return out;
}

function shuffle<T>(arr: T[], rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function newBoard(rng: Rng): Board {
  return makePlayable(fillBoard(rng), rng);
}

/**
 * Player move: swap, then resolve cascades.
 * Returns the post-move board (new object) + result. If illegal, returns original board.
 */
export function playMove(bIn: Board, r1: number, c1: number, r2: number, c2: number, rng: Rng): { board: Board; result: MoveResult } {
  if (!swapLegal(bIn, r1, c1, r2, c2)) {
    return { board: bIn, result: { legal: false, steps: [], totalPoints: 0 } };
  }
  const b = clone(bIn);
  swapCells(b, r1, c1, r2, c2);
  const steps: ResolutionStep[] = [];
  let stepIndex = 0;

  // color bomb swap trigger: bomb clears all gems of the color it was swapped with
  const bombAt = (r: number, c: number): boolean => b[r][c].special === "color";
  if (bombAt(r1, c1) || bombAt(r2, c2)) {
    const [br, bc, or, oc] = bombAt(r1, c1) ? [r1, c1, r2, c2] : [r2, c2, r1, c1];
    const target = b[or][oc].color;
    detonateColorBomb(b, br, bc, target);
  }

  let resolving = true;
  while (resolving) {
    stepIndex++;
    const res = resolveStep(b, rng, stepIndex);
    if (res.cleared === 0) {
      resolving = false;
      if (stepIndex === 1 && steps.length === 0) {
        // swap triggered bomb but no board matches: nothing further
      }
    } else {
      steps.push({ cleared: res.cleared, specialsTriggered: res.specialsTriggered, points: res.points });
    }
  }
  const totalPoints = steps.reduce((sum, s) => sum + s.points, 0);
  const final = makePlayable(b, rng);
  return { board: final, result: { legal: true, steps, totalPoints } };
}

function detonateColorBomb(b: Board, r: number, c: number, targetColor: number): void {
  b[r][c] = cell(b[r][c].color, null); // consumed below anyway; mark via direct clear
  for (let rr = 0; rr < SIZE; rr++) {
    for (let cc = 0; cc < SIZE; cc++) {
      if (b[rr][cc].color === targetColor && !(rr === r && cc === c)) b[rr][cc] = cell(-1);
    }
  }
  b[r][c] = cell(-1);
}

/** One cascade step: find matches, create specials, detonate specials caught in matches, clear, gravity, refill. */
function resolveStep(b: Board, rng: Rng, multiplier: number): { cleared: number; specialsTriggered: number; points: number } {
  let matches = findMatches(b);
  // include cells already marked cleared (color bomb residue)
  let specialsTriggered = 0;
  const toClear = new Set<string>();
  const key = (r: number, c: number): string => `${r},${c}`;

  // collect cells pre-marked (from color bomb)
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c].color === -1) toClear.add(key(r, c));
    }
  }

  // determine special creations: longest run per (row/col intersection handling simplified)
  const creations: Array<{ r: number; c: number; special: Special }> = [];
  const covered = new Set<string>();
  for (const run of matches) {
    if (run.length === 4) {
      const horiz = run.every((p, i) => i === 0 || p.r === run[0].r);
      const mid = run[1];
      creations.push({ r: mid.r, c: mid.c, special: horiz ? "line-h" : "line-v" });
    } else if (run.length >= 5) {
      const horiz = run.every((p, i) => i === 0 || p.r === run[0].r);
      if (horiz || run.every((p, i) => i === 0 || p.c === run[0].c)) {
        creations.push({ r: run[Math.floor(run.length / 2)].r, c: run[Math.floor(run.length / 2)].c, special: "color" });
      } else {
        // L/T shape (crossing runs) → radius bomb
        creations.push({ r: run[Math.floor(run.length / 2)].r, c: run[Math.floor(run.length / 2)].c, special: "radius" });
      }
    }
  }
  // L/T detection via intersecting runs (horizontal ∩ vertical sharing a cell)
  const hRuns = matches.filter((run) => run.length >= 3 && run[0].r === run[run.length - 1].r);
  const vRuns = matches.filter((run) => run.length >= 3 && run[0].c === run[run.length - 1].c);
  for (const h of hRuns) {
    for (const v of vRuns) {
      const cross = h.find((p) => v.some((q) => q.r === p.r && q.c === p.c));
      if (cross && !covered.has(key(cross.r, cross.c))) {
        covered.add(key(cross.r, cross.c));
        creations.push({ r: cross.r, c: cross.c, special: "radius" });
      }
    }
  }

  for (const run of matches) {
    for (const p of run) toClear.add(key(p.r, p.c));
  }

  // specials caught in a match detonate (spec §5)
  const detonated: Array<{ r: number; c: number }> = [];
  for (const k of toClear) {
    const [r, c] = k.split(",").map(Number);
    const sp = b[r][c].special;
    if (sp && sp !== "color") {
      detonated.push({ r, c });
      specialsTriggered++;
      if (sp === "line-h") for (let cc = 0; cc < SIZE; cc++) toClear.add(key(r, cc));
      if (sp === "line-v") for (let rr = 0; rr < SIZE; rr++) toClear.add(key(rr, c));
      if (sp === "radius") {
        for (let rr = r - 1; rr <= r + 1; rr++) {
          for (let cc = c - 1; cc <= c + 1; cc++) {
            if (rr >= 0 && cc >= 0 && rr < SIZE && cc < SIZE) toClear.add(key(rr, cc));
          }
        }
      }
    }
  }

  let cleared = 0;
  const creationSet = new Map(creations.map((cr) => [key(cr.r, cr.c), cr.special]));
  for (const k of toClear) {
    const [r, c] = k.split(",").map(Number);
    if (creationSet.has(k)) {
      b[r][c] = cell(b[r][c].color, creationSet.get(k) ?? null); // becomes the special gem
      creationSet.delete(k);
    } else {
      b[r][c] = cell(-2); // cleared marker
      cleared++;
    }
  }
  // detonated special cells themselves are cleared too
  for (const d of detonated) {
    if (b[d.r][d.c].special) b[d.r][d.c] = cell(-2);
  }

  if (cleared === 0 && toClear.size === 0) return { cleared: 0, specialsTriggered, points: 0 };

  // gravity + refill
  for (let c = 0; c < SIZE; c++) {
    const column: Cell[] = [];
    for (let r = SIZE - 1; r >= 0; r--) {
      if (b[r][c].color !== -2) column.push(b[r][c]);
    }
    for (let r = SIZE - 1, i = 0; r >= 0; r--, i++) {
      b[r][c] = i < column.length ? column[i] : randomCell(rng);
    }
  }

  const points = cleared * 10 * multiplier + specialsTriggered * 50;
  return { cleared, specialsTriggered, points };
}
