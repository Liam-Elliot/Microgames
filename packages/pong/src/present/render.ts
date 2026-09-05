// Canvas presentation layer for Pong. Renders GameState using @arcadivision/shell tokens.
import { COLORS, ALPHA, FONT } from "@arcadivision/shell";
import type { GameState } from "../game/pong";

const PADDLE_W = 12;

function drawCenterLine(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = ALPHA.gridHairline;
  const dash = 10;
  const gap = 14;
  for (let y = 0; y < h; y += dash + gap) {
    ctx.fillRect(w / 2 - 1, y, 2, dash);
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x, y, PADDLE_W, h);
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x, y, s, s);
}

export function drawGame(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, g.boardW, g.boardH);

  drawCenterLine(ctx, g.boardW, g.boardH);

  drawPaddle(ctx, 0, g.left.y, g.paddleHeight);
  drawPaddle(ctx, g.boardW - PADDLE_W, g.right.y, g.paddleHeight);
  drawBall(ctx, g.ball.x, g.ball.y, g.ballSize);

  ctx.fillStyle = COLORS.text;
  ctx.font = `16px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(String(g.scoreLeft), g.boardW * 0.25, 16);
  ctx.fillText(String(g.scoreRight), g.boardW * 0.75, 16);

  if (g.paused) {
    ctx.fillStyle = COLORS.text;
    ctx.font = `16px ${FONT}`;
    ctx.fillText("PAUSED", g.boardW / 2, g.boardH / 2 - 40);
  }
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  seed: string,
): void {
  const { boardW, boardH } = g;
  if (g.mode === "menu") {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, boardW, boardH);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.font = `28px ${FONT}`;
    ctx.fillText("P O N G", boardW / 2, boardH * 0.3);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = COLORS.emphasis;
    ctx.fillText("1 - 2P LOCAL", boardW / 2, boardH * 0.48);
    ctx.fillText("2 - VS AI", boardW / 2, boardH * 0.55);
    ctx.fillStyle = COLORS.dim;
    ctx.fillText("first to 11 wins", boardW / 2, boardH * 0.7);
    ctx.fillText(`seed ${seed}`, boardW / 2, boardH * 0.78);
  } else if (g.mode === "serving") {
    ctx.fillStyle = COLORS.text;
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("SPACE to serve", boardW / 2, boardH * 0.45);
  } else if (g.mode === "gameover") {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, boardW, boardH);
    const leftWon = g.scoreLeft >= g.winScore;
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.emphasis;
    ctx.font = `24px ${FONT}`;
    ctx.fillText(leftWon ? "LEFT WINS" : "RIGHT WINS", boardW / 2, boardH * 0.4);
    ctx.fillStyle = COLORS.text;
    ctx.font = `14px ${FONT}`;
    ctx.fillText("R - rematch", boardW / 2, boardH * 0.55);
    ctx.fillText("ESC - menu", boardW / 2, boardH * 0.62);
  }
}
