// Presentational Connect Four board renderer (shell tokens only, no raw hexes).
import { COLORS } from "@arcadivision/shell";
import type { GameState, Cell } from "../game/game";
import { COLS, ROWS } from "../game/game";

function discColor(cell: Cell): string {
  if (cell === 1) return COLORS.text; // P1 green
  if (cell === 2) return COLORS.emphasis; // P2 amber
  return "transparent";
}

export function Board({ game, onDrop }: { game: GameState; onDrop: (col: number) => void }) {
  const cell = 46;
  const gap = 6;
  const pad = 14;
  const width = COLS * (cell + gap) + gap + pad * 2;
  const height = ROWS * (cell + gap) + gap + pad * 2;

  const disc = (col: number, row: number) => {
    const x = pad + gap + col * (cell + gap);
    const y = pad + gap + row * (cell + gap);
    return (
      <circle key={`${col}-${row}`} cx={x + cell / 2} cy={y + cell / 2} r={cell / 2 - 3}
        fill={discColor(game.board[col][row])} stroke={COLORS.dim} strokeWidth={1.5} />
    );
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ background: COLORS.bg, border: `1px solid ${COLORS.dim}` }}>
      {/* empty sockets */}
      {Array.from({ length: COLS }, (_, c) =>
        Array.from({ length: ROWS }, (_, r) => disc(c, r)))}
      {/* column click targets */}
      {Array.from({ length: COLS }, (_, c) => (
        <rect key={`hit-${c}`} x={pad + c * (cell + gap)} y={0} width={cell + gap}
          height={height} fill="transparent"
          onMouseDown={() => { if (game.mode === "playing") onDrop(c); }} />
      ))}
    </svg>
  );
}
