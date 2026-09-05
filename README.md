# MicroGames

Collection of small, self-contained arcade-style games for **Arcadivision**, each importing the shared `@arcadivision/shell`.

> **Status:** Structural scaffolding (Draft v0.1). Repo skeleton only — no playable code yet. See [spec](arcadivision-microgames-spec-draft-v0.1.md) and [docs/onboarding.md](docs/onboarding.md).

---

## Repository layout

```
MicroGames\
  arcadivision-microgames-spec-draft-v0.1.md   ← spec source of truth
  docs\                                         ← onboarding & shared decisions
  packages\
    pong\
    snake\
    tetris-clone\
    shooter-suite\
    asteroids\
    flappy-bird-clone\
    minesweeper\
    solitaire\
    connect-four\
    maze-chase-clone\
    bubble-pop\
    bomber-clone\
    gem-match-clone\
    runner-clone\
    frogger-clone\
    chess\            ← separate agent team; deferred (see spec §5)
  package.json        ← npm workspaces monorepo
```

## Workspaces

MicroGames is an **npm workspaces monorepo** (`packages/*`). Each game is its own workspace package and consumes `@arcadivision/shell` as a dependency.

## Tooling

- Monorepo manager: npm workspaces
- Language baseline: TypeScript (package-level `tsconfig`)
- Framework per game: **TBD** (open item — see spec §6)
- Shared UI: `@arcadivision/shell` (see sibling `Shell/` repo)

## Commands

```bash
npm install          # installs all workspaces
npm run typecheck    # type-check all packages
npm run build        # build all packages
```
