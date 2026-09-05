# Snake — Game Spec (Arcadivision MicroGames)

**Intended location:** `MicroGames/packages/snake/SPEC.md`
**Category:** A* (self-contained build, but see quirks below — this doc exists specifically so the AI builder doesn't guess on the parts that diverge from vanilla Snake)

---

## 1. Menu flow

On launch (after the shared Shell boot screen hands off):

```
Snake — Main Menu
  1 Player
  2 Player
  High Score
  Exit  → returns to Shell / game-selection screen
```

Selecting 1P or 2P leads into a **pre-game options screen** (see Section 4) before the match actually starts.

---

## 2. Controls

- **1 Player:** Arrow keys *or* WASD (either works, player's choice, no need to pick at menu)
- **2 Player:** simultaneous input — Player 1 = Arrow keys, Player 2 = WASD (fixed assignment, not user-chosen, to avoid input conflicts)

---

## 3. Player color assignment

Each match, both players are assigned a color **randomly**, but not fully randomly — colors must be chosen so that:
- The two player colors are visually distinguishable from each other
- Both player colors are visually distinguishable from the food/apple color

**Approach:** assign each color a random **hue** on the HSL color wheel, with fixed saturation/lightness for consistency, but enforce a **minimum angular separation** between all three hues in play (Player 1, Player 2, food) — e.g. no two of the three may be within some threshold (a starting point like 60–90° apart is reasonable; exact value is a tuning decision, not a design blocker). This guarantees no "is that my snake or the food" moments regardless of which random hues get rolled.

*(Open item: exact degree threshold and saturation/lightness constants — tunable during implementation, doesn't need to block building.)*

---

## 4. Pre-game options

Before a match starts, the player(s) choose:
- **Number of lives** per player (default suggestion: 3, but should be a selectable value)
- **Number of food items** simultaneously on the board (default suggestion: 1, but selectable — more food = faster-paced/higher-risk board)

---

## 5. Collision rules

- A snake dies when **its own head** collides with: a wall, its own body, the other snake's body, or the other snake's head.
- Collision is evaluated **per-snake, based on whose head hit what** — it is not symmetric. Example: if Snake A's head runs into Snake B's body, **Snake A dies; Snake B is unaffected** and keeps playing normally.
- **Head-to-head collision (both heads enter the same cell simultaneously)** — open item, needs a confirmed ruling before build. Reasonable default: both players die simultaneously (mutual KO, resulting in a Draw if it's their last life) — flag this default to William for confirmation, don't assume silently.

### Lives
- On death, if the player has lives remaining, they **respawn** (respawn behavior — fresh short snake at a safe start position — is the sane default; confirm if a different respawn behavior is wanted).
- On death with zero lives remaining, that player is **eliminated** for the rest of the match.

---

## 6. Death animation

On death, the snake's body **explodes segment-by-segment, starting from the head and proceeding toward the tail**, rather than simply vanishing instantly. While this animation plays out:
- The not-yet-exploded remaining segments **still count as solid obstacles** for the other player for that short duration — i.e. death isn't instant cleanup, it leaves a brief hazard behind.
- Once the explosion sequence finishes, the cells clear normally.

---

## 7. Win condition & end-of-match

- **2 Player:** last player with lives remaining wins. Match ends with an on-screen **"[Player] Wins!"** announcement. If both players are simultaneously eliminated (see head-to-head open item above), result is a **Draw**.
- **1 Player:** game ends when the player has zero lives remaining. Final score is shown and compared against the stored high score.

---

## 8. Open items (flagged, not yet decided — do not silently assume)

- Head-to-head simultaneous collision: mutual death (default assumption above) vs. some other resolution — **needs William's confirmation**
- Respawn behavior on losing a life: fresh short snake vs. some other reset rule — **needs confirmation**
- High score scope: 1P mode only, or does 2P track a "best individual score" too — **needs confirmation**
- Exact hue-separation threshold / saturation-lightness values for color assignment — tunable, non-blocking
- Board size / whether it differs between 1P and 2P — not yet specified

---

*This spec exists because Snake, unlike Pong or Asteroids, has real design decisions baked into it (dual-mode, asymmetric collision, animated death-as-obstacle). Everything in Sections 1–7 is confirmed; Section 8 items should be resolved before or during build, not assumed.*
