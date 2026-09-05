# Chess App Structure

## Overview

This document outlines the structure of the Chess app, which includes both Western Chess and Xiangqi (Chinese Chess). The app is built using React and Vue, and it features a modular engine that can be extended to include other variants in the future.

## Architecture

### 1. Unified Minimax AI Engine

The best part about a modular engine is that the AI search algorithm is 100% reusable:

```ts
// Generic Alpha-Beta Search Engine
function minimax(
  game: GameModule,
  state: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; bestMove?: Move }
```

The Minimax algorithm doesn't need to know if it's playing Western Chess, Xiangqi, or a custom variant—it simply queries `game.getLegalMoves(state)` and `game.evaluatePosition(state)`. You only write the AI logic **once**.

### 2. Rule Modules (`game.evaluatePosition` differences)

* **Western Chess:** Material values ($P=1, N=3, B=3, R=5, Q=9, K=\infty$) + Piece-Square Tables (center control, king safety).
* **Xiangqi (Chinese Chess):**
  * **Cannon (Pao):** High early value for screen attacks across the river.
  * **Rook (Ju):** Very high value (~9 points, equivalent to Western Rook/Queen power).
  * **Chariot/Horse/Advisor/Elephant positional rules:** Elephants restricted to their side of the river; Advisors/Generals locked in the 3x3 Palace.

### 3. Flexible UI Component

* **Western Chess:** Render pieces inside the **squares** of an $8 \times 8$ grid.
* **Xiangqi:** Render pieces on the **intersections (vertices)** of a $9 \times 10$ grid, with SVGs for the River (楚河 漢界) and diagonal lines inside the Palaces.

## Implementation Details

### React Components

* **Board Component:** Renders the chess board and handles user interactions.
* **Piece Component:** Represents individual chess pieces.
* **Game Component:** Manages the game state and logic.

### Vue Components

* **Board Component:** Similar to the React Board Component.
* **Piece Component:** Similar to the React Piece Component.
* **Game Component:** Similar to the React Game Component.

## Future Extensions

* **Additional Variants:** The modular engine can be extended to include other variants like Shogi or custom rules.
* **Multiplayer Mode:** Implementing a multiplayer mode using WebSockets or Firebase.
* **Custom Themes:** Adding custom themes and styles for the chess board and pieces.

## Conclusion

Categorizing this as a flexible, modular engine inside **`Arcadivision/Microgames/Chess`** gives you a clean foundation to add even more variants (like Shogi or custom rules) in the future!
