import { describe, expect, it } from "vitest";
import { GAMES, PLAYABLE, TOTAL } from "../src/registry";

describe("registry", () => {
  it("registers ≥8 playable games with Mount components", () => {
    expect(PLAYABLE).toBeGreaterThanOrEqual(8);
    expect(TOTAL).toBe(GAMES.length);
  });

  it("every entry has a unique non-empty id and label", () => {
    const ids = new Set(GAMES.map((g) => g.id));
    const labels = new Set(GAMES.map((g) => g.label));
    expect(ids.size).toBe(GAMES.length);
    expect(labels.size).toBe(GAMES.length);
    for (const g of GAMES) {
      expect(g.id.length).toBeGreaterThan(0);
      expect(g.label.length).toBeGreaterThan(0);
    }
  });

  it("playable Mount entries are components, stubs are null", () => {
    for (const g of GAMES) {
      if (g.Mount) expect(typeof g.Mount).toBe("function");
    }
    expect(GAMES.some((g) => g.Mount === null)).toBe(true); // stubs present
  });
});
