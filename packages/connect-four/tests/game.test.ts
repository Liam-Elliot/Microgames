import { describe, it, expect } from "vitest";
import {
  createGame,
  startMatch,
  dropDisc,
  checkWin,
  boardFull,
  chooseAiMove,
  advanceTurn,
  columnFull,
  type GameState,
  type RngLike,
  ROWS,
} from "../src/game/game";

function mockRng(v = 0.5): RngLike {
  return {
    next: () => v,
    int: (_min: number, max: number) => Math.floor(v * max),
    pick: <T,>(items: readonly T[]): T => items[0],
  };
}

function newGame(): GameState {
  const g = createGame({ isVersusAi: false });
  startMatch(g, false, "easy");
  return g;
}

/** Set a disc directly at (col,row). row 0 = top of column. */
function setCell(g: GameState, col: number, rowFromTop: number, player: 1 | 2): void {
  g.board[col][rowFromTop] = player;
}

describe("Connect Four", () => {
  it("gravity stacks discs at the lowest empty row", () => {
    const g = newGame();
    const prev = g.current;
    g.current = 1;
    const r1 = dropDisc(g, 3);
    g.current = 2;
    const r2 = dropDisc(g, 3);
    g.current = prev;
    expect(r1).toBe(ROWS - 1);
    expect(r2).toBe(ROWS - 2);
  });

  it("rejects a drop into a full column", () => {
    const g = newGame();
    for (let r = 0; r < ROWS; r++) setCell(g, 0, r, 1);
    expect(columnFull(g, 0)).toBe(true);
    const prev = g.current;
    g.current = 2;
    expect(dropDisc(g, 0)).toBe(-1);
    g.current = prev;
  });

  it("detects a horizontal win", () => {
    const g = newGame();
    [0, 1, 2, 3].forEach((c) => setCell(g, c, ROWS - 1, 1));
    expect(checkWin(g, 3, ROWS - 1, 1)).toBe(true);
  });

  it("detects a vertical win", () => {
    const g = newGame();
    for (let r = ROWS - 1; r >= ROWS - 4; r--) setCell(g, 5, r, 1);
    expect(checkWin(g, 5, ROWS - 4, 1)).toBe(true);
  });

  it("detects an ascending diagonal win", () => {
    const g = newGame();
    // ascending: (0,5),(1,4),(2,3),(3,2) -> col+1 row-1
    setCell(g, 0, ROWS - 1, 1);
    setCell(g, 1, ROWS - 2, 1);
    setCell(g, 2, ROWS - 3, 1);
    setCell(g, 3, ROWS - 4, 1);
    expect(checkWin(g, 3, ROWS - 4, 1)).toBe(true);
  });

  it("detects a descending diagonal win", () => {
    const g = newGame();
    setCell(g, 0, ROWS - 4, 1);
    setCell(g, 1, ROWS - 3, 1);
    setCell(g, 2, ROWS - 2, 1);
    setCell(g, 3, ROWS - 1, 1);
    expect(checkWin(g, 3, ROWS - 1, 1)).toBe(true);
  });

  it("does not report a win for only 3 in a row", () => {
    const g = newGame();
    [0, 1, 2].forEach((c) => setCell(g, c, ROWS - 1, 1));
    expect(checkWin(g, 2, ROWS - 1, 1)).toBe(false);
  });

  it("AI picks a winning move when available", () => {
    const g = createGame({ isVersusAi: true, difficulty: "hard" });
    startMatch(g, true, "hard");
    g.current = 2; // AI to move
    [0, 1, 2].forEach((c) => setCell(g, c, ROWS - 1, 2));
    expect(chooseAiMove(g, mockRng())).toBe(3);
  });

  it("AI blocks an opponent's winning move", () => {
    const g = createGame({ isVersusAi: true, difficulty: "hard" });
    startMatch(g, true, "hard");
    g.current = 2;
    [0, 1, 2].forEach((c) => setCell(g, c, ROWS - 1, 1)); // human threat
    expect(chooseAiMove(g, mockRng())).toBe(3);
  });

  it("declares the board full", () => {
    const g = newGame();
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < ROWS; r++) {
        g.board[c][r] = (c + r) % 2 === 0 ? 1 : 2;
      }
    }
    expect(boardFull(g)).toBe(true);
  });

  it("advanceTurn alternates players", () => {
    const g = newGame();
    expect(g.current).toBe(1);
    advanceTurn(g);
    expect(g.current).toBe(2);
    advanceTurn(g);
    expect(g.current).toBe(1);
  });
});
