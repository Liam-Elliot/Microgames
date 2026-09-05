import { describe, expect, it } from "vitest";
import type { SnakeState } from "../src/engine";
import { createGame, queueDir, step } from "../src/engine";
import { SeededRng } from "@arcadivision/shell";
import { rollColors, hslCss } from "../src/colors";

const rng = (): SeededRng => new SeededRng(1234);

describe("engine", () => {
  it("snake moves right and grows on food", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 1, foodCount: 1 }, 3);
    // place food directly ahead of head (7,12) — head at (6,12) moving right
    g.food[0] = { x: 7, y: 12 };
    const len0 = g.snakes[0].body.length;
    step(g, rng());
    expect(g.snakes[0].body[0]).toEqual({ x: 7, y: 12 });
    expect(g.snakes[0].body.length).toBe(len0 + 1);
    expect(g.snakes[0].score).toBe(10);
  });

  it("wall collision kills, decrements life, corpse explodes then respawns", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 1, foodCount: 1 }, 2);
    // force snake to top-left heading left into wall
    const s = g.snakes[0];
    s.body = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    s.dir = "left";
    step(g, rng());
    expect(s.alive).toBe(false);
    expect(s.exploding).toBe(true);
    expect(s.lives).toBe(1);
    // corpse shrinks one segment per tick
    const len = s.body.length;
    step(g, rng());
    expect(s.body.length).toBe(len - 1);
    // run out corpse
    while (s.exploding) step(g, rng());
    expect(s.alive).toBe(true); // respawned, fresh short snake
    expect(s.body.length).toBe(3);
  });

  it("self collision kills", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 1, foodCount: 1 }, 1);
    const s = g.snakes[0];
    // make a U so moving down hits own body
    s.body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }];
    s.dir = "down";
    step(g, rng());
    expect(s.alive).toBe(false);
  });

  it("no 180° reversal via queued input", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 1, foodCount: 1 }, 3);
    queueDir(g, 0, "left"); // moving right, reversed — must be ignored
    step(g, rng());
    expect(g.snakes[0].body[0]).toEqual({ x: 7, y: 12 });
  });

  it("2P asymmetric: A into B's body kills A only", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 2, foodCount: 1 }, 3);
    const [a, b] = g.snakes as [SnakeState, SnakeState];
    b.body = [{ x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 }];
    b.dir = "up";
    a.body = [{ x: 9, y: 12 }, { x: 8, y: 12 }, { x: 7, y: 12 }];
    a.dir = "right";
    step(g, rng());
    expect(a.alive).toBe(false);
    expect(b.alive).toBe(true);
  });

  it("2P head-to-head same cell: both die (mutual KO default)", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 2, foodCount: 1 }, 3);
    const [a, b] = g.snakes as [SnakeState, SnakeState];
    a.body = [{ x: 5, y: 12 }, { x: 4, y: 12 }, { x: 3, y: 12 }];
    a.dir = "right";
    b.body = [{ x: 7, y: 12 }, { x: 8, y: 12 }, { x: 9, y: 12 }];
    b.dir = "left";
    step(g, rng());
    expect(a.alive).toBe(false);
    expect(b.alive).toBe(false);
  });

  it("1P game over when last life lost; 2P draw on mutual final elimination", () => {
    const g = createGame({ width: 24, height: 24, playerCount: 1, foodCount: 1 }, 1);
    const s = g.snakes[0];
    s.body = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    s.dir = "left";
    step(g, rng());
    while (s.exploding) step(g, rng());
    expect(g.phase).toBe("over");
  });

  it("deterministic given same rng seed", () => {
    const run = (): number[] => {
      const g = createGame({ width: 24, height: 24, playerCount: 1, foodCount: 3 }, 3);
      const r = new SeededRng(7);
      const heads: number[] = [];
      for (let i = 0; i < 50; i++) {
        step(g, r);
        heads.push(g.snakes[0].body[0].x * 100 + g.snakes[0].body[0].y);
      }
      return heads;
    };
    expect(run()).toEqual(run());
  });
});

describe("colors", () => {
  it("all pairwise hue separations ≥ 90°", () => {
    for (let seed = 1; seed < 50; seed++) {
      const { p1, p2, food } = rollColors(new SeededRng(seed));
      const sep = (a: number, b: number): number => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
      expect(sep(p1.h, p2.h)).toBeGreaterThanOrEqual(89);
      expect(sep(p1.h, food.h)).toBeGreaterThanOrEqual(89);
      expect(sep(p2.h, food.h)).toBeGreaterThanOrEqual(89);
    }
  });

  it("produces valid css", () => {
    const { p1 } = rollColors(new SeededRng(1));
    expect(hslCss(p1)).toMatch(/^hsl\(/);
  });
});
