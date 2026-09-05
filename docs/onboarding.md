# MicroGames — Onboarding Guide

Welcome aboard. This guide is the entry point for any agent/human joining the Arcadivision MicroGames swarm.

## What this is

A **npm workspaces monorepo** of small, self-contained arcade-style games. Each game imports the shared `@arcadivision/shell` (boot/splash + UI chrome) from the sibling `Shell/` repo.

**Current state:** Structural scaffolding (spec draft v0.1). Skeleton only — folder structure, package manifests, READMEs, placeholder source. **No playable code yet.**

## Two sibling repos

| Repo | Package | Role |
|---|---|---|
| `D:\Projects\Git\Arcadivision\Microgames` | monorepo root | The 16-game suite |
| `D:\Projects\Git\Arcadivision\Shell` | `@arcadivision/shell` | Shared UI chrome |

Both are independent git repos (branch `main`), newly initialized.

## Layout

```
Microgames\
  arcadivision-microgames-spec-draft-v0.1.md   ← source of truth (READ FIRST)
  docs\onboarding.md                           ← this file
  package.json / tsconfig.base.json
  packages\
    pong\  snake\  asteroids\  minesweeper\  solitaire\
    bubble-pop\  connect-four\
    tetris-clone\  shooter-suite\  flappy-bird-clone\
    maze-chase-clone\  bomber-clone\  gem-match-clone\
    runner-clone\  frogger-clone\
    chess\  ← separate agent team; content deferred (spec §5)
```

Each `packages/<game>` contains:

- `package.json` — `@arcadivision/<game>`, deps `@arcadivision/shell` via `file:../../../Shell`
- `tsconfig.json` — extends `../../tsconfig.base.json`
- `src/index.ts` — placeholder stub
- `README.md` — mechanic + IP/rename notes
- `docs/` — reserved for per-game decisions

## Rename / IP status (from spec §3)

- **No rename:** Pong, Snake, Asteroids, Minesweeper, Solitaire, Bubble Pop
- **Rename/reskin required:** Tetris-clone, Shooter Suite, Maze-chase (Pac-Man), Bomber (Bomberman), Gem-match (Bejeweled), Runner (Subway Surfers), Frogger
- **Confirm before public use:** Connect Four (Hasbro name), Flappy Bird clone (low risk, still distinct name)

## Open items — do NOT invent (spec §6)

These are deliberately undecided. Flag them, don't resolve unilaterally:

- Final public-facing names for all rename-required games
- Shell API/component surface (boot, transitions, pause, score, theming tokens)
- Tech stack: framework (React/Vue), styling, state, build tooling
- Chess scope (AI? difficulty? multiplayer? notation?)
- Shooter Suite level progression + control-scheme differences
- Persistent state (high scores, save/resume) and where it lives

## Stack baseline (provisional)

Chosen to make the scaffold usable — **not a locked decision** (see open item above):

- Language: TypeScript
- Monorepo: npm workspaces
- Framework/build: **TBD** per game
- Shared UI: `@arcadivision/shell`

## First-time setup

```bash
cd Microgames
npm install
npm run typecheck   # type-check all packages
npm run build       # build all packages
```

> Note: packages depend on `@arcadivision/shell` via a `file:../../../Shell` path. If you only install inside `Microgames`, Shell is consumed from the sibling repo location; coordinate a Shell `npm install` + any needed linking when wiring the real build.

## How to work here

1. Read the spec first — everything traces back to it.
2. Treat rename/IP notes as binding constraints (don't ship trademarked names).
3. Don't resolve spec §6 open items unilaterally — raise them instead.
4. Chess stays in `packages/chess/` but is owned by a **separate specialized team**.
5. Keep the theming look consistent with the HeroesAndAdventure reference (inspiration only — no code reuse).
