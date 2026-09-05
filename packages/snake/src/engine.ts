/** Snake engine — pure, deterministic (all randomness via SeededRng). */

export type Dir = "up" | "down" | "left" | "right";
export const DIRS: Readonly<Record<Dir, { dx: number; dy: number }>> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export interface Vec {
  readonly x: number;
  readonly y: number;
}

export interface SnakeState {
  /** head first */
  body: Vec[];
  dir: Dir;
  /** buffered input; applied one per tick, prevents 180° reversal */
  queued: Dir | null;
  alive: boolean;
  /** exploding: body is a shrinking corpse, still an obstacle (spec §6) */
  exploding: boolean;
  lives: number;
  score: number;
  /** brief post-respawn invulnerability ticks */
  respawnGuard: number;
}

export type Phase = "playing" | "over";

export interface GameConfig {
  readonly width: number;
  readonly height: number;
  readonly playerCount: 1 | 2;
  readonly foodCount: number;
}

export interface GameState {
  readonly config: GameConfig;
  readonly snakes: readonly [SnakeState] | readonly [SnakeState, SnakeState];
  food: Vec[];
  tick: number;
  phase: Phase;
  /** 2P: index of winner, or -1 draw; 1P: -2 n/a */
  winner: number;
  events: readonly string[];
}

export const DEFAULT_CONFIG: GameConfig = { width: 24, height: 24, playerCount: 1, foodCount: 1 };

export function createGame(config: GameConfig, initialLives: number): GameState {
  const midY = Math.floor(config.height / 2);
  const s1 = spawnSnake([{ x: 6, y: midY }, { x: 5, y: midY }, { x: 4, y: midY }], "right", initialLives);
  const snakes: readonly [SnakeState] | readonly [SnakeState, SnakeState] =
    config.playerCount === 1
      ? [s1]
      : [s1, spawnSnake([{ x: config.width - 7, y: midY }, { x: config.width - 6, y: midY }, { x: config.width - 5, y: midY }], "left", initialLives)];
  const food: Vec[] = [];
  for (let i = 0; i < config.foodCount; i++) food.push({ x: 12, y: 4 + i * 5 });
  return {
    config,
    snakes,
    food,
    tick: 0,
    phase: "playing",
    winner: -2,
    events: [],
  };
}

function spawnSnake(body: readonly Vec[], dir: Dir, lives: number): SnakeState {
  return {
    body: [...body],
    dir,
    queued: null,
    alive: true,
    exploding: false,
    lives,
    score: 0,
    respawnGuard: 2,
  };
}

export function queueDir(s: GameState, index: number, dir: Dir): void {
  const snake = s.snakes[index];
  if (!snake || !snake.alive || snake.exploding) return;
  const cur = snake.queued ?? snake.dir;
  const opposite: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
  if (dir === opposite[cur]) return;
  snake.queued = dir;
}

function occupied(state: GameState, p: Vec, ignoreIndex: number, includeCorpse = true): boolean {
  for (let i = 0; i < state.snakes.length; i++) {
    if (i === ignoreIndex) continue;
    const s = state.snakes[i];
    if (!s.alive && !(includeCorpse && s.exploding)) continue;
    if (s.body.some((seg) => seg.x === p.x && seg.y === p.y)) return true;
  }
  return false;
}

function freeCell(state: GameState, rng: { int: (a: number, b: number) => number }): Vec {
  for (let tries = 0; tries < 500; tries++) {
    const p = { x: rng.int(2, state.config.width - 2), y: rng.int(2, state.config.height - 2) };
    if (!state.snakes.some((s) => s.body.some((seg) => seg.x === p.x && seg.y === p.y)) &&
        !state.food.some((f) => f.x === p.x && f.y === p.y)) return p;
  }
  return { x: 1, y: 1 };
}

