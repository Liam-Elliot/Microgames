# Runner Clone — Game Spec (Arcadivision MicroGames)

**Intended location:** `MicroGames/packages/runner/SPEC.md`
**Category:** A — every design decision below is final. No open items. Build as written. (Intended as a fast first-pass prototype — William will review the built result and drive any follow-up iteration from there, rather than pre-designing further now.)

---

## 1. Menu flow

```
Runner — Main Menu
  Play
  High Score
  Exit  → returns to Shell / game-selection screen
```

No pre-game options screen — straight into the run on selecting Play.

---

## 2. Track layout

- **3 lanes**, viewed from a behind-the-character third-person perspective (classic endless-runner framing), scrolling toward the camera endlessly.
- Character runs automatically at all times — the player never controls forward speed directly, only lane position and jump/duck.
- Camera/world scroll speed increases gradually over the course of a run (see Section 6, Difficulty scaling).

---

## 3. Controls

- **Left / A** — move one lane left
- **Right / D** — move one lane right
- **Up / W** — jump (clears low obstacles and gaps)
- **Down / S** — slide/duck (clears overhead/high obstacles)

Lane changes are instant-snap between the 3 fixed lanes (no free-roam horizontal movement) — keeps input simple and matches genre convention.

---

## 4. Obstacles

Fixed set of obstacle types, each requiring a specific player response:

| Obstacle | Player must | Notes |
|---|---|---|
| Low barrier | Jump | Blocks one lane at running height |
| Overhead barrier | Duck/slide | Blocks one lane at head height, passable low |
| Gap/pit | Jump | Missing floor section, must jump across |
| Full-width barrier (train-style) | Change lanes | Blocks the entire lane permanently — cannot be jumped or ducked, must be avoided by lane switch before reaching it |

A collision with any obstacle (failing to jump/duck/switch appropriately) ends the run — see Section 8.

---

## 5. Procedural generation

- The track is built from a pool of **pre-defined segment chunks** (each chunk is a fixed short stretch of track with a specific obstacle arrangement across the 3 lanes), rather than fully random per-tile generation. This keeps every obstacle arrangement guaranteed fair (no impossible combinations) while still feeling varied.
- Chunks are selected **randomly from the pool** as the player progresses, with the constraint that the same chunk cannot repeat twice in a row (avoids obvious pattern repetition).
- New chunks generate ahead of the player and old chunks behind the player are discarded/recycled, keeping the world effectively infinite.
- Starting pool: minimum 10 distinct chunk layouts is sufficient for a first-pass prototype; more can be added later without any structural change.

---

## 6. Difficulty scaling

- Base scroll/run speed starts at a fixed value and **increases gradually with distance traveled** (a steady speed ramp, not sudden jumps) — the run gets harder the longer it goes, standard genre convention.
- Obstacle chunk frequency/density does not need to separately scale for v1 — speed increase alone provides sufficient difficulty ramp for a first prototype.

---

## 7. Collectibles & power-ups

- **Coins:** scattered within lanes (including in patterns that reward correct jump/duck/lane timing), collected automatically on contact, add to score.
- **Power-ups** (rare spawn, same pickup-on-contact behavior as coins):
  - **Magnet** — auto-collects all coins within a radius for a short duration
  - **Shield** — absorbs exactly one obstacle collision (consumed, then gone) instead of ending the run
  - **Score Multiplier** — doubles points earned for a short duration
- Only one power-up effect active at a time for v1 (simplest to reason about and build); if the player picks up a new one while another is active, the new one simply replaces the old.

---

## 8. Game over & scoring

- **Single life** for v1 — any unshielded obstacle collision ends the run immediately (Shield power-up is the only exception, per Section 7).
- **Score** = distance traveled (continuously accumulating) + coin values collected, with the Score Multiplier power-up applying while active.
- On run end: show final score and distance, compare against and update stored high score if beaten, then return to menu (not an automatic restart).

---

## 9. Visual/UX notes

- Since "Subway Surfers" itself is the trademarked title being referenced, the runner character, setting/environment art, and any UI iconography should be original to Arcadivision rather than reusing the source's specific character designs or setting — the *mechanic* (3-lane dodge-and-collect endless runner) is genre-standard and not itself protected.
- Score and current distance display persist on-screen during the run, consistent with other MicroGames titles.

---

*This spec is complete and decision-locked for a first-pass prototype — no items are deferred to the build team's judgment. William will review the finished prototype directly and drive any further iteration (additional obstacle types, power-ups, tuning) from that point, rather than this doc being revised further in advance.*
