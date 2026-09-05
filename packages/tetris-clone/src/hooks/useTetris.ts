// React canvas mount + fixed-timestep game loop for Tetris.
import { useEffect, useRef } from "react";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  update,
  moveLeft,
  moveRight,
  moveDown,
  rotateCW,
  rotateCCW,
  hardDrop,
  holdPiece,
  type GameState,
} from "../game/game";
import { drawGame, drawOverlay } from "../present/render";

const FIXED_STEP_MS = 1000 / 60;

export function useTetris(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
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
    let repeatTick = 0;

    const loop = (now: number): void => {
      const dt = Math.min(now - last, 100);
      last = now;
      accumulator += dt;
      while (accumulator >= FIXED_STEP_MS) {
        update(game);
        // soft repeat for held down keys
        repeatTick++;
        if (repeatTick % 3 === 0) applyRepeats();
        accumulator -= FIXED_STEP_MS;
      }
      drawGame(ctx, game);
      drawOverlay(ctx, game);
      raf = requestAnimationFrame(loop);
    };

    const repeats = { left: false, right: false, down: false };
    function applyRepeats(): void {
      if (repeats.left) moveLeft(game);
      if (repeats.right) moveRight(game);
      if (repeats.down) moveDown(game);
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowLeft") { e.preventDefault(); moveLeft(game); repeats.left = true; }
      else if (k === "ArrowRight") { e.preventDefault(); moveRight(game); repeats.right = true; }
      else if (k === "ArrowDown") { e.preventDefault(); moveDown(game); repeats.down = true; }
      else if (k === "ArrowUp" || k === "x" || k === "X") { e.preventDefault(); rotateCW(game); }
      else if (k === "z" || k === "Z") rotateCCW(game);
      else if (k === " ") { e.preventDefault(); hardDrop(game); }
      else if (k === "c" || k === "C" || k === "Shift") holdPiece(game);
      else if (k === "p" || k === "P") { /* pause not in logic; no-op */ }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowLeft") repeats.left = false;
      if (k === "ArrowRight") repeats.right = false;
      if (k === "ArrowDown") repeats.down = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [canvasRef]);

  return gameRef;
}
