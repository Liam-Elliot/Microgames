// Tetris clone — decoupled game model (no DOM/React/framework dependency).
// 7-bag randomization, SRS-style rotation, line clear, hard drop, next/hold.
// RNG is INJECTED (style-guide §9 — never constructs its own SeededRng).

// Structural RNG shape matching @arcadivision/shell's SeededRng (injectable or mock).
export interface RngLike {
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

type Rng = RngLike;

// Fisher-Yates shuffle (deterministic given an Rng).
function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const VISIBLE_HEIGHT = 20;

// 7 tetromino types (I O T S Z J L)
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const PIECE_TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Rotation states 0..3. Each piece defined by its rotation matrices as cell offsets.
// We store canonical (rotation 0) offsets, then rotate via matrix math.

export interface ActivePiece {
  type: PieceType;
  rotation: number; // 0..3
  x: number; // col
  y: number; // row (0 = top)
}

export interface GameState {
  board: (PieceType | null)[][]; // [y][x]
  current: ActivePiece;
  hold: PieceType | null;
  holdUsed: boolean;
  nextQueue: PieceType[];
  bag: PieceType[];
  score: number;
  lines: number;
  level: number;
  phase: "playing" | "gameover";
  rng: Rng;
  tick: number;
  gravityAccum: number;
  gravityTicks: number;
}

export interface Config {
  gravityTicks: number; // frames per gravity drop at level 1
}

export const DEFAULT_CONFIG: Config = {
  gravityTicks: 20,
};

// Shape definitions as cell offsets for rotation 0.
const SHAPES: Record<PieceType, [number, number][]> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

export function createGame(
  rng: Rng,
  config: Partial<Config> = {},
): GameState {
  const cfg: Config = { ...DEFAULT_CONFIG, ...config };
  const board: (PieceType | null)[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    board.push(new Array(BOARD_WIDTH).fill(null));
  }
  const state: GameState = {
    board,
    current: spawnPiece("I", 0),
    hold: null,
    holdUsed: false,
    nextQueue: [],
    bag: [],
    score: 0,
    lines: 0,
    level: 1,
    phase: "playing",
    rng,
    tick: 0,
    gravityAccum: 0,
    gravityTicks: cfg.gravityTicks,
  };
  // fill queue with first few pieces
  refillNext(state);
  state.current = takeNextPiece(state);
  return state;
}

// 7-bag: refill bag when empty, shuffle, append to queue
function refillBag(state: GameState): void {
  state.bag = shuffle(state.rng, PIECE_TYPES);
}

function refillNext(state: GameState): void {
  // ensure nextQueue has at least 5 pieces
  while (state.nextQueue.length < 5) {
    if (state.bag.length === 0) refillBag(state);
    state.nextQueue.push(state.bag.pop()!);
  }
}

function takeNextPiece(state: GameState): ActivePiece {
  refillNext(state);
  const type = state.nextQueue.shift()!;
  return spawnPiece(type, 0);
}

function spawnPiece(type: PieceType, rotation: number): ActivePiece {
  return {
    type,
    rotation,
    x: Math.floor((BOARD_WIDTH - 4) / 2),
    y: type === "I" ? -1 : 0,
  };
}

// Get absolute cell positions of a piece (post-rotation, post-translation).
export function pieceCells(piece: ActivePiece): [number, number][] {
  const base = SHAPES[piece.type];
  const cells: [number, number][] = [];
  for (const [bx, by] of base) {
    // rotate (bx,by) by 90° * rotation
    let rx = bx;
    let ry = by;
    for (let r = 0; r < piece.rotation; r++) {
      // clockwise
      const nx = -ry;
      const ny = rx;
      rx = nx;
      ry = ny;
    }
    cells.push([piece.x + rx, piece.y + ry]);
  }
  return cells;
}

function collides(
  board: (PieceType | null)[][],
  cells: [number, number][],
): boolean {
  for (const [x, y] of cells) {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    if (y >= 0 && board[y][x] !== null) return true;
  }
  return false;
}

export function moveLeft(state: GameState): void {
  const candidate = { ...state.current, x: state.current.x - 1 };
  if (!collides(state.board, pieceCells(candidate))) state.current = candidate;
}

export function moveRight(state: GameState): void {
  const candidate = { ...state.current, x: state.current.x + 1 };
  if (!collides(state.board, pieceCells(candidate))) state.current = candidate;
}

export function moveDown(state: GameState): boolean {
  const candidate = { ...state.current, y: state.current.y + 1 };
  if (!collides(state.board, pieceCells(candidate))) {
    state.current = candidate;
    return true;
  }
  return false;
}

export function rotateCW(state: GameState): void {
  rotate(state, 1);
}

export function rotateCCW(state: GameState): void {
  rotate(state, -1);
}

function rotate(state: GameState, dir: 1 | -1): void {
  const next = (state.current.rotation + (dir === 1 ? 1 : 3)) % 4;
  let candidate = { ...state.current, rotation: next };
  // wall kicks: try offsets (SRS-like simple set)
  const kicks: [number, number][] =
    state.current.type === "I"
      ? [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]
      : [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
  for (const [dx, dy] of kicks) {
    candidate = {
      ...state.current,
      rotation: next,
      x: state.current.x + dx,
      y: state.current.y + dy,
    };
    if (!collides(state.board, pieceCells(candidate))) {
      state.current = candidate;
      return;
    }
  }
}

export function hardDrop(state: GameState): void {
  while (moveDown(state)) {
    // keep falling
  }
  lock(state);
}

export function softDrop(state: GameState): void {
  if (moveDown(state)) {
    state.score += 1;
  } else {
    lock(state);
  }
}

function lock(state: GameState): void {
  const cells = pieceCells(state.current);
  for (const [x, y] of cells) {
    if (y >= 0 && y < BOARD_HEIGHT) {
      state.board[y][x] = state.current.type;
    }
  }
  const cleared = clearLines(state);
  applyScore(state, cleared);
  state.current = takeNextPiece(state);
  state.holdUsed = false;

  // top-out check
  if (collides(state.board, pieceCells(state.current))) {
    state.phase = "gameover";
  }
}

function clearLines(state: GameState): number {
  let cleared = 0;
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (state.board[y].every((c) => c !== null)) {
      state.board.splice(y, 1);
      state.board.unshift(new Array(BOARD_WIDTH).fill(null));
      cleared++;
      y++; // re-check same row after shift
    }
  }
  return cleared;
}

function applyScore(state: GameState, cleared: number): void {
  state.lines += cleared;
  const points = [0, 100, 300, 500, 800][cleared] ?? 0;
  state.score += points * state.level;
  state.level = Math.floor(state.lines / 10) + 1;
}

export function holdPiece(state: GameState): void {
  if (state.holdUsed) return;
  const prevHold = state.hold;
  state.hold = state.current.type;
  state.holdUsed = true;
  if (prevHold === null) {
    state.current = takeNextPiece(state);
  } else {
    state.current = spawnPiece(prevHold, 0);
  }
}

export function update(state: GameState): void {
  if (state.phase !== "playing") return;
  state.tick++;
  const gravity = Math.max(
    1,
    state.gravityTicks - (state.level - 1),
  );
  state.gravityAccum++;
  if (state.gravityAccum >= gravity) {
    state.gravityAccum = 0;
    softDrop(state);
  }
}

// Current+ghost rendering helper: full board with active piece overlaid.
export function boardWithActive(state: GameState): (PieceType | null)[][] {
  // copy board
  const out = state.board.map((row) => row.slice());
  for (const [x, y] of pieceCells(state.current)) {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      out[y][x] = state.current.type;
    }
  }
  return out;
}

// Ghost piece (drop preview)
export function ghostY(state: GameState): number {
  let y = state.current.y;
  while (
    !collides(state.board, pieceCells({ ...state.current, y: y + 1 }))
  ) {
    y++;
  }
  return y;
}
