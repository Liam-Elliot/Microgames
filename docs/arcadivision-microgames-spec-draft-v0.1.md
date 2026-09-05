# Arcadivision — MicroGames Specification (Draft v0.1)

**Status:** Structural outline only. No implementation detail, no code, no per-game mechanics spec yet. This document exists to lock down *what exists* and *how it's organized* before any build work — including agent-swarm code generation — begins.

---

## 1. Scope of this document

This spec covers **only** two repositories:

- `Shell` — shared boot/splash screen and UI chrome, published/consumed as `@arcadivision/shell`
- `MicroGames` — the collection of small, self-contained arcade-style games that import Shell

Everything else in the wider Arcadivision/Git folder tree (HeroesAndAdventure, Pokémon-clone, Metal Slug clone, the public website, etc.) is **explicitly out of scope** here, with one exception noted in Section 4 (theming reference only).

---

## 2. Repository structure

Two standalone git repositories, siblings on disk, each with its own lifecycle and version history:

```
D:\Projects\Git\Arcadivision\
  Shell\                     ← own repo — package: @arcadivision/shell
  MicroGames\                ← own repo — imports Shell as a dependency
  HeroesAndAdventure\        ← own repo — OUT OF SCOPE (existing)
```

**Shell** is decoupled from MicroGames deliberately, because it is intended to be importable by other, currently-out-of-scope projects (e.g. HeroesAndAdventure, future titles) later. It is not nested inside MicroGames.

**Dependency wiring (interim):** MicroGames will consume Shell via a git dependency or local `file:` path during active development (`npm link` / local linking acceptable while co-developing). Promotion to a private registry is a future concern, not a v0.1 requirement.

### 2.1 MicroGames internal layout (structural only — no code yet)

```
MicroGames\
  packages\
    pong\
    snake\
    tetris-clone\
    shooter-suite\        ← combined Space Invaders / Galaga / Missile Command, level-based
    asteroids\
    flappy-bird-clone\
    minesweeper\
    solitaire\
    connect-four\
    maze-chase-clone\     ← Pac-Man mechanic, rebranded name/assets
    bubble-pop\
    bomber-clone\         ← Bomberman mechanic, rebranded name/assets
    gem-match-clone\      ← Bejeweled mechanic, rebranded name/assets
    runner-clone\         ← Subway Surfers mechanic, rebranded name/assets
    frogger-clone\
    chess\                ← see Section 5 — separate agent team, same repo
```

Naming above is placeholder/working-title only; final public-facing names TBD in a later spec pass (Section 6, open items).

---

## 3. Project list (confirmed for MicroGames)

| # | Working title | Notes |
|---|---|---|
| 1 | Pong | Original mechanic, no rename needed |
| 2 | Snake | Original mechanic, no rename needed |
| 3 | Tetris-clone | Rename/reskin required (Tetris is tightly trademarked/licensed) |
| 4 | Shooter Suite | Combines Space Invaders, Galaga, Missile Command mechanics as sequential levels/stages within one game shell; rename/reskin required for all three source IPs |
| 5 | Asteroids | Original mechanic, no rename needed |
| 6 | Flappy Bird clone | Low trademark risk given genre saturation; still worth a distinct name for brand consistency |
| 7 | Minesweeper | Generic/public-domain-adjacent |
| 8 | Solitaire | Generic/public-domain-adjacent |
| 9 | Connect Four | Generic mechanic; Connect Four name itself is a Hasbro trademark — confirm before public use |
| 10 | Maze-chase clone (Pac-Man) | Rename/reskin required |
| 11 | Bubble Pop | Generic mechanic, low risk |
| 12 | Bomber clone (Bomberman) | Rename/reskin required |
| 13 | Gem-match clone (Bejeweled) | Rename/reskin required; match-3 mechanic itself is generic |
| 14 | Runner clone (Subway Surfers) | Rename/reskin required; endless-runner mechanic itself is generic |
| 15 | Frogger clone | Rename/reskin required |
| 16 | Chess | See Section 5 — separate agent team |

---

## 4. Reference note: HeroesAndAdventure's existing shell

HeroesAndAdventure already has its own boot/splash and UI shell, built specifically and only for that game. It is **not** to be reused, imported, or refactored as part of this work — it is out of scope structurally.

