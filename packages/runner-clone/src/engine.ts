/** Runner engine — 3-lane endless runner, chunk-based generation (spec: decision-locked v1). */

import type { SeededRng } from "@arcadivision/shell";

export const LANES = 3;

export type CellKind = "empty" | "low" | "overhead" | "gap" | "full" | "coin" | "magnet" | "shield" | "multiplier";

export type Row = readonly [CellKind, CellKind, CellKind];

export interface Chunk {
  readonly name: string;
  readonly rows: readonly Row[];
}

/** Pool of 12 chunk layouts — every arrangement fair (spec §5). */
const MAP: Record<string, CellKind> = {
  e: "empty", l: "low", o: "overhead", g: "gap", f: "full",
  c: "coin", m: "magnet", s: "shield", x: "multiplier",
};

function r(rows: readonly (readonly string[])[]): readonly Row[] {
  return rows.map((row) => row.map((k) => MAP[k]) as unknown as Row);
}

export const CHUNKS: readonly Chunk[] = [
  { name: "empty1", rows: r([["e", "e", "e"], ["e", "e", "e"], ["e", "e", "e"], ["c", "e", "e"]]) },
  { name: "lowL", rows: r([["e", "e", "e"], ["l", "e", "e"], ["e", "e", "e"], ["e", "c", "e"]]) },
  { name: "lowM", rows: r([["e", "e", "e"], ["e", "l", "e"], ["e", "e", "e"], ["c", "e", "c"]]) },
  { name: "lowR", rows: r([["e", "e", "e"], ["e", "e", "l"], ["e", "e", "e"], ["e", "c", "e"]]) },
  { name: "overM", rows: r([["e", "e", "e"], ["e", "o", "e"], ["e", "e", "e"], ["e", "c", "e"]]) },
  { name: "overWide", rows: r([["e", "e", "e"], ["o", "o", "e"], ["e", "e", "e"], ["e", "e", "c"]]) },
  { name: "gapM", rows: r([["e", "e", "e"], ["e", "g", "e"], ["e", "g", "e"], ["e", "e", "e"]]) },
  { name: "gapWide", rows: r([["e", "e", "e"], ["g", "g", "e"], ["g", "g", "e"], ["e", "e", "e"]]) },
  { name: "fullL", rows: r([["e", "e", "e"], ["f", "e", "e"], ["f", "e", "e"], ["e", "c", "e"]]) },
  { name: "fullR", rows: r([["e", "e", "e"], ["e", "e", "f"], ["e", "e", "f"], ["e", "e", "c"]]) },
  { name: "mixed1", rows: r([["e", "e", "e"], ["l", "o", "e"], ["e", "e", "e"], ["e", "c", "e"]]) },
  { name: "mixed2", rows: r([["e", "e", "e"], ["e", "g", "f"], ["e", "g", "e"], ["c", "e", "e"]]) },
  { name: "coinArc", rows: r([["e", "c", "e"], ["e", "l", "e"], ["e", "c", "e"], ["e", "e", "e"]]) },
];

export type PlayerAction = "left" | "right" | "jump" | "slide";

export interface RunnerState {
  lane: number;
  jumpTicks: number;   // >0 = airborne
  slideTicks: number;  // >0 = sliding
  track: Row[];        // upcoming rows, index 0 = furthest ahead (top of screen)
  distance: number;    // rows passed (fractional)
  score: number;
  coins: number;
  shield: boolean;
  activePower: "magnet" | "multiplier" | null;
  powerTicks: number;
  speed: number;       // rows per tick
  alive: boolean;
  lastChunk: number;
  seedTick: number;
}

export const BASE_SPEED = 1;
export const SPEED_RAMP = 0.004;      // per row traveled
export const MAX_SPEED = 3;
export const JUMP_TICKS = 3;
export const SLIDE_TICKS = 3;
export const POWER_TICKS = 40;
export const COIN_VALUE = 10;
const TRACK_ROWS = 16;
export const PLAYER_ROW = TRACK_ROWS - 2; // near bottom

export function createRunner(rng: SeededRng): RunnerState {
  const s: RunnerState = {
    lane: 1,
    jumpTicks: 0,
    slideTicks: 0,
    track: [],
    distance: 0,
    score: 0,
    coins: 0,
    shield: false,
    activePower: null,
    powerTicks: 0,
    speed: BASE_SPEED,
    alive: true,
    lastChunk: -1,
    seedTick: 0,
  };
  while (s.track.length < TRACK_ROWS + 8) pushChunk(s, rng, "safe");
  return s;
}

