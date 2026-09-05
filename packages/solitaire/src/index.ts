// solitaire — Arcadivision MicroGame
// Decoupled game logic (pure TS, seeded RNG) + React/Vite presentation wired to
// @arcadivision/shell. See src/game.ts (logic), src/App.tsx (entry), src/hooks + src/present (wiring).

export * from "./game.js";
export * from "./rng.js";

export const title = "solitaire";
export const status = "playable"; // shell-integrated, typecheck + build clean
