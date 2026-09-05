import { describe, it, expect } from "vitest";
import {
  createGame,
  startGame,
  flap,
  update,
  type RngLike,
} from "../src/game/game";

function mockRng(mid = 0.5): RngLike {
  return {
    next: () => mid,
    int: (_a: number, b: number) => Math.floor(mid * b),
    pick: <T,>(items: readonly T[]): T => items[0],
  };
}

describe("Flappy Bird", () => {
  it("starts ready; flap begins play", () => {
    const g = createGame();
    expect(g.phase).toBe("ready");
    flap(g);
    expect(g.phase).toBe("playing");
  });

  it("gravity pulls the bird down when not flapping", () => {
    const g = createGame();
    startGame(g);
    flap(g); // playing
    // apply upward then let gravity dominate over time
    g.bird.vy = 0;
    update(g, 0.05, mockRng());
    expect(g.bird.vy).toBeGreaterThan(0);
    // ensure a fall after starting from rest lowers y eventually
    const before = g.bird.y;
    for (let i = 0; i < 20; i++) update(g, 0.016, mockRng());
    expect(g.bird.y).toBeGreaterThan(before);
  });

  it("spawns pipes over distance", () => {
    const g = createGame();
    startGame(g);
    flap(g);
    for (let i = 0; i < 300 && g.phase === "playing"; i++) {
      if (g.bird.y > 300) flap(g);
      update(g, 0.016, mockRng());
    }
    expect(g.pipes.length).toBeGreaterThan(0);
  });

  it("scores when passing a pipe", () => {
    const g = createGame();
    startGame(g);
    flap(g);
    // fly well above ground through many pipes without dying: keep flapping
    let scored = false;
    for (let i = 0; i < 600; i++) {
      // flap periodically to stay near center
      if (g.bird.y > 300) flap(g);
      const r = update(g, 0.016, mockRng(0.5));
      if (r.scored) scored = true;
      if (g.phase === "over") break;
    }
    expect(scored).toBe(true);
  });

  it("hitting the ground ends the game", () => {
    const g = createGame();
    startGame(g);
    flap(g);
    // do nothing: bird falls to ground
    let over = false;
    for (let i = 0; i < 200 && g.phase !== "over"; i++) {
      const r = update(g, 0.016, mockRng());
      if (r.died) over = true;
    }
    expect(over).toBe(true);
    expect(g.phase).toBe("over");
  });
});