function pushChunk(s: RunnerState, rng: SeededRng, mode: "safe" | "normal" = "normal"): void {
  let idx = rng.int(0, CHUNKS.length);
  let guard = 0;
  while (idx === s.lastChunk && guard++ < 10) idx = rng.int(0, CHUNKS.length);
  s.lastChunk = idx;
  const chunk = CHUNKS[idx];
  if (mode === "safe") {
    // strip hazards from the first chunks so the run opens fair
    s.track.push(...chunk.rows.map((row) => row.map((k) => (k === "coin" ? "coin" : "empty")) as unknown as Row));
  } else {
    s.track.push(...chunk.rows);
  }
}

export interface TickResult {
  died: boolean;
  shieldUsed: boolean;
  coinsCollected: number;
  powerPicked: "magnet" | "shield" | "multiplier" | null;
}

export function input(s: RunnerState, action: PlayerAction): void {
  if (!s.alive) return;
  switch (action) {
    case "left": if (s.lane > 0) s.lane--; break;
    case "right": if (s.lane < LANES - 1) s.lane++; break;
    case "jump": if (s.jumpTicks === 0) { s.jumpTicks = JUMP_TICKS; s.slideTicks = 0; } break;
    case "slide": if (s.slideTicks === 0) { s.slideTicks = SLIDE_TICKS; s.jumpTicks = 0; } break;
  }
}

export function tick(s: RunnerState, rng: SeededRng): TickResult {
  const out: TickResult = { died: false, shieldUsed: false, coinsCollected: 0, powerPicked: null };
  if (!s.alive) return out;

  const prevRowF = s.distance + PLAYER_ROW;
  s.distance += s.speed;
  s.speed = Math.min(MAX_SPEED, BASE_SPEED + s.distance * SPEED_RAMP);
  s.score += s.speed; // distance points

  if (s.jumpTicks > 0) s.jumpTicks--;
  if (s.slideTicks > 0) s.slideTicks--;
  if (s.powerTicks > 0) {
    s.powerTicks--;
    if (s.powerTicks === 0) s.activePower = null;
  }

  // refill track ahead, discard behind
  while (s.track.length < TRACK_ROWS + 8) pushChunk(s, rng);

  // rows crossed this tick: check each crossed row at player lane
  const from = Math.floor(prevRowF) + 1;
  const to = Math.floor(s.distance + PLAYER_ROW);
  for (let row = from; row <= to; row++) {
    const trackIdx = row; // track[0] is row 0 ahead? track index maps: row n ↔ track[n]
    const tr = s.track[trackIdx];
    if (!tr) continue;
    const kind = tr[s.lane];

    // magnet: collect coins in all lanes at this row
    if (kind === "coin" || (s.activePower === "magnet" && tr.some((k) => k === "coin"))) {
      const lanesWithCoins = s.activePower === "magnet" ? [0, 1, 2] : [s.lane];
      for (const ln of lanesWithCoins) {
        if (tr[ln] === "coin") {
          s.track[trackIdx] = tr.map((k, i) => (i === ln && k === "coin" ? "empty" : k)) as unknown as Row;
          s.coins++;
          s.score += COIN_VALUE * (s.activePower === "multiplier" ? 2 : 1);
          out.coinsCollected++;
        }
      }
    }
    if (kind !== "coin" && tr[s.lane] !== "coin" && isPickup(tr[s.lane]) && tr[s.lane] !== undefined) {
      // direct pickup
      const k = tr[s.lane];
      if (k === "magnet" || k === "multiplier" || k === "shield") {
        s.track[trackIdx] = tr.map((k2, i) => (i === s.lane ? "empty" : k2)) as unknown as Row;
        out.powerPicked = k;
        if (k === "shield") s.shield = true;
        else { s.activePower = k; s.powerTicks = POWER_TICKS; }
      }
    }

    // hazard resolution
    if (isHazard(kind)) {
      const clearing =
        (kind === "low" || kind === "gap") && s.jumpTicks > 0 ? true :
        kind === "overhead" && s.slideTicks > 0 ? true :
        false;
      if (!clearing) {
        if (s.shield && kind !== "full") {
          s.shield = false;
          out.shieldUsed = true;
        } else {
          // full barrier is never clearable — even shield? shield absorbs "one obstacle collision" → yes it absorbs
          if (s.shield) {
            s.shield = false;
            out.shieldUsed = true;
          } else {
            s.alive = false;
            out.died = true;
          }
        }
      }
    }
  }

  // discard passed rows
  const drop = Math.floor(s.distance);
  if (drop > 0) {
    s.track.splice(0, drop);
    s.distance -= drop;
  }
  return out;
}

function isHazard(k: CellKind): boolean {
  return k === "low" || k === "overhead" || k === "gap" || k === "full";
}

function isPickup(k: CellKind): boolean {
  return k === "magnet" || k === "multiplier" || k === "shield";
}

/** Visible window of rows for rendering (top = furthest ahead). */
export function view(s: RunnerState, rows: number): readonly Row[] {
  return s.track.slice(0, rows);
}
