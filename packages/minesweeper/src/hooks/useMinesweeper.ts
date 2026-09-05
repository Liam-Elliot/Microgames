// React hook wrapping the decoupled Minesweeper game logic.
import { useCallback, useRef, useState } from "react";
import { SeededRng } from "@arcadivision/shell";
import { createGame, reveal, toggleFlag, chord, type GameState, type Rng } from "../game";

export function useMinesweeper(seedSeed: number) {
  const rngRef = useRef<Rng | null>(null);
  if (rngRef.current === null) {
    rngRef.current = new SeededRng(seedSeed);
  }
  const gameRef = useRef<GameState | null>(null);
  if (gameRef.current === null) {
    gameRef.current = createGame({ difficulty: "beginner" }, rngRef.current);
  }
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const onReveal = useCallback((x: number, y: number) => {
    reveal(gameRef.current!, x, y);
    rerender();
  }, [rerender]);

  const onFlag = useCallback((x: number, y: number) => {
    toggleFlag(gameRef.current!, x, y);
    rerender();
  }, [rerender]);

  const onChord = useCallback((x: number, y: number) => {
    chord(gameRef.current!, x, y);
    rerender();
  }, [rerender]);

  return { game: gameRef.current, onReveal, onFlag, onChord };
}