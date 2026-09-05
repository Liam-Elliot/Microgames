// Canvas presentation for Flappy Bird (Shell tokens only).
import { COLORS, FONT } from "@arcadivision/shell";
import type { GameState } from "../game/game";
import { WORLD_W, WORLD_H, BIRD_R, PIPE_W, PIPE_GAP } from "../game/game";

export function drawGame(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // ground
  ctx.fillStyle = COLORS.dim;
  ctx.fillRect(0, g.groundY, WORLD_W, WORLD_H - g.groundY);

  // pipes
  for (const p of g.pipes) {
    const gapTop = p.gapY - PIPE_GAP / 2;
    const gapBottom = p.gapY + PIPE_GAP / 2;
    ctx.fillStyle = COLORS.text;
    // top pipe
    ctx.fillRect(p.x, 0, PIPE_W, gapTop);
    // bottom pipe
    ctx.fillRect(p.x, gapBottom, PIPE_W, WORLD_H - gapBottom);
    ctx.fillStyle = COLORS.emphasis;
    ctx.fillRect(p.x - 3, gapTop - 6, PIPE_W + 6, 6); // lip top
    ctx.fillRect(p.x - 3, gapBottom, PIPE_W + 6, 6); // lip bottom
  }

  // bird
  ctx.fillStyle = COLORS.emphasis;
  ctx.beginPath();
  ctx.arc(g.bird.x, g.bird.y, BIRD_R, 0, Math.PI * 2);
  ctx.fill();

  // HUD score
  ctx.fillStyle = COLORS.text;
  ctx.font = `24px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(String(g.score), WORLD_W / 2, 40);
}

export function drawOverlay(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.textAlign = "center";
  if (g.phase === "ready") {
    ctx.fillStyle = COLORS.text;
    ctx.font = `26px ${FONT}`;
    ctx.fillText("FLAPPY", WORLD_W / 2, WORLD_H * 0.3);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = COLORS.emphasis;
    ctx.fillText("SPACE or tap to flap", WORLD_W / 2, WORLD_H * 0.38);
    ctx.fillStyle = COLORS.dim;
    ctx.fillText("pass pipes to score", WORLD_W / 2, WORLD_H * 0.44);
  } else if (g.phase === "over") {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = COLORS.emphasis;
    ctx.font = `28px ${FONT}`;
    ctx.fillText("GAME OVER", WORLD_W / 2, WORLD_H * 0.4);
    ctx.fillStyle = COLORS.text;
    ctx.font = `20px ${FONT}`;
    ctx.fillText(`score ${g.score}`, WORLD_W / 2, WORLD_H * 0.48);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = COLORS.emphasis;
    ctx.fillText("SPACE to restart", WORLD_W / 2, WORLD_H * 0.58);
  }
}
