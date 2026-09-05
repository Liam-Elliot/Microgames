// Flappy Bird clone — tap/space flap, pipes, score on pass, collision = game over.
// Pure TS game model: no DOM/React/hex. RNG injected as RngLike (style-guide §9).

export interface RngLike {
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

export const WORLD_W = 480;
export const WORLD_H = 640;
export const BIRD_R = 14;
export const GRAVITY = 1500; // px/s^2
export const FLAP_VY = -430; // px/s impulse
export const PIPE_W = 70;
export const PIPE_GAP = 170;
export const PIPE_SPEED = 170; // px/s
export const PIPE_SPACING = 260; // px between pipes
export const GROUND_H = 80;

export type Phase = "ready" | "playing" | "over";

export interface Bird {
  x: number;
  y: number;
  vy: number;
}

export interface Pipe {
  x: number;
  gapY: number; // center of the gap
}

export interface GameState {
  phase: Phase;
  bird: Bird;
  pipes: Pipe[];
  score: number;
  distSinceLastPipe: number; // distance accumulator for spawning
  groundY: number;
  time: number;
}

function createWorld(phase: Phase): GameState {
  const groundY = WORLD_H - GROUND_H;
  return {
    phase,
    bird: { x: 100, y: WORLD_H / 2, vy: 0 },
    pipes: [],
    score: 0,
    distSinceLastPipe: 0,
    groundY,
    time: 0,
  };
}

export function createGame(): GameState {
  return createWorld("ready");
}

export function startGame(g: GameState): void {
  const fresh = createWorld("playing");
  g.phase = fresh.phase;
  g.bird = fresh.bird;
  g.pipes = [];
  g.score = 0;
  g.distSinceLastPipe = 0;
  g.time = 0;
  g.groundY = fresh.groundY;
}

export function flap(g: GameState): void {
  if (g.phase === "ready") {
    g.phase = "playing";
    g.bird.vy = FLAP_VY;
    return;
  }
  if (g.phase === "playing") {
    g.bird.vy = FLAP_VY;
  }
}

export interface UpdateResult {
  scored: boolean;
  died: boolean;
}

/** Advance simulation by dt seconds. Uses injected rng for pipe-gap generation. */
export function update(g: GameState, dt: number, rng: RngLike): UpdateResult {
  const res: UpdateResult = { scored: false, died: false };
  if (g.phase !== "playing") return res;
  g.time += dt;

  // gravity + movement
  g.bird.vy += GRAVITY * dt;
  g.bird.y += g.bird.vy * dt;

  // spawn pipes by accumulated scroll distance
  g.distSinceLastPipe += PIPE_SPEED * dt;
  if (g.distSinceLastPipe >= PIPE_SPACING) {
    g.distSinceLastPipe -= PIPE_SPACING;
    const minGapY = PIPE_GAP / 2 + 40;
    const maxGapY = g.groundY - PIPE_GAP / 2 - 40;
    const gapY = minGapY + rng.next() * (maxGapY - minGapY);
    g.pipes.push({ x: WORLD_W + PIPE_W, gapY });
  }

  // scroll pipes + collision + scoring
  const surviving: Pipe[] = [];
  for (const p of g.pipes) {
    p.x -= PIPE_SPEED * dt;
    if (p.x + PIPE_W < 0) continue; // off screen
    // passed scoring: pipe's right edge just left of bird
    if (!res.scored && p.x + PIPE_W < g.bird.x && g.bird.x - (p.x + PIPE_W) < PIPE_SPEED * dt) {
      g.score++;
      res.scored = true;
    }
    surviving.push(p);
  }
  g.pipes = surviving;

  // collisions: ceiling, ground, pipes
  if (g.bird.y - BIRD_R < 0) {
    g.bird.y = BIRD_R;
    g.bird.vy = Math.max(g.bird.vy, 0);
  }
  if (g.bird.y + BIRD_R > g.groundY) {
    g.bird.y = g.groundY - BIRD_R;
    res.died = true;
    g.phase = "over";
    return res;
  }
  for (const p of g.pipes) {
    if (hitPipe(g, p)) {
      res.died = true;
      g.phase = "over";
      return res;
    }
  }
  return res;
}

function hitPipe(g: GameState, p: Pipe): boolean {
  // horizontal overlap
  const birdLeft = g.bird.x - BIRD_R;
  const birdRight = g.bird.x + BIRD_R;
  if (birdRight < p.x || birdLeft > p.x + PIPE_W) return false;
  // gap top/bottom
  const gapTop = p.gapY - PIPE_GAP / 2;
  const gapBottom = p.gapY + PIPE_GAP / 2;
  const birdTop = g.bird.y - BIRD_R;
  const birdBottom = g.bird.y + BIRD_R;
  // vertical: bird overlaps the solid pipe region (above or below gap)
  return birdBottom < gapTop || birdTop > gapBottom;
}

export function isOver(g: GameState): boolean {
  return g.phase === "over";
}
