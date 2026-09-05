// React canvas mount + fixed-timestep game loop for Asteroids.
import { useEffect, useRef } from "react";
import { seededRng } from "@arcadivision/shell";
import {
  createGame,
  update,
  startGame,
  fire,
  setThrust,
  turn,
  type GameState,
} from "../game/game";
import { drawGame, drawOverlay } from "../present/render";

const FIXED_STEP_MS = 1000 / 60; // 60Hz fixed updates

export function useAsteroids(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Seed entropy from boot time only (not gameplay RNG — logic stays seeded/deterministic).
    const seed = (Date.now() & 0x7fffffff) >>> 0;
    const rng = seededRng(seed);
    const game = createGame(rng, {});
    gameRef.current = game;

    const keys = { left: false, right: false, thrust: false, fire: false };

    let raf = 0;
    let last = performance.now();
    let accumulator = 0;

    const loop = (now: number): void => {
      const dt = Math.min(now - last, 100); // clamp big jumps (tab switch)
      last = now;
      accumulator += dt;

      while (accumulator >= FIXED_STEP_MS) {
        step();
        accumulator -= FIXED_STEP_MS;
      }

      ctx.imageSmoothingEnabled = false;
      drawGame(ctx, game);
      drawOverlay(ctx, game);
      raf = requestAnimationFrame(loop);
    };

    function step(): void {
      // apply input
      setThrust(game, keys.thrust);
      if (keys.left) turn(game, -1);
      else if (keys.right) turn(game, 1);
      else turn(game, 0);
      update(game);
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = true;
      if (k === "ArrowRight" || k === "d" || k === "D") keys.right = true;
      if (k === "ArrowUp" || k === "w" || k === "W") keys.thrust = true;
      if (k === " " || k === "Spacebar") {
        e.preventDefault();
        keys.fire = true;
        if (game.phase === "attract" || game.phase === "gameover") {
          startGame(game);
        } else {
          fire(game);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
      if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
      if (k === "ArrowUp" || k === "w" || k === "W") keys.thrust = false;
      if (k === " " || k === "Spacebar") keys.fire = false;
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
