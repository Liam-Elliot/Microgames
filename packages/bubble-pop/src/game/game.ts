// Bubble Pop — shoot-and-match bubble shooter (match-3+ pop), minimal scope.
// Pure TS game model: no DOM/React/hex, RNG injected (style-guide §9).

// Structural RNG shape matching @arcadivision/shell's SeededRng.
export interface RngLike {
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

export const COLS = 9;
export const ROWS = 11; // row 0 = ceiling/top; bubbles stack downward toward launcher
export const MATCH = 3;
export const MAX_LIVES = 3;

export type Color = number; // 0..COLOR_COUNT-1
// Only 3 distinct shell hues are used (green/amber/red); keeping count aligned
// avoids two look-alike-but-nonmatching colors.
export const COLOR_COUNT = 3;

/** grid[row][col]; null = empty. row 0 is the ceiling. */
export type Grid = Array<Array<Color | null>>;

export type Phase = "menu" | "playing" | "over";

export interface GameState {
  phase: Phase;
  grid: Grid;
  /** index of the "ceiling surface height" used to know when a column is full */
  current: Color;
  next: Color;
  score: number;
  lives: number;
}

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
}

export function createGame(): GameState {
  return {
    phase: "menu",
    grid: emptyGrid(),
    current: 0,
    next: 0,
    score: 0,
    lives: MAX_LIVES,
  };
}

export function startGame(g: GameState, rng: RngLike): void {
  g.grid = emptyGrid();
  g.score = 0;
  g.lives = MAX_LIVES;
  g.phase = "playing";
  g.current = rng.int(0, COLOR_COUNT);
  g.next = rng.int(0, COLOR_COUNT);
}

/** Number of contiguous occupied cells in a column, from the ceiling (row 0) down. */
export function columnHeight(g: GameState, col: number): number {
  let h = 0;
  for (let r = 0; r < ROWS; r++) {
    if (g.grid[r][col] !== null) h++;
    else break;
  }
  return h;
}

/** True if every cell in the column is occupied (would reach the launcher). */
export function columnFull(g: GameState, col: number): boolean {
  return columnHeight(g, col) === ROWS;
}

function findConnected(g: GameState, col: number, row: number): Array<[number, number]> {
  const color = g.grid[row][col];
  if (color === null) return [];
  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  const stack: Array<[number, number]> = [[col, row]];
  const key = (c: number, r: number) => `${c},${r}`;
  while (stack.length) {
    const [c, r] = stack.pop()!;
    const k = key(c, r);
    if (seen.has(k)) continue;
    seen.add(k);
    if (g.grid[r][c] !== color) continue;
    out.push([c, r]);
    // 4-neighbors
    const nbrs: Array<[number, number]> = [
      [c + 1, r],
      [c - 1, r],
      [c, r + 1],
      [c, r - 1],
    ];
    for (const [nc, nr] of nbrs) {
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (!seen.has(key(nc, nr))) stack.push([nc, nr]);
    }
  }
  return out;
}

/** Which occupied cells are anchored to the ceiling (connected to row 0)? */
function anchored(g: GameState): Set<string> {
  const key = (c: number, r: number) => `${c},${r}`;
  const anchoredSet = new Set<string>();
  const stack: Array<[number, number]> = [];
  for (let c = 0; c < COLS; c++) {
    if (g.grid[0][c] !== null) stack.push([c, 0]);
  }
  while (stack.length) {
    const [c, r] = stack.pop()!;
    const k = key(c, r);
    if (anchoredSet.has(k)) continue;
    if (g.grid[r][c] === null) continue;
    anchoredSet.add(k);
    const nbrs: Array<[number, number]> = [
      [c + 1, r],
      [c - 1, r],
      [c, r + 1],
      [c, r - 1],
    ];
    for (const [nc, nr] of nbrs) {
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (!anchoredSet.has(key(nc, nr))) stack.push([nc, nr]);
    }
  }
  return anchoredSet;
}

export interface ShotResult {
  row: number; // row where the new bubble landed, or -1
  popped: number; // number of bubbles removed by the match
  dropped: number; // number of floating bubbles that fell
  overflowed: boolean; // column was full -> lost a life
}

/** Fire the current bubble up into `col`. Pure mutation of g. */
export function shoot(g: GameState, col: number): ShotResult {
  const res: ShotResult = { row: -1, popped: 0, dropped: 0, overflowed: false };
  if (col < 0 || col >= COLS || g.phase !== "playing") return res;

  if (columnFull(g, col)) {
    g.lives--;
    res.overflowed = true;
    if (g.lives <= 0) {
      g.phase = "over";
    }
    advanceColors(g);
    return res;
  }

  const row = columnHeight(g, col); // first empty cell below the stack
  g.grid[row][col] = g.current;
  res.row = row;

  // match-3+ pop
  const group = findConnected(g, col, row);
  if (group.length >= MATCH) {
    for (const [c, r] of group) {
      g.grid[r][c] = null;
    }
    res.popped = group.length;
    g.score += group.length * 10;
  }

  // gravity: drop floaters not anchored to the ceiling
  const anchoredSet = anchored(g);
  const dropped: Array<[number, number]> = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (g.grid[r][c] !== null && !anchoredSet.has(`${c},${r}`)) {
        g.grid[r][c] = null;
        dropped.push([c, r]);
      }
    }
  }
  res.dropped = dropped.length;
  if (res.dropped > 0) g.score += res.dropped * 5;

  advanceColors(g);
  return res;
}

function advanceColors(g: GameState): void {
  g.current = g.next;
  g.next = pickColor(g.next);
}

function pickColor(exclude: number): number {
  // deterministic simple rotation across COLOR_COUNT, offset to avoid repeats
  return (exclude + 1) % COLOR_COUNT;
}

/** Convenience: for tests — force set a bubble directly. */
export function placeForTest(g: GameState, col: number, row: number, color: Color): void {
  if (col >= 0 && col < COLS && row >= 0 && row < ROWS) g.grid[row][col] = color;
}
