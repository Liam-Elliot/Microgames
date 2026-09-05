import { useRef } from "react";
import { COLORS, FONT, ALPHA, SPACE } from "@arcadivision/shell";
import { MINE } from "./game/game";
import { useMinesweeper } from "./hooks/useMinesweeper";

// Classic Minesweeper uses distinct colors per count; the phosphor palette keeps
// numbers green (COLORS.text) with amber for mines and red for the exploded mine.
// No raw hexes — all from @arcadivision/shell tokens (style-guide §1).

export function App(): JSX.Element {
  const seedRef = useRef<number>((Date.now() & 0x7fffffff) >>> 0);
  const { game, onReveal, onFlag, onChord } = useMinesweeper(seedRef.current);

  const width = game.width;

  const statusText =
    game.phase === "won"
      ? "WIN"
      : game.phase === "lost"
        ? "LOSE"
        : `FLAGS ${game.flagsRemaining}`;

  const statusColor =
    game.phase === "won"
      ? COLORS.text
      : game.phase === "lost"
        ? COLORS.hostile
        : COLORS.emphasis;

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.md,
        fontFamily: FONT,
        color: COLORS.text,
      }}
    >
      <div style={{ fontVariant: "small-caps", letterSpacing: 3, fontSize: 20 }}>
        minesweeper
      </div>
      <div style={{ color: statusColor, fontSize: 14, fontVariant: "small-caps" }}>
        {statusText}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${width}, 24px)`,
          gap: 1,
          border: `1px solid ${COLORS.dim}`,
          padding: SPACE.xs,
        }}
      >
        {game.cells.map((cell, i) => {
          const x = i % width;
          const y = Math.floor(i / width);
          const revealed = cell.revealed;
          const isMine = cell.value === MINE;
          let label = "";
          let bg: string = COLORS.bg;
          let fg: string = COLORS.text;

          if (revealed) {
            bg = ALPHA.deemphasis;
            if (cell.exploded) {
              bg = COLORS.hostile;
              label = "*";
            } else if (isMine) {
              label = "*";
              fg = COLORS.emphasis;
            } else if (cell.value > 0) {
              label = String(cell.value);
              fg = COLORS.text;
            }
          } else if (cell.flagged) {
            label = "F";
            fg = COLORS.emphasis;
          }

          return (
            <button
              key={i}
              onClick={() =>
                revealed ? onChord(x, y) : onReveal(x, y)
              }
              onContextMenu={(e) => {
                e.preventDefault();
                onFlag(x, y);
              }}
              style={{
                width: 24,
                height: 24,
                background: bg,
                border: revealed ? `1px solid ${ALPHA.gridHairline}` : `1px solid ${COLORS.dim}`,
                color: fg,
                fontFamily: FONT,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {revealed && !cell.exploded ? (
                <span style={{ color: fg }}>{label}</span>
              ) : revealed ? (
                <span style={{ color: fg }}>{label}</span>
              ) : cell.flagged ? (
                <span style={{ color: fg }}>{label}</span>
              ) : (
                ""
              )}
            </button>
          );
        })}
      </div>
      <div style={{ color: COLORS.dim, fontSize: 12 }}>
        click reveal&nbsp;&nbsp;|&nbsp;&nbsp;right-click flag&nbsp;&nbsp;|&nbsp;&nbsp;click revealed number to chord
      </div>
    </div>
  );
}
