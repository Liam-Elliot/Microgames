// Composition root for Flappy Bird: persistent Shell SeededRng + fixed-timestep loop.
import { useEffect, useRef } from "react";
import { SeededRng } from "@arcadivision/shell";
import { createGame, update, flap, startGame, type GameState, type RngLike } from "../game/game";
import { drawGame, drawOverlay } from "../present/render";

const FIXED_STEP_MS = 1000 / 60;

export function useFlappy(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rngRef: { current: RngLike | null } = { current: null };
    const instance = new SeededRng((Date.now() & 0x7fffffff) >>> 0);
    rngRef.current = instance;

    const game = createGame();
    gameRef.current = game;

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const loop = (now: number): void => {
      const dt = Math.min(now - last, 100);
      last = now;
      accumulator += dt;
      while (accumulator >= FIXED_STEP_MS) {
        update(game, FIXED_STEP_MS / 1000, rngRef.current!);
        accumulator -= FIXED_STEP_MS;
      }
      ctx.imageSmoothingEnabled = false;
      drawGame(ctx, game);
      drawOverlay(ctx, game);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === " " || k === "Spacebar" || k === "ArrowUp" || k === "Enter") {
        e.preventDefault();
        if (game.phase === "over") startGame(game);
        else flap(game);
      }
    };
    window.addEventListener("keydown", onKey);

    const onCanvasClick = (): void => {
      if (game.phase === "over") startGame(game);
      else flap(game);
    };
    canvas.addEventListener("mousedown", onCanvasClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("mousedown", onCanvasClick);
    };
  }, [canvasRef]);

  return gameRef;
}
