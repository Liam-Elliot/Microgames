import { describe, it, expect } from "vitest";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  reveal,
  toggleFlag,
  getCell,
  MINE,
} from "../src/game/game";

describe("Minesweeper", () => {
  it("starts in ready phase with full flag count", () => {
    const g = createGame(seededRng(7), { difficulty: "beginner" });
    expect(g.phase).toBe("ready");
    expect(g.flagsRemaining).toBe(10); // beginner
    expect(g.cells.length).toBe(9 * 9);
  });

  it("first reveal is safe (never a mine)", () => {
    const g = createGame(seededRng(7), { difficulty: "beginner" });
    reveal(g, 4, 4);
    const cell = getCell(g, 4, 4);
    expect(cell.value).not.toBe(MINE);
  });

  it("first reveal transitions out of ready", () => {
    const g = createGame(seededRng(7), { difficulty: "beginner" });
    reveal(g, 0, 0);
    expect(g.phase).not.toBe("ready");
  });

  it("toggleFlag toggles flag state and count", () => {
    const g = createGame(seededRng(7), { difficulty: "beginner" });
    const before = g.flagsRemaining;
    toggleFlag(g, 0, 0);
    expect(getCell(g, 0, 0).flagged).toBe(true);
    expect(g.flagsRemaining).toBe(before - 1);
  });

  it("revealing all non-mine cells wins", () => {
    const g = createGame(seededRng(7), { difficulty: "beginner" });
    // reveal first cell (places mines)
    reveal(g, 0, 0);
    if (g.phase === "lost") return; // edge: first safe reveal never loses
    // reveal every non-mine, non-revealed cell
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        const c = getCell(g, x, y);
        if (c.value !== MINE && !c.revealed) reveal(g, x, y);
      }
    }
    expect(g.phase).toBe("won");
  });
});
