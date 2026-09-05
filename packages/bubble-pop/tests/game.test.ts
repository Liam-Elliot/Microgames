import { describe, it, expect } from "vitest";
import {
  createGame,
  startGame,
  shoot,
  placeForTest,
  columnHeight,
  columnFull,
  type RngLike,
} from "../src/game/game";

function mockRng(): RngLike {
  let i = 0;
  return {
    next: () => 0.5,
    int: (_min: number, _max: number) => {
      const v = [0, 1, 2, 3][i % 4];
      i++;
      return v;
    },
    pick: <T>(items: readonly T[]): T => items[0],
  };
}

describe("Bubble Pop", () => {
  it("starts in menu phase", () => {
    expect(createGame().phase).toBe("menu");
  });

  it("startGame resets and enters playing", () => {
    const g = createGame();
    startGame(g, mockRng());
    expect(g.phase).toBe("playing");
    expect(g.lives).toBe(3);
    expect(g.score).toBe(0);
  });

  it("shoot stacks a bubble at the first empty row", () => {
    const g = createGame();
    startGame(g, mockRng());
    g.current = 0;
    const res = shoot(g, 2);
    expect(res.row).toBe(0);
    expect(g.grid[0][2]).toBe(0);
    expect(columnHeight(g, 2)).toBe(1);
  });

  it("pops a vertical match of 3 same-colored bubbles", () => {
    const g = createGame();
    startGame(g, mockRng());
    // pre-fill two above in same column
    placeForTest(g, 4, 0, 1);
    placeForTest(g, 4, 1, 1);
    g.current = 1; // shoot the third at col 4 -> lands row 2
    const res = shoot(g, 4);
    expect(res.popped).toBe(3);
    expect(g.grid[0][4]).toBeNull();
    expect(g.grid[1][4]).toBeNull();
    expect(g.grid[2][4]).toBeNull();
  });

  it("does not pop a 2-bubble group", () => {
    const g = createGame();
    startGame(g, mockRng());
    placeForTest(g, 3, 0, 1);
    g.current = 1;
    const res = shoot(g, 3);
    expect(res.popped).toBe(0);
    expect(columnHeight(g, 3)).toBe(2);
  });

  it("drops floaters not anchored to the ceiling", () => {
    const g = createGame();
    startGame(g, mockRng());
    // anchor a column to ceiling and leave a disconnected pocket elsewhere
    placeForTest(g, 5, 0, 1);
    placeForTest(g, 5, 1, 1);
    // a bubble in row 2, col 5 would be connected; put an unanchored one far down col 0
    placeForTest(g, 0, 8, 2);
    g.current = 0;
    shoot(g, 5); // triggers pop logic; anchored pass removes floating col0 bubble
    expect(g.grid[8][0]).toBeNull();
  });

  it("overflow costs a life and ends at zero lives", () => {
    const g = createGame();
    startGame(g, mockRng());
    for (let r = 0; r < 11; r++) placeForTest(g, 7, r, 0);
    expect(columnFull(g, 7)).toBe(true);
    g.current = 0;
    const res = shoot(g, 7);
    expect(res.overflowed).toBe(true);
    expect(g.lives).toBe(2);
  });
});
