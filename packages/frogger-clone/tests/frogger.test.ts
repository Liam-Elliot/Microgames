import { describe, it, expect } from "vitest";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  update,
  hop,
  GRID_WIDTH,
} from "../src/game/game";

describe("Frogger", () => {
  it("starts playing with frog at bottom center", () => {
    const g = createGame(seededRng(7));
    expect(g.phase).toBe("playing");
    expect(g.frog.y).toBe(0); // start row
    expect(g.frog.x).toBe(Math.floor(GRID_WIDTH / 2));
    expect(g.lives).toBe(3);
  });

  it("hop up moves frog forward and scores", () => {
    const g = createGame(seededRng(7));
    const beforeScore = g.score;
    const beforeY = g.frog.y;
    hop(g, 0, 1);
    expect(g.frog.y).toBe(beforeY + 1);
    expect(g.score).toBeGreaterThan(beforeScore);
  });

  it("hop blocked at screen edge (no wrap)", () => {
    const g = createGame(seededRng(7));
    hop(g, -100, 0); // far left
    expect(g.frog.x).toBeGreaterThanOrEqual(0);
    hop(g, 0, -100); // below bottom
    expect(g.frog.y).toBeGreaterThanOrEqual(0);
  });

  it("update advances tick without crashing", () => {
    const g = createGame(seededRng(7));
    for (let i = 0; i < 100; i++) update(g);
    expect(g.tick).toBe(100);
  });

  it("update moves movers horizontally", () => {
    const g = createGame(seededRng(7));
    const mover = g.movers[0];
    const x0 = mover.x;
    for (let i = 0; i < 50; i++) update(g);
    expect(mover.x).not.toBe(x0);
  });
});
