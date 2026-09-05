// Composition root for Bubble Pop: one persistent Shell SeededRng injected into pure logic.
import { useRef, useState } from "react";
import { SeededRng } from "@arcadivision/shell";
import {
  createGame,
  startGame,
  shoot,
  type GameState,
  type RngLike,
} from "../game/game";

export interface BubblePopController {
  game: GameState;
  aim: number;
  lastPopped: number;
  setAim: (col: number) => void;
  start: () => void;
  fire: () => void;
}

export function useBubblePop(): BubblePopController {
  const rngRef = useRef<RngLike | null>(null);
  if (rngRef.current === null) {
    const instance = new SeededRng((Date.now() & 0x7fffffff) >>> 0);
    rngRef.current = instance;
  }
  const rng = rngRef.current!;

  const [game, setGame] = useState<GameState>(() => createGame());
  const [aim, setAim] = useState<number>(4);
  const [lastPopped, setLastPopped] = useState<number>(0);

  return {
    game,
    aim,
    lastPopped,
    setAim: (c) => setAim(Math.max(0, Math.min(8, c))),
    start: () => {
      const g = createGame();
      startGame(g, rng);
      setGame(g);
      setLastPopped(0);
    },
    fire: () => {
      if (game.phase !== "playing") return;
      const g = { ...game, grid: game.grid.map((row) => row.slice()) };
      const res = shoot(g, aim);
      setGame(g);
      setLastPopped(res.popped);
    },
  };
}
