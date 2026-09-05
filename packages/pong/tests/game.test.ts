import { describe, it, expect } from "vitest";
import {
  createGame,
  startMatch,
  update,
  scorePoint,
  serveStart,
  togglePause,
  type GameState,
  type RngLike,
} from "../src/game/game";

// Deterministic mock RNG (object shape per §9.1).
function mockRng(v = 0.5): RngLike {
  return {
    next: () => v,
    int: (_min: number, max: number) => Math.floor(v * max),
    pick: <T,>(items: readonly T[]): T => items[0],
  };
}

const NO_INPUT = { leftUp: false, leftDown: false, rightUp: false, rightDown: false };

function startPlaying(g: GameState, versusAi = false): void {
  startMatch(g, versusAi, mockRng());
  g.mode = "playing"; // skip the "serving" wait
}

describe("Pong", () => {
  it("starts in menu", () => {
    expect(createGame({ isVersusAi: false, rng: mockRng() }).mode).toBe("menu");
  });

  it("startMatch resets scores and centres paddles", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    g.scoreLeft = 7;
    g.scoreRight = 3;
    g.left.y = 5;
    startMatch(g, false, mockRng());
    expect(g.scoreLeft).toBe(0);
    expect(g.scoreRight).toBe(0);
    expect(g.mode).toBe("serving");
    expect(g.left.y).toBe(g.boardH / 2 - g.paddleHeight / 2);
    expect(g.right.y).toBe(g.boardH / 2 - g.paddleHeight / 2);
  });

  it("clamps paddle within board bounds", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startPlaying(g);
    g.left.y = -50;
    update(g, { ...NO_INPUT, leftUp: true }, 0.1, mockRng());
    expect(g.left.y).toBeGreaterThanOrEqual(0);

    g.right.y = 9999;
    update(g, { ...NO_INPUT, rightDown: true }, 0.1, mockRng());
    expect(g.right.y).toBeLessThanOrEqual(g.boardH - g.paddleHeight);
  });

  it("moves paddle up with input", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startPlaying(g);
    const y = g.left.y;
    update(g, { ...NO_INPUT, leftUp: true }, 0.05, mockRng());
    expect(g.left.y).toBeLessThan(y);
  });

  it("scores for the right side when ball exits left", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startPlaying(g);
    g.ball.x = -20; // off left edge
    g.ball.vx = -300;
    update(g, NO_INPUT, 0.1, mockRng());
    expect(g.scoreRight).toBe(1);
  });

  it("ball bounces off top and bottom walls", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startPlaying(g);
    // top bounce
    g.ball.y = -5;
    g.ball.vy = -100;
    update(g, NO_INPUT, 0.05, mockRng());
    expect(g.ball.y).toBeGreaterThanOrEqual(0);
    expect(g.ball.vy).toBeGreaterThan(0);
    // bottom bounce
    g.ball.y = g.boardH - g.ballSize + 5;
    g.ball.vy = 100;
    update(g, NO_INPUT, 0.05, mockRng());
    expect(g.ball.y).toBeLessThanOrEqual(g.boardH - g.ballSize);
    expect(g.ball.vy).toBeLessThan(0);
  });

  it("reaches gameover at win score 11", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startPlaying(g);
    g.scoreRight = 10;
    scorePoint(g, "right", mockRng());
    expect(g.scoreRight).toBe(11);
    expect(g.mode).toBe("gameover");
  });

  it("pauses updates", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startPlaying(g);
    const x = g.ball.x;
    togglePause(g);
    expect(g.paused).toBe(true);
    update(g, NO_INPUT, 0.1, mockRng());
    expect(g.ball.x).toBe(x);
  });

  it("serveStart transitions serving to playing", () => {
    const g = createGame({ isVersusAi: false, rng: mockRng() });
    startMatch(g, false, mockRng());
    expect(g.mode).toBe("serving");
    serveStart(g);
    expect(g.mode).toBe("playing");
  });
});
