// Canvas presentation layer for Frogger. Renders GameState with shell tokens.
import { COLORS, ALPHA, FONT } from "@arcadivision/shell";
import { GRID_WIDTH, GRID_ROWS, type GameState, type Mover } from "../game";

const CELL = 40; // px per cell
export const CANVAS_W = GRID_WIDTH * CELL;
export const CANVAS_H = GRID_ROWS * CELL;

function rowToY(row: number): number {
  // row 0 (start) is bottom of screen
  return (GRID_ROWS - 1 - row) * CELL;
}

function drawMover(ctx: CanvasRenderingContext2D, m: Mover): void {
  const y = rowToY(m.laneRow);
  const w = m.length * CELL;
  if (m.type === "car") {
    ctx.fillStyle = COLORS.emphasis;
    ctx.fillRect(m.x * CELL, y + 6, w, CELL - 12);
  } else if (m.type === "truck") {
    ctx.fillStyle = COLORS.hostile;
    ctx.fillRect(m.x * CELL, y + 4, w, CELL - 8);
  } else if (m.type === "log") {
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(m.x * CELL, y + 10, w, CELL - 20);
  } else if (m.type === "turtle") {
    ctx.fillStyle = m.submerged ? ALPHA.deemphasis : COLORS.text;
    ctx.fillRect(m.x * CELL, y + 12, w, CELL - 24);
  }
}

function drawLaneColor(ctx: CanvasRenderingContext2D, kind: string, row: number): void {
  const y = rowToY(row);
  if (kind === "road") {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, y, CANVAS_W, CELL);
    // lane divider
    ctx.fillStyle = ALPHA.gridHairline;
    ctx.fillRect(0, y + CELL - 1, CANVAS_W, 1);
  } else if (kind === "water") {
    ctx.fillStyle = ALPHA.gridHairline;
    ctx.fillRect(0, y, CANVAS_W, CELL);
  } else if (kind === "goal") {
    ctx.fillStyle = COLORS.dim;
    ctx.fillRect(0, y, CANVAS_W, CELL);
  } else if (kind === "median") {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, y, CANVAS_W, CELL);
  } else {
    // start
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, y, CANVAS_W, CELL);
  }
}

function drawFrog(ctx: CanvasRenderingContext2D, g: GameState): void {
  const x = g.frog.x * CELL;
  const y = rowToY(g.frog.y);
  ctx.fillStyle = COLORS.emphasis;
  ctx.fillRect(x + 6, y + 6, CELL - 12, CELL - 12);
}

export function drawGame(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (const lane of g.lanes) {
    drawLaneColor(ctx, lane.kind, lane.row);
  }
  for (const m of g.movers) {
    drawMover(ctx, m);
  }
  drawFrog(ctx, g);

  // HUD
  ctx.fillStyle = COLORS.text;
  ctx.font = `14px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`SCORE ${g.score}`, 8, 8);
  ctx.fillText(`LIVES ${g.lives}`, 8, 24);
  ctx.textAlign = "right";
  ctx.fillText(`LVL ${g.level}`, CANVAS_W - 8, 8);
}

export function drawOverlay(ctx: CanvasRenderingContext2D, g: GameState): void {
  if (g.phase === "dead") {
    ctx.fillStyle = ALPHA.deemphasis;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.hostile;
    ctx.font = `20px ${FONT}`;
    ctx.fillText("SPLAT", CANVAS_W / 2, CANVAS_H / 2);
  } else if (g.phase === "gameover") {
    ctx.fillStyle = ALPHA.deemphasis;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.hostile;
    ctx.font = `24px ${FONT}`;
    ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H * 0.4);
    ctx.fillStyle = COLORS.text;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`SCORE ${g.score}`, CANVAS_W / 2, CANVAS_H * 0.52);
  }
}
