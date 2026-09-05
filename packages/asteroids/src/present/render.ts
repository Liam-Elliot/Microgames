// Canvas presentation layer for Asteroids. Renders GameState using @arcadivision/shell tokens.
// No game logic here — pure drawing from state (style-guide §0/§9: presentational split).
import { COLORS, ALPHA, FONT } from "@arcadivision/shell";
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  type GameState,
} from "../game";

function drawShip(ctx: CanvasRenderingContext2D, g: GameState): void {
  const { pos, angle, invulnerableTicks } = g.ship;
  // blink when invulnerable
  if (invulnerableTicks > 0 && Math.floor(invulnerableTicks / 4) % 2 === 0) return;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAsteroids(ctx: CanvasRenderingContext2D, g: GameState): void {
  for (const a of g.asteroids) {
    const r = 48 - (3 - a.size) * 16;
    ctx.save();
    ctx.translate(a.pos.x, a.pos.y);
    ctx.rotate(a.angle);
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < a.vertices.length; i++) {
      const v = a.vertices[i];
      const x = v.x * r;
      const y = v.y * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.fillStyle = COLORS.emphasis;
  for (const b of g.bullets) {
    ctx.fillRect(b.pos.x - 1, b.pos.y - 1, 2, 2);
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, g: GameState): void {
  for (const p of g.particles) {
    const alpha = p.lifeTicks / p.maxLife;
    ctx.fillStyle = ALPHA.phantom;
    ctx.globalAlpha = alpha;
    ctx.fillRect(p.pos.x - 1, p.pos.y - 1, 2, 2);
  }
  ctx.globalAlpha = 1;
}

export function drawGame(ctx: CanvasRenderingContext2D, g: GameState): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  drawAsteroids(ctx, g);
  drawParticles(ctx, g);
  drawBullets(ctx, g);
  drawShip(ctx, g);

  // HUD
  ctx.fillStyle = COLORS.text;
  ctx.font = `14px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`SCORE ${g.score}`, 8, 8);
  ctx.fillText(`LIVES ${g.lives}`, 8, 24);
  ctx.textAlign = "right";
  ctx.fillText(`LVL ${g.level}`, WORLD_WIDTH - 8, 8);
}

export function drawOverlay(ctx: CanvasRenderingContext2D, g: GameState): void {
  if (g.phase === "attract") {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.font = `28px ${FONT}`;
    ctx.fillText("A S T E R O I D S", WORLD_WIDTH / 2, WORLD_HEIGHT * 0.3);
    ctx.fillStyle = COLORS.emphasis;
    ctx.font = `14px ${FONT}`;
    ctx.fillText("SPACE to start", WORLD_WIDTH / 2, WORLD_HEIGHT * 0.5);
    ctx.fillStyle = COLORS.dim;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(
      "arrows / A D rotate  •  W / UP thrust  •  SPACE fire",
      WORLD_WIDTH / 2,
      WORLD_HEIGHT * 0.62,
    );
  } else if (g.phase === "gameover") {
    ctx.fillStyle = ALPHA.deemphasis;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.hostile;
    ctx.font = `24px ${FONT}`;
    ctx.fillText("GAME OVER", WORLD_WIDTH / 2, WORLD_HEIGHT * 0.4);
    ctx.fillStyle = COLORS.text;
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`SCORE ${g.score}`, WORLD_WIDTH / 2, WORLD_HEIGHT * 0.52);
    ctx.fillStyle = COLORS.emphasis;
    ctx.fillText("SPACE to restart", WORLD_WIDTH / 2, WORLD_HEIGHT * 0.62);
  }
}
