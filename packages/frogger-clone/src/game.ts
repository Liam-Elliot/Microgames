// Frogger clone — decoupled game model (no DOM/React/framework dependency).
// Lane-crossing: cars on road lanes (move horizontally), logs/turtles on river
// lanes (ride them), safe zones on edges. Player hops between grid cells.

import { SeededRng, type RngLike } from "./rng.js";

export type Rng = RngLike;

function range(rng: Rng, min: number, max: number): number {
  return min + rng.next() * (max - min);
}

function rangeInt(rng: Rng, min: number, max: number): number {
  return rng.int(min, max + 1);
}

// Grid layout (in cells). Lane 0 = start (bottom), top lane = goal banks.
export const GRID_WIDTH = 13;
export const GRID_ROWS = 15;

export type LaneKind = "start" | "road" | "water" | "goal" | "median";

export interface Lane {
  row: number; // 0 = bottom
  kind: LaneKind;
  direction: number; // +1 right, -1 left, 0 = none
  speed: number; // cells per tick (for movers)
  moverType: "car" | "truck" | "log" | "turtle" | null;
}

export interface Mover {
  laneRow: number;
  x: number; // fractional cell position
  type: "car" | "truck" | "log" | "turtle";
  length: number; // in cells
  submerged?: boolean; // turtles that dive
  subTimer?: number;
}

export interface FrogPos {
  x: number; // cell col
  y: number; // cell row (0 = bottom)
}

export interface GameState {
  lanes: Lane[];
  movers: Mover[];
  frog: FrogPos;
  lives: number;
  score: number;
  level: number;
  phase: "playing" | "dead" | "won" | "gameover";
  deathTicks: number;
  goalSlots: boolean[]; // which goal cells are filled
  rng: Rng;
  tick: number;
}

export interface Config {
  seed: number;
  startingLives: number;
  goalSlotsCount: number;
}

export const DEFAULT_CONFIG: Config = {
  seed: 55555,
  startingLives: 3,
  goalSlotsCount: 5,
};

export const HOP_TICKS = 4; // frames per hop animation (renderer concern, exposed)

function buildLanes(): Lane[] {
  const lanes: Lane[] = [];
  // Row 0 = start
  lanes.push({ row: 0, kind: "start", direction: 0, speed: 0, moverType: null });
  // Rows 1-13 alternating median / road / water with a river, roads, etc.
  // Classic layout: road rows then water rows then goal.
  const defs: Lane[] = [
    { row: 1, kind: "median", direction: 0, speed: 0, moverType: null },
    { row: 2, kind: "road", direction: -1, speed: 0.12, moverType: "car" },
    { row: 3, kind: "road", direction: 1, speed: 0.09, moverType: "truck" },
    { row: 4, kind: "road", direction: -1, speed: 0.15, moverType: "car" },
    { row: 5, kind: "median", direction: 0, speed: 0, moverType: null },
    { row: 6, kind: "water", direction: 1, speed: 0.08, moverType: "log" },
    { row: 7, kind: "water", direction: -1, speed: 0.07, moverType: "turtle" },
    { row: 8, kind: "water", direction: 1, speed: 0.09, moverType: "log" },
    { row: 9, kind: "water", direction: -1, speed: 0.06, moverType: "turtle" },
    { row: 10, kind: "water", direction: 1, speed: 0.08, moverType: "log" },
    { row: 11, kind: "median", direction: 0, speed: 0, moverType: null },
    { row: 12, kind: "road", direction: 1, speed: 0.14, moverType: "car" },
    { row: 13, kind: "road", direction: -1, speed: 0.11, moverType: "car" },
    { row: 14, kind: "goal", direction: 0, speed: 0, moverType: null },
  ];
  lanes.push(...defs);
  return lanes;
}

export function createGame(
  config: Partial<Config> = {},
  rngIn?: Rng,
): GameState {
  const cfg: Config = { ...DEFAULT_CONFIG, ...config };
  const rng = rngIn ?? new SeededRng(cfg.seed);
  const lanes = buildLanes();
  const movers: Mover[] = [];
  for (const lane of lanes) {
    if ((lane.kind === "road" || lane.kind === "water") && lane.moverType) {
      spawnMoversForLane(rng, lane, movers);
    }
  }
  return {
    lanes,
    movers,
    frog: { x: Math.floor(GRID_WIDTH / 2), y: 0 },
    lives: cfg.startingLives,
    score: 0,
    level: 1,
    phase: "playing",
    deathTicks: 0,
    goalSlots: new Array(cfg.goalSlotsCount).fill(false),
    rng,
    tick: 0,
  };
}

