import { describe, expect, it } from "vitest";
import { SeededRng } from "@arcadivision/shell";
import {
  anyLegalMove,
  findMatches,
  newBoard,
  playMove,
  swapLegal,
  type Board,
  type Cell,
  type Rng,
} from "../src/engine";

const c = (color: number, special: Cell["special"] = null): Cell => ({ color, special });

const rng = (): Rng => new SeededRng(42);



describe("board generation", () => {
  it("new board has no matches and has a legal move", () => {
    for (let seed = 1; seed < 20; seed++) {
      const b = newBoard(new SeededRng(seed));
      expect(findMatches(b).length).toBe(0);
      expect(anyLegalMove(b)).toBe(true);
    }
  });
});

describe("swap legality", () => {
  it("rejects a swap that creates no match, accepts one that does", () => {
    const b: Board = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, cc) => c((3 * r + cc) % 6)),
    );
    expect(swapLegal(b, 0, 0, 0, 1)).toBe(false);
    expect(swapLegal(b, 0, 0, 1, 0)).toBe(false);
    b[1][3] = c(5);
    b[2][3] = c(5);
    b[3][3] = c(1);
    b[3][2] = c(5);
    expect(swapLegal(b, 3, 2, 3, 3)).toBe(true); // col 3 rows 1-3 = 5,5,5
  });
});

describe("playMove", () => {
  it("illegal move returns original board unchanged", () => {
    const b = newBoard(new SeededRng(9));
    const { board, result } = playMove(b, 0, 0, 5, 5, rng());
    expect(result.legal).toBe(false);
    expect(board).toBe(b);
  });

  it("legal 3-match move scores ≥30 and board resolves clean", () => {
    const base: Board = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, cc) => c((3 * r + cc) % 6)),
    );
    base[1][3] = c(5);
    base[2][3] = c(5);
    base[3][3] = c(1);
    base[3][2] = c(5);
    const { board, result } = playMove(base, 3, 2, 3, 3, rng());
    expect(result.legal).toBe(true);
    expect(result.totalPoints).toBeGreaterThanOrEqual(30);
    expect(findMatches(board).length).toBe(0);
  });

  it("board stays playable after moves (no deadlock left behind)", () => {
    const b = newBoard(new SeededRng(11));
    // find and play a legal move
    outer: for (let r = 0; r < 8; r++) {
      for (let cc = 0; cc < 7; cc++) {
        if (swapLegal(b, r, cc, r, cc + 1)) {
          const { board } = playMove(b, r, cc, r, cc + 1, rng());
          expect(anyLegalMove(board)).toBe(true);
          expect(findMatches(board).length).toBe(0);
          break outer;
        }
      }
    }
  });

  it("4-match creates a line special; cascades resolve fully", () => {
    // pattern (3r+c)%6: no horizontal (step 1) or vertical (step 3) repeats
    const base: Board = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, cc) => c((3 * r + cc) % 6)),
    );
    // set up vertical 4-run of color 5 in col 3 via one swap
    base[1][3] = c(5);
    base[2][3] = c(5);
    base[3][3] = c(1); // moves to (3,2) via swap -> col 3 rows 1-4 all 5
    base[4][3] = c(5);
    base[3][2] = c(5);
    expect(findMatches(base).length).toBe(0); // precondition: clean board
    expect(swapLegal(base, 3, 2, 3, 3)).toBe(true);
    const { board, result } = playMove(base, 3, 2, 3, 3, rng());
    expect(result.legal).toBe(true);
    expect(result.totalPoints).toBeGreaterThanOrEqual(30);
    expect(board.flat().some((cell) => cell.special === "line-v" || cell.special === "line-h")).toBe(true);
    expect(findMatches(board).length).toBe(0); // cascades fully resolved
    expect(anyLegalMove(board)).toBe(true); // deadlock auto-handled
  });
});

describe("determinism", () => {
  it("same seed → identical board", () => {
    expect(JSON.stringify(newBoard(new SeededRng(77)))).toBe(JSON.stringify(newBoard(new SeededRng(77))));
  });
});
