import { describe, it, expect } from "vitest";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  startGame,
  update,
  fire,
  setThrust,
  turn,
} from "../src/game/game";

describe("Asteroids", () => {
  it("starts in attract phase", () => {
    const g = createGame(seededRng(7));
    expect(g.phase).toBe("attract");
    expect(g.lives).toBe(3);
    expect(g.score).toBe(0);
  });

  it("startGame spawns asteroids and enters playing", () => {
    const g = createGame(seededRng(7));
    startGame(g);
    expect(g.phase).toBe("playing");
    expect(g.asteroids.length).toBeGreaterThan(0);
  });

  it("update advances tick without crashing", () => {
    const g = createGame(seededRng(7));
    startGame(g);
    for (let i = 0; i < 100; i++) update(g);
    expect(g.tick).toBe(100);
  });

  it("fire spawns a bullet while playing", () => {
    const g = createGame(seededRng(7));
    startGame(g);
    const before = g.bullets.length;
    fire(g);
    expect(g.bullets.length).toBe(before + 1);
  });

  it("thrust and turn modify ship state without error", () => {
    const g = createGame(seededRng(7));
    startGame(g);
    const angleBefore = g.ship.angle;
    turn(g, 1);
    expect(g.ship.angle).not.toBe(angleBefore); // turn rotates the ship
    setThrust(g, true);
    update(g);
    expect(g.ship.thrusting).toBe(true);
  });
});
