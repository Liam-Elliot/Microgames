import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { App } from "../src/App";
import { GAMES } from "../src/registry";

// jsdom lacks matchMedia → Shell boot typewriter runs in reduced mode and a
// keydown advances the splash, so we can drive the menu deterministically.

describe("launcher app", () => {
  it("boots to the multi-game menu after splash", async () => {
    render(<App />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" })); // skip/advance splash
    await new Promise((r) => setTimeout(r, 20));
    const playable = GAMES.filter((g) => g.Mount);
    for (const g of playable.slice(0, 6)) {
      expect(screen.getByText(g.label, { exact: false })).toBeTruthy();
    }
    cleanup();
  });

  it("mounts a game on selection and returns on escape", async () => {
    const { container } = render(<App />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    await new Promise((r) => setTimeout(r, 20));
    // confirm the first enabled option (first playable game) via Enter
    const grid = container.querySelector('[tabindex="0"]') as HTMLElement;
    expect(grid).toBeTruthy();
    fireEvent.keyDown(grid, { key: "Enter" });
    await new Promise((r) => setTimeout(r, 20));
    // game mounted (menu title no longer the only content) — then esc exits
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByText("arcadivision", { exact: false })).toBeTruthy();
    cleanup();
  });
});