function respawn(state: GameState, s: SnakeState, index: number, rng: { int: (a: number, b: number) => number }): void {
  // fresh short snake at a safe spot (spec §5 default)
  for (let tries = 0; tries < 200; tries++) {
    const x = rng.int(3, state.config.width - 3);
    const y = rng.int(3, state.config.height - 3);
    const horizontal = rng.int(0, 2) === 0;
    const body: Vec[] = horizontal
      ? [{ x, y }, { x: x - 1, y }, { x: x - 2, y }]
      : [{ x, y }, { x, y: y - 1 }, { x, y: y - 2 }];
    if (body.every((p) => !occupied(state, p, index))) {
      s.body = body;
      s.dir = horizontal ? "right" : "down";
      s.queued = null;
      s.exploding = false;
      s.alive = true;
      s.respawnGuard = 2;
      return;
    }
  }
  // no safe spot: respawn anyway at random cell
  s.body = [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
  s.dir = "right";
  s.queued = null;
  s.exploding = false;
  s.alive = true;
  s.respawnGuard = 2;
}

export function step(state: GameState, rng: { next(): number; int(a: number, b: number): number }): GameState {
  const events: string[] = [];
  if (state.phase !== "playing") return state;
  state.tick++;

  // advance explosions (corpse shrinks head-first, one segment per tick)
  for (const s of state.snakes) {
    if (s.exploding && s.body.length > 0) {
      s.body = s.body.slice(1); // remove head-side segment first
      if (s.body.length === 0) {
        s.exploding = false;
        if (s.lives > 0) {
          respawn(state, s, state.snakes.indexOf(s), rng);
          events.push("respawn");
        } else {
          events.push("eliminated");
        }
      }
    }
    if (s.respawnGuard > 0) s.respawnGuard--;
  }

  // compute new heads
  const heads: (Vec | null)[] = state.snakes.map((s) => {
    if (!s.alive || s.exploding) return null;
    if (s.queued) {
      s.dir = s.queued;
      s.queued = null;
    }
    const d = DIRS[s.dir];
    return { x: s.body[0].x + d.dx, y: s.body[0].y + d.dy };
  });

  const dead = new Set<number>();
  state.snakes.forEach((s, i) => {
    const h = heads[i];
    if (!h) return;
    // wall
    if (h.x < 0 || h.y < 0 || h.x >= state.config.width || h.y >= state.config.height) {
      dead.add(i);
      return;
    }
    // own body (tail cell frees this tick unless growing — use body minus tail approximation: full body check is standard)
    if (s.body.some((seg) => seg.x === h.x && seg.y === h.y)) {
      dead.add(i);
      return;
    }
    // other snake body or head
    for (let j = 0; j < state.snakes.length; j++) {
      if (j === i) continue;
      const o = state.snakes[j];
      if (!o.alive && !o.exploding) continue;
      if (o.body.some((seg) => seg.x === h.x && seg.y === h.y)) {
        dead.add(i); // asymmetric: mover dies, other unaffected (spec §5)
        return;
      }
    }
  });

  // head-to-head: same target cell → both die (spec §8 default, mutual KO)
  if (state.snakes.length === 2 && heads[0] && heads[1] && heads[0].x === heads[1].x && heads[0].y === heads[1].y) {
    dead.add(0);
    dead.add(1);
  }
  // head-to-body swap (pass-through): each head enters cell the other's head vacates → both die
  if (state.snakes.length === 2 && heads[0] && heads[1]) {
    const b0 = state.snakes[0].body[0];
    const b1 = state.snakes[1].body[0];
    if (heads[0].x === b1.x && heads[0].y === b1.y && heads[1].x === b0.x && heads[1].y === b0.y) {
      dead.add(0);
      dead.add(1);
    }
  }

  // move survivors, eat food
  state.snakes.forEach((s, i) => {
    const h = heads[i];
    if (!h || dead.has(i)) return;
    const ate = state.food.findIndex((f) => f.x === h.x && f.y === h.y);
    if (ate >= 0) {
      s.body = [h, ...s.body];
      s.score += 10;
      state.food[ate] = freeCell(state, rng);
      events.push("eat");
    } else {
      s.body = [h, ...s.body.slice(0, -1)];
    }
  });

  // process deaths
  for (const i of dead) {
    const s = state.snakes[i];
    s.lives--;
    s.alive = false;
    s.exploding = true; // corpse remains as obstacle until fully exploded (spec §6)
    events.push(`death:${i}`);
  }

  // end conditions
  const eliminated = state.snakes.map((s) => s.lives <= 0 && !s.alive && !s.exploding);
  if (state.config.playerCount === 1) {
    if (eliminated[0]) {
      state.phase = "over";
      state.winner = -2;
    }
  } else if (eliminated.every(Boolean)) {
    state.phase = "over";
    state.winner = -1; // draw
  } else if (eliminated[0]) {
    state.phase = "over";
    state.winner = 1;
  } else if (eliminated[1]) {
    state.phase = "over";
    state.winner = 0;
  }

  state.events = events;
  return state;
}
