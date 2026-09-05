# Gem Match Clone — Game Spec (Arcadivision MicroGames)

**Intended location:** `MicroGames/packages/gem-match/SPEC.md`
**Category:** A — every design decision below is final. No open items. Build as written.

---

## 1. Menu flow

```
Gem Match — Main Menu
  Play
  High Score
  Exit  → returns to Shell / game-selection screen
```

No pre-game options screen — this game has no modes/variants to choose. Selecting Play drops straight into the board.

---

## 2. Board

- **Grid:** 8 columns × 8 rows.
- **Piece types:** 6 distinct gem types, each with a clearly distinct color/icon so they're distinguishable at a glance (avoid two gems with similar-hue colors — same distinguishability principle as Snake's palette rule: pick 6 hues spread evenly around the color wheel).
- **Initial board fill:** randomly populated on game start, with a validity check — reroll any starting layout that has zero possible legal moves or that already contains an unintended match-3+ at spawn (clear and refill those cells before the player's first move).

---

## 3. Core interaction

- Player selects a gem, then selects an **adjacent** gem (up/down/left/right — no diagonals) to swap with it.
- Input method: click/tap the first gem, then click/tap the adjacent target (works for both mouse and touch without needing drag support; drag-to-swap can be added later as a nice-to-have, not required for v1).
- A swap is only committed if it **results in at least one match of 3+** in a row or column. If the swap would not create a match, the two gems visually snap back to their original positions (brief invalid-swap animation, no penalty).

---

## 4. Matching rules

- A match = **3 or more** identical gems adjacent in a straight line (horizontal or vertical). Matches are automatically detected and cleared immediately after any swap.
- **Cascades:** after a match clears, gems above the cleared cells fall down to fill the gap (gravity), new gems spawn in from the top to refill the board, and the board is re-checked for any new matches created by the fall. This repeats automatically until no further matches remain — a single player move can trigger a chain of cascades.
- **Simultaneous matches:** if a single swap creates matches in multiple directions/locations at once, all are cleared together in the same resolution step.

---

## 5. Special gems (created by larger matches)

Standard match-3 genre convention — locking these in as the fixed ruleset:

| Match shape | Result | Effect when later matched/triggered |
|---|---|---|
| 4 in a row (straight line) | **Line-Clear gem** | Clears the entire row (if formed horizontally) or entire column (if formed vertically) it's matched in |
| 5 in a row (straight line) | **Color Bomb** | Clears every gem of one selected color from the board (color chosen: whichever adjacent color it's swapped with when triggered) |
| L-shape or T-shape match (5 gems) | **Radius Bomb** | Clears a 3×3 area centered on its position when matched |

Special gems sit on the board like normal gems until the player matches or swaps them into a triggering position — they don't auto-trigger on creation.

---

## 6. Scoring

- Base points per gem cleared: **10 points**.
- **Cascade multiplier:** each successive cascade step within the same move chain multiplies that step's points (step 1 = ×1, step 2 = ×2, step 3 = ×3, etc.) — rewards big chain reactions.
- Special gem detonations (line-clear, color bomb, radius bomb) award **50 bonus points** on top of the points for gems they clear.
- Score accumulates across the whole session; there is no move limit or timer — this is an **endless mode**, matching classic Bejeweled's core mode rather than a timed "Blitz" variant.

---

## 7. Deadlock handling

- After every board settle (post-cascade), check whether **any legal move exists** (any adjacent swap that would create a match).
- If no legal move exists, **automatically reshuffle** the entire board (redistribute existing gems into new random positions) and re-run the same validity check used at game start, repeating the reshuffle if needed until a playable board results. This happens silently/automatically — no player action or menu required.

---

## 8. End of session

- There is no "game over" state in the traditional sense — endless mode continues indefinitely, board is always kept playable via the deadlock/reshuffle rule above.
- Player can exit at any time via an in-game **Exit** option, returning to the Shell/game-selection screen. On exit, if the current session's score exceeds the stored high score, update the high score.

---

## 9. Visual/UX notes

- Since "Bejeweled" itself is the trademarked title being referenced, this game's gems should use original shapes/iconography (not literal jewel/gem imagery copied from the source) — simple geometric or thematic icons in the 6 chosen colors is sufficient; final art direction can follow whatever visual theme Arcadivision's shell establishes.
- Score and high score display persist on-screen during play (not just at menu), consistent with other MicroGames titles.

---

*This spec is complete and decision-locked — no items are deferred to the build team's judgment. Any deviation during implementation should be treated as a bug against this spec, not a design choice.*
