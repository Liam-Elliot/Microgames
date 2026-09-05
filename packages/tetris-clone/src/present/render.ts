// Canvas presentation layer for Tetris. Renders GameState with shell tokens.
import { COLORS, ALPHA, FONT } from "@arcadivision/shell";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  ghostY,
  pieceCells,
  type GameState,
  type PieceType,
} from "../game";

const CELL = 28;
export const CANVAS_W = BOARD_WIDTH * CELL + 160; // board + next/hold panel
export const CANVAS_H = BOARD_HEIGHT * CELL;

const PIECE_GLYPH: Record<PieceType, string> = {
  I: "I", O: "O", T: "T", S: "S", Z: "Z", J: "J", L: "L",
};

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, type: PieceType): void {
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
  ctx.fillStyle = COLORS.bg;
  ctx.font = `${CELL - 8}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(PIECE_GLYPH[type], x * CELL + CELL / 2, y * CELL + CELL / 2 + 1);
}

export function drawGame(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // board border
  ctx.strokeStyle = COLORS.dim;
  ctx.strokeRect(0, 0, BOARD_WIDTH * CELL, BOARD_HEIGHT * CELL);

  // locked cells
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const cell = g.board[y][x];
      if (cell) drawBlock(ctx, x, y, cell);
    }
  }

  // ghost + active piece
  if (g.phase === "playing") {
    const gy = ghostY(g);
    const cells = pieceCells(g.current);
    for (const [x, y] of cells) {
      const gyy = y + (gy - g.current.y);
      if (gyy >= 0 && gyy < BOARD_HEIGHT) {
        ctx.fillStyle = ALPHA.phantom;
        ctx.fillRect(x * CELL + 1, gyy * CELL + 1, CELL - 2, CELL - 2);
      }
    }
    for (const [x, y] of cells) {
      if (y >= 0 && y < BOARD_HEIGHT) drawBlock(ctx, x, y, g.current.type);
    }
  }

  // HUD
  ctx.fillStyle = COLORS.text;
  ctx.font = `14px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const hx = BOARD_WIDTH * CELL + 8;
  ctx.fillText(`SCORE ${g.score}`, hx, 8);
  ctx.fillText(`LINES ${g.lines}`, hx, 26);
  ctx.fillText(`LVL ${g.level}`, hx, 44);
  ctx.fillText(`NEXT`, hx, 70);
  if (g.nextQueue[0]) ctx.fillText(PIECE_GLYPH[g.nextQueue[0]], hx, 88);
  ctx.fillText(`HOLD`, hx, 140);
  if (g.hold) ctx.fillText(PIECE_GLYPH[g.hold], hx, 158);
}

export function drawOverlay(ctx: CanvasRenderingContext2D, g: GameState): void {
  if (g.phase === "gameover") {
    ctx.fillStyle = ALPHA.deemphasis;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.hostile;
    ctx.font = `24px ${FONT}`;
    ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H * 0.45);
    ctx.fillStyle = COLORS.text;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`SCORE ${g.score}`, CANVAS_W / 2, CANVAS_H * 0.55);
  }
}
