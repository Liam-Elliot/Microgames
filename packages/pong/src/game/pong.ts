// Core Pong game logic — pure TypeScript, framework-agnostic & decoupled.
// No React/DOM/shell imports here. Consumed by the presentation layer.
// RNG is INJECTED (a plain `() => number`), never hardcoded — the composition
// root supplies a @arcadivision/shell SeededRng.

// rng: () => number — returns a float in [0,1).
export type Rng = () => number;

export type Mode = "menu" | "serving" | "playing" | "gameover";

export type PaddleSide = "left" | "right";

export interface Paddle {
  y: number; // top of paddle in board units
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  mode: Mode;
  boardW: number;
  boardH: number;
  paddleHeight: number;
  paddleSpeed: number;
  ballSize: number;
  ballSpeed: number;
  left: Paddle;
  right: Paddle;
  ball: Ball;
  scoreLeft: number;
  scoreRight: number;
  winScore: number;
  isVersusAi: boolean;
  paused: boolean;
}

export interface Input {
  leftUp: boolean;
  leftDown: boolean;
  rightUp: boolean;
  rightDown: boolean;
}

export const GOAL = 11;

export interface PongConfig {
  isVersusAi: boolean;
  rng: Rng; // injected — a @arcadivision/shell SeededRng's next()
}

export function createGame(opts: PongConfig): GameState {
  const boardW = 640;
  const boardH = 400;
  const paddleHeight = 72;
  const half = boardH / 2 - paddleHeight / 2;
  return {
    mode: "menu",
    boardW,
    boardH,
    paddleHeight,
    paddleSpeed: 260,
    ballSize: 10,
    ballSpeed: 300,
    left: { y: half },
    right: { y: half },
    ball: { x: boardW / 2, y: boardH / 2, vx: 0, vy: 0 },
    scoreLeft: 0,
    scoreRight: 0,
    winScore: GOAL,
    isVersusAi: opts.isVersusAi,
    paused: false,
  };
}

export function startMatch(g: GameState, versusAi: boolean, rng: Rng): void {
  g.isVersusAi = versusAi;
  g.scoreLeft = 0;
  g.scoreRight = 0;
  g.mode = "serving";
  centerPaddles(g);
  serve(g, rng);
}

function centerPaddles(g: GameState): void {
  const half = g.boardH / 2 - g.paddleHeight / 2;
  g.left.y = half;
  g.right.y = half;
}

function serve(g: GameState, rng: Rng): void {
  const cy = g.boardH / 2;
  g.ball.x = g.boardW / 2;
  g.ball.y = cy;
  // deterministic-ish random serve direction via seeded rng
  const dir = rng() < 0.5 ? -1 : 1;
  const angle = (rng() * 0.6 - 0.3); // radians offset from horizontal
  const speed = g.ballSpeed;
  g.ball.vx = Math.cos(angle) * speed * dir;
  g.ball.vy = Math.sin(angle) * speed;
  g.mode = "serving";
}

export function scorePoint(g: GameState, side: PaddleSide, rng: Rng): void {
  if (side === "left") g.scoreLeft++;
  else g.scoreRight++;
  if (g.scoreLeft >= g.winScore || g.scoreRight >= g.winScore) {
    g.mode = "gameover";
  } else {
    serve(g, rng);
  }
}

// Move AI toward ball (right paddle) with modest speed.
function updateAi(g: GameState, dt: number): void {
  const target = g.ball.y - g.paddleHeight / 2 + g.ballSize / 2;
  const dy = target - g.right.y;
  const maxStep = g.paddleSpeed * 0.85 * dt;
  if (Math.abs(dy) > 1) {
    g.right.y += Math.max(-maxStep, Math.min(maxStep, dy));
  }
}

export function update(g: GameState, input: Input, dt: number, rng: Rng): void {
  if (g.paused) return;

  // Left paddle (human always)
  if (input.leftUp) g.left.y -= g.paddleSpeed * dt;
  if (input.leftDown) g.left.y += g.paddleSpeed * dt;

  // Right paddle
  if (g.isVersusAi) {
    updateAi(g, dt);
  } else {
    if (input.rightUp) g.right.y -= g.paddleSpeed * dt;
    if (input.rightDown) g.right.y += g.paddleSpeed * dt;
  }

  // Clamp paddles
  clampPaddle(g.left, g);
  clampPaddle(g.right, g);

  if (g.mode !== "serving" && g.mode !== "playing") return;

  // Move ball (only after serve phase advances)
  g.ball.x += g.ball.vx * dt;
  g.ball.y += g.ball.vy * dt;

  // Top/bottom bounce
  if (g.ball.y <= 0) {
    g.ball.y = 0;
    g.ball.vy = Math.abs(g.ball.vy);
  } else if (g.ball.y + g.ballSize >= g.boardH) {
    g.ball.y = g.boardH - g.ballSize;
    g.ball.vy = -Math.abs(g.ball.vy);
  }

  // Paddle collisions
  paddleCollide(g, "left");
  paddleCollide(g, "right");

  // Out of bounds => score
  if (g.ball.x < -g.ballSize) scorePoint(g, "right", rng);
  else if (g.ball.x > g.boardW) scorePoint(g, "left", rng);
}

function clampPaddle(p: Paddle, g: GameState): void {
  const max = g.boardH - g.paddleHeight;
  if (p.y < 0) p.y = 0;
  else if (p.y > max) p.y = max;
}

function paddleCollide(g: GameState, side: PaddleSide): void {
  const paddle = side === "left" ? g.left : g.right;
  const px = side === "left" ? 0 : g.boardW - 12; // paddle x (12 wide)
  const ballRight = g.ball.x + g.ballSize;
  const ballLeft = g.ball.x;
  const inX =
    side === "left"
      ? ballLeft <= px + 12 && g.ball.x > px
      : ballRight >= px && g.ball.x < px + 12;
  if (!inX) return;

  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + g.paddleHeight;
  const ballCenterY = g.ball.y + g.ballSize / 2;
  if (ballCenterY < paddleTop || ballCenterY > paddleBottom) return;

  // reflect
  if (side === "left") {
    g.ball.x = px + 12;
  } else {
    g.ball.x = px - g.ballSize;
  }
  // compute reflect angle by hit position
  const hitPos = (ballCenterY - paddleTop) / g.paddleHeight; // 0..1
  const rel = (hitPos - 0.5) * 2; // -1..1
  const maxAngle = Math.PI / 3.1;
  const angle = rel * maxAngle;
  const speed = g.ballSpeed;
  const dirX = side === "left" ? 1 : -1;
  g.ball.vx = Math.cos(angle) * speed * dirX;
  g.ball.vy = Math.sin(angle) * speed;
  g.mode = "playing";
}

export function serveStart(g: GameState): void {
  g.mode = "playing";
}

export function togglePause(g: GameState): void {
  g.paused = !g.paused;
}
