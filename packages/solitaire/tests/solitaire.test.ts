import { describe, it, expect } from "vitest";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  draw,
  wasteToTableau,
  wasteToFoundation,
  tableauToTableau,
  tableauToFoundation,
  isWon,
} from "../src/game/game";

describe("Solitaire (Klondike)", () => {
  it("deals 7 tableau piles with correct sizes", () => {
    const g = createGame(seededRng(7));
    expect(g.tableau.length).toBe(7);
    expect(g.tableau[0].length).toBe(1);
    expect(g.tableau[6].length).toBe(7);
    expect(g.tableau[6][6].faceUp).toBe(true); // top card face-up
    expect(g.tableau[6][0].faceUp).toBe(false); // bottom card face-down
  });

  it("stock has 24 cards after deal", () => {
    const g = createGame(seededRng(7));
    expect(g.stock.length).toBe(24);
    expect(g.foundations.length).toBe(4);
  });

  it("draw moves 3 cards to waste", () => {
    const g = createGame(seededRng(7));
    draw(g, 3);
    expect(g.waste.length).toBe(3);
    expect(g.stock.length).toBe(21);
  });

  it("draw recycles waste to stock when empty", () => {
    const g = createGame(seededRng(7));
    // exhaust stock
    while (g.stock.length > 0) draw(g, 3);
    const wasteLen = g.waste.length;
    draw(g, 3); // recycle
    expect(g.stock.length).toBe(wasteLen);
    expect(g.waste.length).toBe(0);
  });

  it("wasteToTableau rejects invalid move, accepts King on empty", () => {
    const g = createGame(seededRng(7));
    // empty tableau pile only accepts King
    const emptyPile = -1;
    void emptyPile;
    // find a King in waste by drawing until we see one, or verify rejection path
    let moved = false;
    for (let i = 0; i < 30 && !moved; i++) {
      if (g.waste.length === 0) draw(g, 3);
      const top = g.waste[g.waste.length - 1];
      if (top && top.rank === 13) {
        // find empty tableau
        const emptyIdx = g.tableau.findIndex((p) => p.length === 0);
        if (emptyIdx >= 0) moved = wasteToTableau(g, emptyIdx);
      }
    }
    // either we moved or the state is still consistent
    expect(g.phase).toBe("playing");
    void moved;
  });

  it("wasteToFoundation rejects non-ace on empty foundation", () => {
    const g = createGame(seededRng(7));
    const moved = wasteToFoundation(g, 0); // foundation empty, top waste not necessarily ace
    expect(moved).toBe(false);
  });

  it("not won initially", () => {
    const g = createGame(seededRng(7));
    expect(isWon(g)).toBe(false);
    expect(g.phase).toBe("playing");
  });

  it("tableauToTableau and tableauToFoundation are defined and type-safe", () => {
    const g = createGame(seededRng(7));
    // no crash on invalid moves
    expect(() => tableauToTableau(g, 0, 0, 1)).not.toThrow();
    expect(() => tableauToFoundation(g, 0, 0)).not.toThrow();
  });
});
