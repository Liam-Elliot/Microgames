/**
 * Canonical game-registration contract (documented in docs/launcher.md, style-guide §9.2).
 *
 * Every @arcadivision/* game package MUST expose from its package root:
 *   export const title: string    — lowercase slug shown in menus
 *   export const Mount: () => JSX.Element — the full playable game component,
 *       self-contained (mounts its own GameShell, owns its boot/menu screens)
 *
 * Games not yet playable are registered here as stubs (no Mount) — they appear
 * in the menu disabled and slot in the moment their package exports Mount.
 */
import type { ComponentType } from "react";
import * as pong from "@arcadivision/pong";
import * as connectFour from "@arcadivision/connect-four";
import * as snake from "@arcadivision/snake";
import * as gemMatch from "@arcadivision/gem-match-clone";
import * as runner from "@arcadivision/runner-clone";
import * as asteroids from "@arcadivision/asteroids";
import * as frogger from "@arcadivision/frogger-clone";
import * as tetris from "@arcadivision/tetris-clone";
import * as minesweeper from "@arcadivision/minesweeper";
import * as solitaire from "@arcadivision/solitaire";
import * as bubblePop from "@arcadivision/bubble-pop";
import * as flappy from "@arcadivision/flappy-bird-clone";

export interface GameEntry {
  readonly id: string;
  readonly label: string;
  readonly Mount: ComponentType | null; // null = stub, not yet playable
}

interface GameModule {
  readonly title?: string;
  readonly Mount?: ComponentType;
}

function entry(mod: GameModule, fallbackLabel: string): GameEntry {
  return {
    id: mod.title ?? fallbackLabel.toLowerCase().replace(/\s+/g, "-"),
    label: fallbackLabel,
    Mount: mod.Mount ?? null,
  };
}

export const GAMES: readonly GameEntry[] = [
  entry(pong, "PONG"),
  entry(snake, "SNAKE"),
  entry(asteroids, "ASTEROIDS"),
  entry(connectFour, "CONNECT FOUR"),
  entry(gemMatch, "GEM MATCH"),
  entry(runner, "RUNNER"),
  entry(frogger, "FROGGER"),
  entry(tetris, "TETRIS"),
  entry(minesweeper, "MINESWEEPER"),
  entry(solitaire, "SOLITAIRE"),
  entry(bubblePop, "BUBBLE POP"),
  entry(flappy, "FLAPPY BIRD"),
  // Category B — stubs (awaiting human design pass, spec §6)
  { id: "shooter-suite", label: "SHOOTER SUITE", Mount: null },
  { id: "chess", label: "CHESS", Mount: null },
  { id: "maze-chase-clone", label: "MAZE CHASE", Mount: null },
  { id: "bomber-clone", label: "BOMBER", Mount: null },
];

export const PLAYABLE = GAMES.filter((g) => g.Mount !== null).length;
export const TOTAL = GAMES.length;
