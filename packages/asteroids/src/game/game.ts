// Asteroids — decoupled game model (no DOM/React/framework dependency).
// Pure logic: advances via fixed timesteps, emits render state. RNG is INJECTED
// (style-guide §9 — never constructs its own `new SeededRng()` internally).
// Wiring to @arcadivision/shell + a renderer is a thin layer on top.

// Structural RNG shape matching @arcadivision/shell's SeededRng, so any
// SeededRng (or a test mock) can be injected. No import needed — structural.
export interface RngLike {
  /** Float in [0, 1) */
  next(): number;
  /** Integer in [minInclusive, maxExclusive) */
  int(minInclusive: number, maxExclusive: number): number;
  /** Random element */
  pick<T>(items: readonly T[]): T;
}

type Rng = RngLike;

function range(rng: Rng, min: number, max: number): number {
  return min + rng.next() * (max - min);
}

export const WORLD_WIDTH = 1024;
export const WORLD_HEIGHT = 768;

export interface Vec {
  x: number;
  y: number;
}

export interface Ship {
  pos: Vec;
  vel: Vec;
  angle: number; // radians, 0 = pointing right
  thrusting: boolean;
  invulnerableTicks: number; // post-respawn grace
  cooldownTicks: number; // fire cooldown
}

export interface Bullet {
  pos: Vec;
  vel: Vec;
  lifeTicks: number;
}

export interface Asteroid {
  pos: Vec;
  vel: Vec;
  size: number; // 3 = large, 2 = medium, 1 = small
  angle: number;
  spin: number; // rad per tick
  vertices: Vec[]; // unit-circle offsets scaled by size
}

export interface Particle {
  pos: Vec;
  vel: Vec;
  lifeTicks: number;
  maxLife: number;
}

export interface GameState {
  phase: "attract" | "playing" | "dying" | "gameover";
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  deathTicks: number; // countdown during "dying"/"gameover"
  rng: Rng;
  tick: number;
}

export interface Config {
  startingLives: number;
  // Thrust / drag / fire tuning
  thrustAccel: number;
  drag: number;
  maxSpeed: number;
  fireCooldown: number;
  bulletSpeed: number;
  bulletLife: number;
  // Rotation
  turnRate: number; // rad per tick
  // Asteroid
  asteroidBaseSpeed: number;
  asteroidSpawnCount: number; // first level
  extraAsteroidsPerLevel: number;
}

export const DEFAULT_CONFIG: Config = {
  startingLives: 3,
  thrustAccel: 0.45,
  drag: 0.995,
  maxSpeed: 7.5,
  fireCooldown: 12,
  bulletSpeed: 11,
  bulletLife: 90,
  turnRate: 0.09,
  asteroidBaseSpeed: 1.4,
  asteroidSpawnCount: 3,
  extraAsteroidsPerLevel: 1,
};

const SHIP_RADIUS = 14;
const BULLET_RADIUS = 2;

export function createGame(
  rng: Rng,
  config: Partial<Config> = {},
): GameState {
  const cfg: Config = { ...DEFAULT_CONFIG, ...config };
  const state: GameState = {
    phase: "attract",
    ship: newShip(cfg),
    bullets: [],
    asteroids: [],
    particles: [],
    score: 0,
    lives: cfg.startingLives,
    level: 1,
    deathTicks: 0,
    rng,
    tick: 0,
  };
  void cfg;
  return state;
}

function newShip(_cfg: Config): Ship {
  return {
    pos: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
    vel: { x: 0, y: 0 },
    angle: -Math.PI / 2, // pointing up
    thrusting: false,
    invulnerableTicks: 0,
    cooldownTicks: 0,
  };
}

function asteroidRadius(size: number): number {
  // large 48, medium 28, small 16
  return 48 - (3 - size) * 16;
}

