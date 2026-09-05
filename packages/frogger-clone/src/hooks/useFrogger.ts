// React canvas mount + fixed-timestep game loop for Frogger.
import { useEffect, useRef } from "react";
import { seededRng } from "@arcadivision/shell";
import { createGame, update, hop, type GameState } from "../game/game";
import { drawGame, drawOverlay } from "../present/render";

const FIXED_STEP_MS = 1000 / 60;

export function useFrogger(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const seed = (Date.now() & 0x7fffffff) >>> 0;
    const rng = seededRng(seed);
    const game = createGame(rng, {});
    gameRef.current = game;

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const loop = (now: number): void => {
      const dt = Math.min(now - last, 100);
      last = now;
      accumulator += dt;
      while (accumulator >= FIXED_STEP_MS) {
        update(game);
        accumulator -= FIXED_STEP_MS;
      }
      drawGame(ctx, game);
      drawOverlay(ctx, game);
      raf = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") { e.preventDefault(); hop(game, 0, 1); }
      else if (k === "ArrowDown" || k === "s" || k === "S") { e.preventDefault(); hop(game, 0, -1); }
      else if (k === "ArrowLeft" || k === "a" || k === "A") hop(game, -1, 0);
      else if (k === "ArrowRight" || k === "d" || k === "D") hop(game, 1, 0);
    };

    window.addEventListener("keydown", onKeyDown);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canvasRef]);

  return gameRef;
}
