# MicroGames — Master Style Guide

> **Status:** v1.0 (canonical). Framework-agnostic. Modelled on the **HeroesAndAdventure** visual/design system (Agile Abyss / H&A team), per spec draft §4 — the H&A look is the *reference point* for consistency, **not** reused code. Ratified by team lead (Obsidian Prophet) 2026-09-05.
>
> **Scope:** Every MicroGame (`@arcadivision/*`) and the shared `@arcadivision/shell` UI chrome must follow this guide so the whole suite reads as one product made by one person.
>
> Two layers, both mandatory:
> 1. **Visual/art layer** — what it looks like
> 2. **Code/naming conventions** — how it's written (uniformity is code too)

---

## 0. Governing principles

1. **One source of truth for tokens.** No raw hexes/values scattered in components. A single palette/token module (per Shell) feeds every game.
2. **Green is the default; everything else is semantic.** Amber is *state/emphasis only*, never decoration. Red/dark-green are *hostile/disadvantage* only. Grey is *de-emphasis* only.
3. **Mechanical, not organic.** Linear motion, no organic easing, no gradients/shadows, no rounded corners. Respect reduced-motion.
4. **Uniform voice across the suite.** Terse, consistent register (see §8 Tone).
5. **Deterministic.** No `Math.random` in game logic — seeded RNG only. Reproducible.

---

## 1. Palette (single token module — source of truth)

| Token | Value | Usage |
|---|---|---|
| `bg` | `#000000` | Background |
| `text` / primary | `#33ff66` | Phosphor green — default for everything |
| `dim` / secondary green | `#2a5c33` | Dimmed/secondary |
| `emphasis` | `#ffb000` | Amber — important values, selected borders, focus, newest items |
| `emphasisDim` | `#7a5500` | Dimmed amber |
| `hostile` | `#ff5252` | Enemy/hostile (red) |
| `disadvantage` | `#1d7a3a` | Dark green — disadvantage |
| `highlightBg` / `selection` | `#33ff66` | Selection highlight background |
| `onHighlight` | `#000000` | Text color on selection highlight |
| `deemphasis` | 75% opacity of `#33ff66` | Log history, de-emphasized content (opacity of text green — **not a new hue**) |

**Rules**
- Default: green everywhere.
- Amber **only** for emphasis/state — never as decoration.
- Red / dark-green: semantic roll/combat tones only.
- Grey = 75%-opacity green, never a distinct grey hue.

**Transparency — always alpha of green, never new hues**
- Grid hairlines / faint fill: `rgba(51,255,102, 0.08)`.
- De-emphasized log history: green at 75% opacity.
- Preview / phantom fills: `rgba(51,255,102, 0.45)`.

*(Source: H&A `src/ui/palette.ts`.)*

---

## 2. Typography

- Face: `"Courier New", Courier, monospace` — **everywhere**, no exceptions. No sans/display fonts.
- Body: ~14–16px.
- Emphasis by **color**, never by weight or font change.
- Small-caps treatment (ability/special names in H&A) applies here to **game titles, score headers, and high-score name entry** — so all games render their title & HUD identically. Proper Case in plain text.

---

## 3. UI components & chrome

- **No bespoke buttons.** Use one uniform **grid/pager** component:
  - First enabled option is default-highlighted (green bg + black text).
  - Confirm: arrows/Enter. Also: number keys, typed-name matching.
- **Panels:** plain bordered rectangles, 1–2px solid green; amber border when selected/focused. No fill/gradient inside.
- **Banners:** amber-filled block **only** for state-change events; routine bookkeeping stays plain green.
- **Boot/splash & transitions** (Shell responsibility): follow the same green-on-black phosphor treatment as everything else.
- **Selection highlight:** uses the first-class `highlightBg` token (`#33ff66`) + `onHighlight` black text (see §1).

---

## 4. Spacing & layout

