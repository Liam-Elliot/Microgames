import { describe, it, expect } from "vitest";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  hardDrop,
  moveLeft,
  moveRight,
  rotateCW,
  holdPiece,
  update,
  pieceCells,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from "../src/game/game";

describe("Tetris", () => {
  it("starts playing with a current piece", () => {
    const g = createGame(seededRng(7));
    expect(g.phase).toBe("playing");
    expect(g.current.type).toBeTruthy();
    expect(g.board.length).toBe(BOARD_HEIGHT);
    expect(g.board[0].length).toBe(BOARD_WIDTH);
  });

  it("7-bag: next queue is populated", () => {
    const g = createGame(seededRng(7));
    expect(g.nextQueue.length).toBeGreaterThanOrEqual(4);
  });

  it("moveLeft/right change x within bounds", () => {
    const g = createGame(seededRng(7));
    const x0 = g.current.x;
    moveLeft(g);
    expect(g.current.x).toBeLessThanOrEqual(x0);
    moveRight(g);
    expect(g.current.x).toBeGreaterThanOrEqual(x0 - 1);
    expect(g.current.x).toBeLessThan(BOARD_WIDTH);
  });

  it("hardDrop locks the piece and spawns a new one", () => {
    const g = createGame(seededRng(7));
    const before = g.current.type;
    hardDrop(g);
    expect(g.current.type).toBeTruthy();
    expect(g.board.some((row) => row.some((c) => c !== null))).toBe(true);
    void before;
  });

  it("rotateCW changes rotation", () => {
    const g = createGame(seededRng(7));
    const r0 = g.current.rotation;
    rotateCW(g);
    expect(g.current.rotation).not.toBe(r0);
  });

  it("holdPiece swaps current with hold", () => {
    const g = createGame(seededRng(7));
    const first = g.current.type;
    holdPiece(g);
    expect(g.hold).toBe(first);
    expect(g.current.type).toBeTruthy();
  });

  it("pieceCells returns 4 cells", () => {
    const g = createGame(seededRng(7));
    expect(pieceCells(g.current).length).toBe(4);
  });

  it("update advances without crashing", () => {
    const g = createGame(seededRng(7));
    for (let i = 0; i < 100; i++) update(g);
    expect(g.tick).toBe(100);
  });
});
