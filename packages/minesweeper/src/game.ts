// Minesweeper — decoupled game model (no DOM/React/framework dependency).
// Deterministic (seeded RNG), first-click-safe reveal.

import { SeededRng, type RngLike } from "./rng.js";

export type Rng = RngLike;

function rngInt(rng: Rng, min: number, max: number): number {
  return rng.int(min, max + 1);
}

export const MINE = -1;

export interface Cell {
  value: number; // MINE (-1) or adjacent-mine count 0..8
  revealed: boolean;
  flagged: boolean;
  exploded: boolean; // the mine that ended the game
}

export type Difficulty = "beginner" | "intermediate" | "expert";

export interface DifficultySpec {
  width: number;
  height: number;
  mines: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultySpec> = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
};

export interface GameState {
  width: number;
  height: number;
  mines: number;
  cells: Cell[]; // row-major, [y*width + x]
  phase: "ready" | "playing" | "won" | "lost";
  flagsRemaining: number;
  firstRevealDone: boolean;
  rng: Rng;
  seed: number;
}

export interface Config {
  seed: number;
  difficulty: Difficulty;
}

export const DEFAULT_CONFIG: Config = {
  seed: 987654,
  difficulty: "beginner",
};

function idx(state: { width: number }, x: number, y: number): number {
  return y * state.width + x;
}

function inBounds(w: number, h: number, x: number, y: number): boolean {
  return x >= 0 && x < w && y >= 0 && y < h;
}

export function createGame(
  config: Partial<Config> = {},
  rngIn?: Rng,
): GameState {
  const cfg: Config = { ...DEFAULT_CONFIG, ...config };
  const spec = DIFFICULTIES[cfg.difficulty];
  const rng = rngIn ?? new SeededRng(cfg.seed);
  const cells: Cell[] = [];
  for (let i = 0; i < spec.width * spec.height; i++) {
    cells.push({ value: 0, revealed: false, flagged: false, exploded: false });
  }
  return {
    width: spec.width,
    height: spec.height,
    mines: spec.mines,
    cells,
    phase: "ready",
    flagsRemaining: spec.mines,
    firstRevealDone: false,
    rng,
    seed: cfg.seed,
  };
}

// Places mines ensuring the first clicked cell (sx,sy) and its 8 neighbours
// are safe (first-click-safe).
function placeMines(state: GameState, sx: number, sy: number): void {
  const { width, height, mines } = state;
  const safe = new Set<number>();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (inBounds(width, height, sx + dx, sy + dy)) {
        safe.add(idx(state, sx + dx, sy + dy));
      }
    }
  }
  let placed = 0;
  while (placed < mines) {
    const i = rngInt(state.rng, 0, width * height - 1);
    if (safe.has(i) || state.cells[i].value === MINE) continue;
    state.cells[i].value = MINE;
    placed++;
  }
  // compute adjacency counts
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (state.cells[idx(state, x, y)].value === MINE) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (
            inBounds(width, height, x + dx, y + dy) &&
            state.cells[idx(state, x + dx, y + dy)].value === MINE
          ) {
            count++;
          }
        }
      }
      state.cells[idx(state, x, y)].value = count;
    }
  }
}

// Reveal a cell. Returns true if a mine was hit.
// Flood-fills zero cells.
export function reveal(state: GameState, x: number, y: number): boolean {
  const cell = state.cells[idx(state, x, y)];
  if (cell.revealed || cell.flagged) return false;
  if (state.phase === "won" || state.phase === "lost") return false;

  if (state.phase === "ready") {
    placeMines(state, x, y);
    state.phase = "playing";
    state.firstRevealDone = true;
  }

  if (cell.value === MINE) {
    cell.exploded = true;
    cell.revealed = true;
    lose(state);
    return true;
  }

  floodReveal(state, x, y);
  checkWin(state);
  return false;
}

function floodReveal(state: GameState, x: number, y: number): void {
  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    const i = idx(state, cx, cy);
    const cell = state.cells[i];
    if (cell.revealed || cell.flagged || cell.value === MINE) continue;
    cell.revealed = true;
    if (cell.value === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (inBounds(state.width, state.height, cx + dx, cy + dy)) {
            stack.push([cx + dx, cy + dy]);
          }
        }
      }
    }
  }
}

export function toggleFlag(state: GameState, x: number, y: number): void {
  if (state.phase === "won" || state.phase === "lost") return;
  const cell = state.cells[idx(state, x, y)];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  state.flagsRemaining += cell.flagged ? -1 : 1;
}

// Chord: reveal neighbours when a revealed number has matching flags.
export function chord(state: GameState, x: number, y: number): void {
  if (state.phase !== "playing") return;
  const cell = state.cells[idx(state, x, y)];
  if (!cell.revealed || cell.value <= 0) return;
  let flags = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (inBounds(state.width, state.height, x + dx, y + dy)) {
        if (state.cells[idx(state, x + dx, y + dy)].flagged) flags++;
      }
    }
  }
  if (flags !== cell.value) return;
  // reveal all unflagged neighbours
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (inBounds(state.width, state.height, x + dx, y + dy)) {
        const n = state.cells[idx(state, x + dx, y + dy)];
        if (!n.revealed && !n.flagged) {
          if (n.value === MINE) {
            n.exploded = true;
            n.revealed = true;
            lose(state);
            return;
          }
          floodReveal(state, x + dx, y + dy);
        }
      }
    }
  }
  checkWin(state);
}

function lose(state: GameState): void {
  state.phase = "lost";
  // reveal all mines
  for (const c of state.cells) {
    if (c.value === MINE) c.revealed = true;
  }
}

function checkWin(state: GameState): void {
  for (const c of state.cells) {
    if (c.value !== MINE && !c.revealed) return;
  }
  state.phase = "won";
  // auto-flag remaining mines
  for (const c of state.cells) {
    if (c.value === MINE) c.flagged = true;
  }
  state.flagsRemaining = 0;
}

export function getCell(state: GameState, x: number, y: number): Cell {
  return state.cells[idx(state, x, y)];
}
