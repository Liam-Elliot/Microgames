// React hook wrapping the decoupled Minesweeper game logic.
import { useCallback, useRef, useState } from "react";
import { seededRng } from "@arcadivision/shell";
import { createGame, reveal, toggleFlag, chord, type GameState } from "../game/game";

export function useMinesweeper(seedSeed: number) {
  const rngRef = useRef<ReturnType<typeof seededRng> | null>(null);
  if (rngRef.current === null) {
    rngRef.current = seededRng(seedSeed);
  }
  const gameRef = useRef<GameState | null>(null);
  if (gameRef.current === null) {
    gameRef.current = createGame(rngRef.current, { difficulty: "beginner" });
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