However, its visual/theming approach is a useful **reference point** for whoever (human or agent) designs the Arcadivision MicroGames shell's look — tone, layout conventions, how it handles the logo/boot sequence. Agents working on `@arcadivision/shell` should be pointed at it for inspiration/consistency-checking, not for code reuse.

---

## 5. Chess — special handling note

Chess is included in the MicroGames product lineup (same repo, same shell, same launcher/UI from the player's point of view) because from a *user-facing* perspective it belongs in the same "suite of small games" as everything else.

However, internally:

- Chess is expected to require materially more implementation complexity than the rest of the suite (legal move generation, check/checkmate detection, potentially an AI opponent).
- It will be assigned to its **own specialized agent team**, separate from the team(s) handling the simpler arcade titles.
- This is a *process/org* distinction only — it does not change where chess lives in the repo or folder structure. It stays inside `MicroGames\packages\chess\` like everything else.

Full chess scope (does it need an AI opponent, difficulty levels, multiplayer, move history/notation, etc.) is **not yet defined** and is an open item — see Section 6.

---

## 6. Build categorization — human design pass required vs. AI can build solo

Splitting the roster by how much design ambiguity exists *before* build, not by difficulty of implementation. Category B items need a human decision pass (a short spec doc, at minimum) before being handed to the agent swarm; Category A items are unambiguous enough that agents can be set loose with minimal oversight.

**Category A — self-contained, minimal oversight needed**
- Pong
- Asteroids
- Minesweeper
- Solitaire
- Connect Four
- Bubble Pop
- Flappy Bird clone
- Frogger clone
- Tetris-clone *(rules are fixed; only open question is the reskinned visual style, which is an art task not a design-ambiguity task)*
- Snake\* — *see per-game spec: `MicroGames/packages/snake/SPEC.md`. Rules are otherwise simple, but the 1P/2P mode, dual controls, asymmetric collision, and death-animation-as-obstacle quirks are specific enough to warrant a dedicated doc rather than leaving them to agent judgment.*
- Gem-match clone (Bejeweled mechanic)\* — *see per-game spec: `MicroGames/packages/gem-match/SPEC.md`. Fully decision-locked (grid size, special-gem rules, cascade scoring, deadlock/reshuffle handling) — no open items, safe for solo AI build.*
- Runner clone (Subway Surfers mechanic)\* — *see per-game spec: `MicroGames/packages/runner/SPEC.md`. Fully decision-locked (3-lane layout, obstacle types, chunk-based procedural generation, power-ups, scoring) — treated as a fast first-pass prototype; William reviews the built result and drives any further iteration from there rather than pre-designing further now.*

**Category B — needs a human design pass first**
- Shooter Suite *(level/stage mapping across three source mechanics)*
- Chess *(separate specialized agent team — see Section 5)*
- Maze-chase clone (Pac-Man mechanic) *(enemy/ghost AI behavior, level layout)*
- Bomber clone (Bomberman mechanic) *(map/level design, enemy behavior, power-up balance)*

Per-game spec docs (like Snake's) should be added to this section's list as they're written, with the same asterisk convention pointing to their file.

---

## 7. Open items — not yet decided (deliberately deferred)

These are known gaps, called out explicitly so they aren't mistaken for decisions:

- Final public-facing names/branding for every rename-required game (Section 3)
- Shell's actual component/API surface (what it exposes: boot screen, transitions, pause menu, score display, theming tokens, etc.)
- Tech stack specifics beyond "React/Vue, modern design" (framework choice, styling approach, state management, build tooling)
- Chess scope: AI opponent or not, difficulty levels, move notation/history, multiplayer
- Shooter Suite's exact level progression and how control schemes differ (or don't) between its three source mechanics
- Whether any of these games need persistent state (high scores, save/resume) and if so, where that lives (shared shell service vs. per-game)
- Trademark-name clearance details are noted here as *known concerns*, not legal advice — worth an actual check before public launch, not before internal dev

None of the above blocks starting on folder scaffolding and repo setup. They *do* need answers before handing detailed per-game build instructions to an agent swarm.

---

*End of Draft v0.1 — structural outline only.*
