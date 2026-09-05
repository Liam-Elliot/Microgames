import { describe, it, expect } from "vitest";
import {
  createGame,
  startGame,
  update,
  fire,
  setThrust,
  turn,
  type RngLike,
} from "../src/game/game";

// Deterministic mock RNG (fixed sequence) so tests don't depend on randomness.
function mockRng(): RngLike {
  const seq = [0.5, 0.25, 0.75, 0.1, 0.9, 0.4, 0.6, 0.3, 0.7, 0.2];
  let i = 0;
  return {
    next: () => {
      const v = seq[i % seq.length];
      i++;
      return v;
    },
    int: (min: number, max: number) => min + Math.floor(0.5 * (max - min)),
    pick: <T>(items: readonly T[]) => items[0],
  };
}

describe("Asteroids", () => {
  it("starts in attract phase", () => {
    const g = createGame(mockRng());
    expect(g.phase).toBe("attract");
    expect(g.lives).toBe(3);
    expect(g.score).toBe(0);
  });

  it("startGame spawns asteroids and enters playing", () => {
    const g = createGame(mockRng());
    startGame(g);
    expect(g.phase).toBe("playing");
    expect(g.asteroids.length).toBeGreaterThan(0);
  });

  it("update advances tick without crashing", () => {
    const g = createGame(mockRng());
    startGame(g);
    for (let i = 0; i < 100; i++) update(g);
    expect(g.tick).toBe(100);
  });

  it("fire spawns a bullet while playing", () => {
    const g = createGame(mockRng());
    startGame(g);
    const before = g.bullets.length;
    fire(g);
    expect(g.bullets.length).toBe(before + 1);
  });

  it("thrust and turn modify ship state without error", () => {
    const g = createGame(mockRng());
    startGame(g);
    const angleBefore = g.ship.angle;
    turn(g, 1);
    expect(g.ship.angle).not.toBe(angleBefore); // turn rotates the ship
    setThrust(g, true);
    update(g);
    expect(g.ship.thrusting).toBe(true);
  });
});
