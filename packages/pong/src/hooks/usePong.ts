// React canvas mount + game loop for Pong.
import { useEffect, useRef } from "react";
import { SeededRng } from "@arcadivision/shell";
import {
  createGame,
  update,
  startMatch,
  togglePause,
  serveStart,
  type GameState,
  type Input,
  type Rng,
} from "../game/pong";
import { drawGame, drawOverlay } from "../present/render";

export function usePong(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const gameRef = useRef<GameState | null>(null);
  const seedRef = useRef<string>((Date.now() & 0x7fffffff).toString(36)); // bootstrap entropy only (not gameplay RNG)
  // One persistent seeded RNG instance; `next` is injected into pure game logic.
  const rngRef = useRef<Rng>(null as unknown as Rng);
  if (rngRef.current === null) {
    const instance = new SeededRng(seedRef.current);
    rngRef.current = () => instance.next();
  }
  const inputRef = useRef<Input>({ leftUp: false, leftDown: false, rightUp: false, rightDown: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!gameRef.current) {
      gameRef.current = createGame({ isVersusAi: false, rng: rngRef.current });
    }
    const game = gameRef.current;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      update(game, inputRef.current, dt, rngRef.current);
      ctx.imageSmoothingEnabled = false;
      drawGame(ctx, game);
      drawOverlay(ctx, game, seedRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") inputRef.current.leftUp = e.type === "keydown";
      if (k === "ArrowDown" || k === "s" || k === "S") inputRef.current.leftDown = e.type === "keydown";
      if (k === "p" || k === "P") if (e.type === "keydown") togglePause(game);

      if (e.type === "keydown") {
        if (game.mode === "menu") {
          if (k === "1") startMatch(game, false, rngRef.current);
          else if (k === "2") startMatch(game, true, rngRef.current);
        } else if (game.mode === "serving" && k === " ") {
          serveStart(game);
        } else if (game.mode === "gameover") {
          if (k === "r" || k === "R") startMatch(game, game.isVersusAi, rngRef.current);
          else if (k === "Escape") game.mode = "menu";
        } else if (k === "Escape") {
          game.mode = "menu";
        }
      }
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [canvasRef]);

  return { seed: seedRef.current };
}