export function makeAsteroid(
  rng: Rng,
  size: number,
  pos?: Vec,
  baseSpeed?: number,
): Asteroid {
  const angle = range(rng, 0, Math.PI * 2);
  const speed = range(rng, 0.5, 1.6) * (baseSpeed ?? 1.4);
  const vel = {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
  const p = pos ?? {
    x: range(rng, 0, WORLD_WIDTH),
    y: range(rng, 0, WORLD_HEIGHT),
  };
  // ensure spawn isn't on top of ship center
  const vertices: Vec[] = [];
  const vertCount = 7 + Math.floor(rng.next() * 4); // 7..10
  for (let i = 0; i < vertCount; i++) {
    const a = (i / vertCount) * Math.PI * 2;
    const jitter = range(rng, 0.75, 1.15);
    vertices.push({
      x: Math.cos(a) * jitter,
      y: Math.sin(a) * jitter,
    });
  }
  return {
    pos: p,
    vel,
    size,
    angle,
    spin: range(rng, -0.03, 0.03),
    vertices,
  };
}

export function startGame(state: GameState): void {
  state.phase = "playing";
  state.ship = newShip(DEFAULT_CONFIG);
  state.bullets = [];
  state.asteroids = [];
  state.particles = [];
  state.score = 0;
  state.lives = DEFAULT_CONFIG.startingLives;
  state.level = 1;
  spawnLevel(state);
}

function spawnLevel(state: GameState): void {
  const count =
    DEFAULT_CONFIG.asteroidSpawnCount +
    (state.level - 1) * DEFAULT_CONFIG.extraAsteroidsPerLevel;
  for (let i = 0; i < count; i++) {
    // spawn away from ship
    let a = makeAsteroid(state.rng, 3, undefined, DEFAULT_CONFIG.asteroidBaseSpeed);
    let attempts = 0;
    while (distance(a.pos, state.ship.pos) < 180 && attempts < 20) {
      a = makeAsteroid(state.rng, 3, undefined, DEFAULT_CONFIG.asteroidBaseSpeed);
      attempts++;
    }
    state.asteroids.push(a);
  }
}

function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function wrap(v: Vec): Vec {
  let { x, y } = v;
  if (x < 0) x += WORLD_WIDTH;
  else if (x >= WORLD_WIDTH) x -= WORLD_WIDTH;
  if (y < 0) y += WORLD_HEIGHT;
  else if (y >= WORLD_HEIGHT) y -= WORLD_HEIGHT;
  return { x, y };
}

// --- Input handlers (called by renderer) ---
export function setThrust(state: GameState, on: boolean): void {
  state.ship.thrusting = on;
}

export function turn(state: GameState, dir: -1 | 0 | 1): void {
  state.ship.angle += dir * DEFAULT_CONFIG.turnRate;
}

export function fire(state: GameState): void {
  if (state.phase !== "playing") return;
  if (state.ship.cooldownTicks > 0) return;
  const { ship } = state;
  const cos = Math.cos(ship.angle);
  const sin = Math.sin(ship.angle);
  state.bullets.push({
    pos: {
      x: ship.pos.x + cos * (SHIP_RADIUS + 4),
      y: ship.pos.y + sin * (SHIP_RADIUS + 4),
    },
    vel: {
      x: ship.vel.x + cos * DEFAULT_CONFIG.bulletSpeed,
      y: ship.vel.y + sin * DEFAULT_CONFIG.bulletSpeed,
    },
    lifeTicks: DEFAULT_CONFIG.bulletLife,
  });
  ship.cooldownTicks = DEFAULT_CONFIG.fireCooldown;
}

export function startFire(state: GameState): void {
  fire(state);
}

// --- Main update ---
export function update(state: GameState): void {
  state.tick++;

  if (state.phase === "dying" || state.phase === "gameover") {
    state.deathTicks--;
    if (state.phase === "dying" && state.deathTicks <= 0) {
      if (state.lives > 0) {
        respawn(state);
      } else {
        state.phase = "gameover";
      }
    }
    updateParticles(state);
    return;
  }

  if (state.phase !== "playing") {
    // attract: just drift asteroids for visual interest
    updateAsteroids(state);
    updateParticles(state);
    return;
  }

  const { ship, cfg } = { ship: state.ship, cfg: DEFAULT_CONFIG };

  // Ship physics
  if (ship.thrusting) {
    const cos = Math.cos(ship.angle);
    const sin = Math.sin(ship.angle);
    ship.vel.x += cos * cfg.thrustAccel;
    ship.vel.y += sin * cfg.thrustAccel;
  }
  // drag
  ship.vel.x *= cfg.drag;
  ship.vel.y *= cfg.drag;
  // clamp speed
  const sp = Math.hypot(ship.vel.x, ship.vel.y);
  if (sp > cfg.maxSpeed) {
    ship.vel.x = (ship.vel.x / sp) * cfg.maxSpeed;
    ship.vel.y = (ship.vel.y / sp) * cfg.maxSpeed;
  }
  ship.pos = wrap({ x: ship.pos.x + ship.vel.x, y: ship.pos.y + ship.vel.y });

  if (ship.cooldownTicks > 0) ship.cooldownTicks--;
  if (ship.invulnerableTicks > 0) ship.invulnerableTicks--;

  updateBullets(state);
  updateAsteroids(state);
  updateParticles(state);

  // Collisions
  checkBulletAsteroidCollisions(state);
  if (state.ship.invulnerableTicks === 0) {
    checkShipAsteroidCollisions(state);
  }

  // Level clear?
  if (state.asteroids.length === 0) {
    state.level++;
    spawnLevel(state);
  }
}

function updateBullets(state: GameState): void {
  const next: Bullet[] = [];
  for (const b of state.bullets) {
    b.pos = wrap({ x: b.pos.x + b.vel.x, y: b.pos.y + b.vel.y });
    b.lifeTicks--;
    if (b.lifeTicks > 0) next.push(b);
  }
  state.bullets = next;
}

function updateAsteroids(state: GameState): void {
  for (const a of state.asteroids) {
    a.pos = wrap({ x: a.pos.x + a.vel.x, y: a.pos.y + a.vel.y });
    a.angle += a.spin;
  }
}

function updateParticles(state: GameState): void {
  const next: Particle[] = [];
  for (const p of state.particles) {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.vel.x *= 0.97;
    p.vel.y *= 0.97;
    p.lifeTicks--;
    if (p.lifeTicks > 0) next.push(p);
  }
  state.particles = next;
}

function checkBulletAsteroidCollisions(state: GameState): void {
  const hitAsteroids = new Set<Asteroid>();
  const remainingBullets: Bullet[] = [];

  for (const b of state.bullets) {
    let consumed = false;
    for (const a of state.asteroids) {
      if (hitAsteroids.has(a)) continue;
      if (distance(b.pos, a.pos) < asteroidRadius(a.size) + BULLET_RADIUS) {
        hitAsteroids.add(a);
        consumed = true;
        break;
      }
    }
    if (!consumed) remainingBullets.push(b);
  }
  state.bullets = remainingBullets;

  for (const a of hitAsteroids) {
    destroyAsteroid(state, a);
  }
}

function checkShipAsteroidCollisions(state: GameState): void {
  for (const a of state.asteroids) {
    if (distance(state.ship.pos, a.pos) < asteroidRadius(a.size) + SHIP_RADIUS) {
      killShip(state);
      return;
    }
  }
}

function destroyAsteroid(state: GameState, a: Asteroid): void {
  // remove
  state.asteroids = state.asteroids.filter((x) => x !== a);

  // score
  const points = [0, 100, 50, 20][a.size] ?? 20;
  state.score += points;

  // debris particles
  spawnExplosion(state, a.pos, a.size);

  // split
  if (a.size > 1) {
    for (let i = 0; i < 2; i++) {
      state.asteroids.push(
        makeAsteroid(state.rng, a.size - 1, a.pos, DEFAULT_CONFIG.asteroidBaseSpeed),
      );
    }
  }
}

function spawnExplosion(state: GameState, pos: Vec, size: number): void {
  const count = 6 + size * 3;
  for (let i = 0; i < count; i++) {
    const angle = range(state.rng, 0, Math.PI * 2);
    const speed = range(state.rng, 0.5, 2.5);
    state.particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      lifeTicks: range(state.rng, 20, 45),
      maxLife: 45,
    });
  }
}

function killShip(state: GameState): void {
  state.lives--;
  spawnExplosion(state, state.ship.pos, 3);
  state.phase = "dying";
  state.deathTicks = 60;
}

function respawn(state: GameState): void {
  state.ship = newShip(DEFAULT_CONFIG);
  state.ship.invulnerableTicks = 60;
  state.phase = "playing";
}