function spawnMoversForLane(rng: Rng, lane: Lane, movers: Mover[]): void {
  // populate a lane with a few movers of the lane's type
  const isRoad = lane.kind === "road";
  const count = isRoad ? 3 : 3;
  for (let i = 0; i < count; i++) {
    const type = lane.moverType!;
    const length = type === "truck" ? 2 : type === "log" ? rangeInt(rng, 2, 3) : 1;
    const startX =
      lane.direction > 0
        ? -length - range(rng, 0, GRID_WIDTH)
        : GRID_WIDTH + range(rng, 0, GRID_WIDTH);
    movers.push({
      laneRow: lane.row,
      x: startX + i * (GRID_WIDTH / count),
      type,
      length,
    });
  }
}

export function hop(state: GameState, dx: number, dy: number): void {
  if (state.phase !== "playing") return;
  // dy: +1 = up, -1 = down; dx: lateral
  const nx = state.frog.x + dx;
  const ny = state.frog.y + dy;
  if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_ROWS) return;
  state.frog.x = nx;
  state.frog.y = ny;
  state.score += dy > 0 ? 10 : 0; // forward progress
}

export function update(state: GameState): void {
  state.tick++;

  if (state.phase === "dead") {
    state.deathTicks--;
    if (state.deathTicks <= 0) {
      if (state.lives > 0) {
        resetFrog(state);
      } else {
        state.phase = "gameover";
      }
    }
    return;
  }
  if (state.phase !== "playing") return;

  moveMovers(state);

  // Check frog position: on water, must be riding a log/turtle; on road, must not collide with a car.
  const frogLane = state.lanes[state.frog.y];

  if (frogLane.kind === "water") {
    const onMover = isFrogOnMover(state);
    if (!onMover) {
      killFrog(state);
      return;
    }
  } else if (frogLane.kind === "road") {
    if (isFrogHitByCar(state)) {
      killFrog(state);
      return;
    }
  } else if (frogLane.kind === "goal") {
    // reached goal row — check for open slot
    const slot = state.frog.x % state.goalSlots.length;
    if (slot >= 0 && slot < state.goalSlots.length && !state.goalSlots[slot]) {
      state.goalSlots[slot] = true;
      state.score += 50;
      resetFrog(state);
      checkWin(state);
    } else {
      // no slot — hop to a safe median and back; simple: reset to start
      resetFrog(state);
    }
  }
}

function moveMovers(state: GameState): void {
  for (const m of state.movers) {
    const lane = state.lanes[m.laneRow];
    m.x += lane.direction * lane.speed;
    // wrap
    if (lane.direction > 0) {
      if (m.x - m.length > GRID_WIDTH) m.x = -m.length;
    } else {
      if (m.x + m.length < 0) m.x = GRID_WIDTH;
    }
  }
}

function isFrogOnMover(state: GameState): boolean {
  for (const m of state.movers) {
    if (m.laneRow !== state.frog.y) continue;
    if (m.type === "turtle" && m.submerged) continue;
    const left = m.x;
    const right = m.x + m.length;
    // frog occupies cell [x, x+1)
    if (state.frog.x >= left && state.frog.x < right) return true;
  }
  return false;
}

function isFrogHitByCar(state: GameState): boolean {
  for (const m of state.movers) {
    if (m.laneRow !== state.frog.y) continue;
    if (m.type !== "car" && m.type !== "truck") continue;
    const left = m.x;
    const right = m.x + m.length;
    if (state.frog.x >= left && state.frog.x < right) return true;
  }
  return false;
}

function killFrog(state: GameState): void {
  state.lives--;
  state.phase = "dead";
  state.deathTicks = 30;
}

function resetFrog(state: GameState): void {
  state.frog = { x: Math.floor(GRID_WIDTH / 2), y: 0 };
  state.phase = "playing";
}

function checkWin(state: GameState): void {
  if (state.goalSlots.every(Boolean)) {
    state.phase = "won";
    state.score += 1000;
    // next level: reset slots, respawn
    state.level++;
    state.goalSlots = state.goalSlots.map(() => false);
    resetFrog(state);
    state.phase = "playing";
  }
}
