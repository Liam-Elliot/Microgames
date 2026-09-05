// minesweeper — Arcadivision MicroGame
// Decoupled game logic (pure TS, injected RNG) + React/DOM presentation wired to
// @arcadivision/shell. See src/game/game.ts (logic), src/App.tsx (entry).

export * from "./game/game.js";

export const title = "minesweeper";
export const status = "playable"; // shell-integrated, typecheck + build clean
