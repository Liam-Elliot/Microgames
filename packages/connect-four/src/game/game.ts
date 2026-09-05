// Core Connect Four game logic — pure TypeScript, framework-agnostic & decoupled.
// No React/DOM/shell imports. RNG injected as an object ({ next(); int(); pick() },
// style-guide §9) — a Shell SeededRng.

export interface RngLike {
  /** Float in [0, 1) */
  next(): number;
  /** Integer in [minInclusive, maxExclusive) */
  int(minInclusive: number, maxExclusive: number): number;
  /** Random element */
  pick<T>(items: readonly T[]): T;
}

export type Rng = RngLike;
export type Cell = 0 | 1 | 2; // 0 empty, 1 P1, 2 P2
export type Mode = "menu" | "playing" | "gameover";

export const COLS = 7;
export const ROWS = 6;
export const WIN = 4;

export interface GameState {
  mode: Mode;
  board: Cell[][]; // board[col][row], col-major
  current: 1 | 2;
  winner: Cell;
  isVersusAi: boolean;
  difficulty: "easy" | "hard";
}

export function createEmptyBoard(): Cell[][] {
  return Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => 0 as Cell));
}

export function createGame(opts: { isVersusAi: boolean; difficulty?: "easy" | "hard" }): GameState {
  return {
    mode: "menu",
    board: createEmptyBoard(),
    current: 1,
    winner: 0,
    isVersusAi: opts.isVersusAi,
    difficulty: opts.difficulty ?? "easy",
  };
}

export function startMatch(g: GameState, versusAi: boolean, difficulty: "easy" | "hard"): void {
  g.board = createEmptyBoard();
  g.current = 1;
  g.winner = 0;
  g.isVersusAi = versusAi;
  g.difficulty = difficulty;
  g.mode = "playing";
}

export function columnFull(g: GameState, col: number): boolean {
  return g.board[col][0] !== 0;
}

/** Drop a disc in `col` for the current player. Returns the row dropped, or -1 if full/invalid. */
export function dropDisc(g: GameState, col: number): number {
  if (col < 0 || col >= COLS || columnFull(g, col)) return -1;
  // find lowest empty row in this column
  for (let row = ROWS - 1; row >= 0; row--) {
    if (g.board[col][row] === 0) {
      g.board[col][row] = g.current;
      return row;
    }
  }
  return -1;
}

/** After a drop at (col,row), check for a win for the given player. */
export function checkWin(g: GameState, col: number, row: number, player: 1 | 2): boolean {
  const dirs: Array<[number, number]> = [
    [1, 0], // horizontal
    [0, 1], // vertical
    [1, 1], // diag down-right
    [1, -1], // diag up-right
  ];
  for (const [dc, dr] of dirs) {
    let count = 1;
    // forward
    for (let s = 1; s < WIN; s++) {
      const c = col + dc * s;
      const r = row + dr * s;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS || g.board[c][r] !== player) break;
      count++;
    }
    // backward
    for (let s = 1; s < WIN; s++) {
      const c = col - dc * s;
      const r = row - dr * s;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS || g.board[c][r] !== player) break;
      count++;
    }
    if (count >= WIN) return true;
  }
  return false;
}

export function boardFull(g: GameState): boolean {
  for (let c = 0; c < COLS; c++) {
    if (!columnFull(g, c)) return false;
  }
  return true;
}

/**
 * Simple AI move: pick best available column for `player`.
 * easy = mostly random with only obvious wins/dodges; hard = blocks + wins.
 * Uses injected rng for the "easy" jitter / tie-breaks. Deterministic given seed.
 */
export function chooseAiMove(g: GameState, rng: Rng): number {
  const ai: 1 | 2 = g.current;
  const human: 1 | 2 = ai === 1 ? 2 : 1;
  const available: number[] = [];
  for (let c = 0; c < COLS; c++) if (!columnFull(g, c)) available.push(c);
  if (available.length === 0) return -1;

  // 1) winning move
  for (const c of available) {
    if (wouldWin(g, c, ai)) return c;
  }
  // 2) block opponent's winning move
  for (const c of available) {
    if (wouldWin(g, c, human)) return c;
  }

  if (g.difficulty === "hard") {
    // 3) prefer center, avoid giving opponent easy setups (basic heuristic)
    // score columns by proximity to center + blocking potential
    const center = (COLS - 1) / 2;
    let best = available[0];
    let bestScore = -Infinity;
    for (const c of available) {
      let score = -Math.abs(c - center) * 0.5;
      // small random tiebreak via rng
      score += rng.next();
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }
  // easy: random among available (but never throw a win for the human if we can block)
  return available[Math.floor(rng.next() * available.length)];
}

function wouldWin(g: GameState, col: number, player: 1 | 2): boolean {
  // simulate drop for player
  for (let row = ROWS - 1; row >= 0; row--) {
    if (g.board[col][row] === 0) {
      // temporarily place
      g.board[col][row] = player;
      const win = checkWin(g, col, row, player);
      g.board[col][row] = 0;
      return win;
    }
  }
  return false;
}

/** Advance turn after a move. Returns new current player (or keeps if game over). */
export function advanceTurn(g: GameState): void {
  g.current = g.current === 1 ? 2 : 1;
}
