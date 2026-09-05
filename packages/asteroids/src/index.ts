// asteroids — Arcadivision MicroGame
// Decoupled game logic (pure TS, injected RNG) + React/Vite presentation wired to
// @arcadivision/shell. See src/game/game.ts (logic), src/App.tsx (entry).

export * from "./game/game.js";

export const title = "asteroids";
export const status = "playable"; // shell-integrated, typecheck + build clean

// canonical registration surface (launcher contract, style-guide §9.2)
export { App as Mount } from "./App";
