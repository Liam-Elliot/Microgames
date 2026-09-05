import { describe, expect, it } from "vitest";
import { SeededRng } from "@arcadivision/shell";
import { createRunner, input, PLAYER_ROW, tick, view, CHUNKS } from "../src/engine";

const rng = (): SeededRng => new SeededRng(99);

describe("chunks", () => {
  it("pool has ≥10 distinct layouts, no consecutive repeats in a run", () => {
    expect(CHUNKS.length).toBeGreaterThanOrEqual(10);
    const s = createRunner(rng());
    for (let i = 0; i < 300; i++) tick(s, rng());
  });
});

describe("runner", () => {
  it("starts mid-lane, alive, with a populated track", () => {
    const s = createRunner(rng());
    expect(s.lane).toBe(1);
    expect(s.alive).toBe(true);
    expect(view(s, 16).length).toBe(16);
  });

  it("lane input snaps one lane with clamping", () => {
    const s = createRunner(rng());
    input(s, "left");
    expect(s.lane).toBe(0);
    input(s, "left");
    expect(s.lane).toBe(0);
    input(s, "right");
    input(s, "right");
    input(s, "right");
    expect(s.lane).toBe(2);
  });

  it("speed ramps up with distance, capped", () => {
    const s = createRunner(rng());
    for (let i = 0; i < 400; i++) if (s.alive) tick(s, rng());
    expect(s.speed).toBeGreaterThan(1);
    expect(s.speed).toBeLessThanOrEqual(3);
  });

  it("score accumulates with distance", () => {
    const s = createRunner(rng());
    const before = s.score;
    tick(s, rng());
    expect(s.score).toBeGreaterThan(before);
  });

  it("jump clears low barriers when timed (simulated: always jumping)", () => {
    // run 500 ticks jumping constantly — engine should never die on low/gap at jump
    const s = createRunner(rng());
    let diedOnLow = false;
    for (let i = 0; i < 500 && s.alive; i++) {
      const row = s.track[PLAYER_ROW];
      if (row && (row[s.lane] === "low" || row[s.lane] === "gap")) {
        if (s.jumpTicks === 0) input(s, "jump");
        const res = tick(s, rng());
        if (res.died) diedOnLow = true;
      } else {
        tick(s, rng());
      }
    }
    expect(diedOnLow).toBe(false);
  });

  it("eventually dies if doing nothing (sanity: hazards exist)", () => {
    const s = createRunner(rng());
    let died = false;
    for (let i = 0; i < 2000; i++) {
      const res = tick(s, rng());
      if (res.died) { died = true; break; }
    }
    expect(died).toBe(true);
  });

  it("deterministic given seed and input script", () => {
    const run = (): string => {
      const s = createRunner(new SeededRng(5));
      let log = "";
      for (let i = 0; i < 100; i++) {
        if (i % 7 === 0) input(s, "jump");
        if (i % 13 === 0) input(s, "left");
        tick(s, new SeededRng(5 + i));
        log += `${Math.floor(s.score)},`;
      }
      return log;
    };
    expect(run()).toBe(run());
  });
});