- Dense rhythm: **4 / 8 / 16 px**.
- Two-column layouts for data sheets; content max-width ~**460px** for prompts.
- No rounded corners, no shadows, no gradients — except `repeating-linear-gradient` hairlines for grid textures.
- **z-index scale** (define once; do NOT inherit H&A's ad-hoc 35-40): `0` base → `10` panels → `20` overlays → `30` modals.

---

## 5. Art style

- Predominantly **text**. Where art exists: **pixel-art sprite sheets** (PNG/webp) + decorative portraits — presentation layer only.
- Nothing isometric, nothing vector.
- Grids/maps rendered with **Unicode box-drawing** + letters in green/amber, not images.

---

## 6. Animation & motion

- Typewriter text reveal: `TYPE_MS = 14` per-char cadence; Enter skips to full text; reduced-motion bypasses the animation entirely.
- Dice tumble: random faces ~every 80ms, settle ~650ms, staggered per die.
- **Reduced-motion media query MUST be respected** — skip straight to settled/final state.
- Easing: none / linear — mechanical, not organic.

---

## 7. Sound

- None in v1. Nothing to inherit.
- **Future convention reserved:** if/when audio is added (several games — Pong, Flappy, Frogger, Bubble Pop — will likely want SFX), a single shared sound convention applies to all games, and any audio-theme values hook into the same token module so it doesn't fork per game later.

---

## 8. Tone & register (the exportable core)

Terse, wry, second-person flavour. The register carries across every game title regardless of art.

- **Two layers of prose, kept separate:**
  - *Mechanics without flavour words* (score, status, rules read plainly).
  - *Flavour without numbers* (the terse second-person texture).
- Examples (register to mirror, adapted per game): *"You wake in the dark. Your purse is gone."*
- Keep the same voice when a game has its own world; tone stays uniform product-wide.

---

## 9. Code / naming conventions

- **Language:** TypeScript.
- **Functions:** `const` arrow functions.
- **Types:** `type`, not `interface`.
- **CSS:** scoped with `@scope` blocks.
- **Tokens:** single palette/token module as source of truth — no raw hexes in components.
- **Determinism:** no `Math.random` in game logic; **seeded RNG only**; IDs are counters.
- **Components:** presentational; data filtering done by callers, not inside presentational components.
- **Tokens live in Shell, NOT per-game.** Every game imports `COLORS`/`ALPHA`/`FONT`/`SeededRng` from `@arcadivision/shell` (source of truth). No per-game `palette.ts` or `colors.ts` fork.

### 9.1 Canonical game package scaffold (React 18 + Vite + TS + Vitest)

Every `@arcadivision/*` game follows this exact layout — no divergence.

```
packages/<game>/
  index.html          → <div id="root"> + <script src="/src/main.tsx">, no inline styles
  vite.config.ts      → vitest/config + @vitejs/plugin-react + test{jsdom} + server.port
  tsconfig.json       → extends ../../tsconfig.base.json, jsx react-jsx, noEmit, types ["vitest/globals"], include [src, tests, vite.config.ts]
  package.json        → scripts: dev/build/preview/typecheck/test; deps react, react-dom, @arcadivision/shell; devDeps types/react, plugin-react, typescript, vite, vitest, jsdom
  src/main.tsx        → createRoot render <App/>
  src/App.tsx         → top-level component, wires game logic to present
  src/game/*.ts       → PURE game logic: state + update + input handlers; zero React/DOM/hex; injected SeededRng
  src/present/*.tsx   → canvas/SVG renderers, import COLORS/FONT/SPACE from @arcadivision/shell
  src/hooks/*.ts      → composition root: one persistent SeededRng, reducer/game loop
  tests/*.test.ts     → vitest (engine logic; presentational optional)
```

- Entry file is **`main.tsx`** (not `dev.tsx`). Vite config **must** include `@vitejs/plugin-react`.
- One unique `server.port` per game (pong 5173, connect-four 5174, …).
- Game logic accepts an **injected RNG** (`RngLike` = `{ next(); int(); pick() }`) — never constructs its own `Math.random` or `new SeededRng()` internally.
- **Testing is mandatory (owner rule):** every game's engine logic must have vitest coverage in `tests/*.test.ts` — core mechanics, state transitions, win/lose/collision/scoring. A game is not "done" until `vitest run` passes and `tsc --noEmit` is clean. Deterministic tests use a fixed-seed or mock RNG.

---

## 10. Conformance

- Every `@arcadivision/*` game and `@arcadivision/shell` imports the shared token module; any raw style value is a violation.
- **ESLint enforcement (highest-leverage guard):** ban literal hex/color values outside the palette/token module. This single rule is the highest-value control for keeping 15 games uniform.
- Canonical (team-lead ratified). Per-game deviations require a decision note in that package's `docs/`.

---

*Source canon: HeroesAndAdventure design system (relayed via Agile Abyss). Adaptations for arcade context noted inline. Canonical (ratified by Obsidian Prophet 2026-09-05). Maintenance: if H&A `src/ui/palette.ts` changes, update §1 here so the two repos don't drift.*
