// React state management + AI turn for Connect Four.
import { useEffect, useReducer, useRef } from "react";
import { SeededRng } from "@arcadivision/shell";
import {
  createGame,
  startMatch,
  dropDisc,
  checkWin,
  boardFull,
  chooseAiMove,
  advanceTurn,
  type GameState,
  type RngLike,
} from "../game/game";

type Action =
  | { type: "start"; versusAi: boolean; difficulty: "easy" | "hard" }
  | { type: "drop"; col: number }
  | { type: "menu" };

function reducer(game: GameState, action: Action): GameState {
  switch (action.type) {
    case "start": {
      const g = createGame({ isVersusAi: action.versusAi, difficulty: action.difficulty });
      startMatch(g, action.versusAi, action.difficulty);
      return g;
    }
    case "drop": {
      if (game.mode !== "playing") return game;
      const g = { ...game, board: game.board.map((col) => col.slice()) };
      const row = dropDisc(g, action.col);
      if (row === -1) return game;
      if (checkWin(g, action.col, row, g.current)) {
        g.winner = g.current;
        g.mode = "gameover";
      } else if (boardFull(g)) {
        g.mode = "gameover";
      } else {
        advanceTurn(g);
      }
      return g;
    }
    case "menu":
      return createGame({ isVersusAi: true });
    default:
      return game;
  }
}

export interface ConnectFourController {
  game: GameState;
  seed: string;
  start: (versusAi: boolean, difficulty: "easy" | "hard") => void;
  drop: (col: number) => void;
  toMenu: () => void;
  /** returns true if the AI moved */
  aiMove: () => void;
}

export function useConnectFour(): ConnectFourController {
  const seedRef = useRef<string>((Date.now() & 0x7fffffff).toString(36));
  const rngRef = useRef<RngLike | null>(null);
  if (rngRef.current === null) {
    const instance = new SeededRng(seedRef.current);
    rngRef.current = instance;
  }
  const rng = rngRef.current;

  const [game, dispatch] = useReducer(reducer, undefined, () =>
    createGame({ isVersusAi: true }),
  );

  return {
    game,
    seed: seedRef.current,
    start: (versusAi, difficulty) => dispatch({ type: "start", versusAi, difficulty }),
    drop: (col) => dispatch({ type: "drop", col }),
    toMenu: () => dispatch({ type: "menu" }),
    aiMove: () => {
      if (game.isVersusAi && game.mode === "playing" && game.current === 2) {
        dispatch({ type: "drop", col: chooseAiMove(game, rng) });
      }
    },
  };
}

/** Fire the AI's move shortly after it becomes the AI's turn. */
export function useAiTurn(c: ConnectFourController): void {
  const { game } = c;
  useEffect(() => {
    if (game.isVersusAi && game.mode === "playing" && game.current === 2) {
      const t = window.setTimeout(() => c.aiMove(), 500);
      return () => window.clearTimeout(t);
    }
  }, [game.isVersusAi, game.mode, game.current]); // eslint-disable-line react-hooks/exhaustive-deps
}
