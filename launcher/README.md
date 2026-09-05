# Launcher — unified MicroGames entry

`npm run dev` at the Microgames root (port 5170) boots the full suite:
Shell `BootSplash` → `Launcher` menu (SelectionGrid) → mounts the selected game.
`[esc]` from any game returns to the menu.

## Game registration contract (canonical — style-guide §9.2)

Every `@arcadivision/*` game package exports from its package root (`src/index.ts`, wired via `package.json` `main`):

```ts
export const title: string;              // lowercase slug, used as menu id
export function Mount(): JSX.Element;    // the full playable game component
```

`Mount` must be **self-contained**: it mounts its own `<GameShell>`, owns its
menu/options/boot screens, and needs no props from the launcher.

- The launcher imports each package, reads `title` + `Mount`, and registers it.
- Games without a playable component are registered as **stubs** in
  `launcher/src/registry.ts` (`Mount: null`) — they render as `LABEL (soon)` and
  are filtered out of keyboard selection until their package exports `Mount`.
- Removing a stub = deleting one line in `registry.ts` once the game exports `Mount`.

## Adding a new game

1. In the game package: `export { App as Mount } from "./App"` (+ `export const title`) in `src/index.ts`, and ensure `package.json` has `"main": "src/index.ts"`.
2. In `launcher/src/registry.ts`: add dep + one `entry(mod, "LABEL")` line (or replace its stub line).
3. Registry tests assert uniqueness + ≥1 stub handling automatically.
