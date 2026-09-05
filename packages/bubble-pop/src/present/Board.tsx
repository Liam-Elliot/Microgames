// Presentational Bubble Pop board renderer (Shell tokens only).
import { COLORS } from "@arcadivision/shell";
import type { GameState } from "../game/game";
import { COLS, ROWS, COLOR_COUNT } from "../game/game";

export function bubbleColor(color: number | null): string {
  if (color === null) return "transparent";
  switch (color % COLOR_COUNT) {
    case 0: return COLORS.text; // green
    case 1: return COLORS.emphasis; // amber
    case 2: return COLORS.hostile; // red
    default: return COLORS.text; // (reuse) — only 3 distinct shell hues needed
  }
}

export function Board({
  game,
  aim,
  onAim,
  onShoot,
}: {
  game: GameState;
  aim: number;
  onAim: (col: number) => void;
  onShoot: () => void;
}) {
  const cell = 40;
  const gap = 3;
  const radius = (cell - gap) / 2 - 2;
  const pad = 16;
  const width = COLS * cell + pad * 2;

  return (
    <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.dim}`, padding: pad, width }}>
      {/* aim indicator */}
      <div style={{ textAlign: "center", height: 40, fontFamily: "inherit" }}>
        <svg width={cell} height={40}>
          <circle
            cx={cell / 2} cy={18} r={radius}
            fill={bubbleColor(game.current)}
            opacity={aim >= 0 ? 1 : 0.3}
          />
        </svg>
      </div>
      {/* board */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={COLS * cell} height={ROWS * cell}>
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const x = c * cell;
              const y = r * cell;
              return (
                <rect key={`${c}-${r}`} x={x} y={y} width={cell} height={cell}
                  fill={bubbleColor(game.grid[r][c])} stroke={COLORS.dim} strokeWidth={0.5} />
              );
            }))}
        </svg>
      </div>
      {/* column select / shoot */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            onClick={() => onAim(c)}
            onDoubleClick={onShoot}
            style={{
              width: cell, height: 34, marginRight: 3, cursor: "pointer",
              background: aim === c ? COLORS.emphasis : COLORS.dim,
              color: aim === c ? COLORS.onHighlight : COLORS.text,
              border: `1px solid ${COLORS.text}`, fontFamily: "inherit", fontSize: 12,
            }}
            title={`aim column ${c + 1}`}
          >
            {c + 1}
          </button>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 8, color: COLORS.dim, fontSize: 13 }}>
        <span style={{ color: COLORS.text }}>SCORE {game.score}</span>
        {"  |  "}
        <span style={{ color: COLORS.emphasis }}>LIVES {game.lives}</span>
        {"  |  "}1-9 aim, ENTER/SPACE shoot
      </div>
    </div>
  );
}
