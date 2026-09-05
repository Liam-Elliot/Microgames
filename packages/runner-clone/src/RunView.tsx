import { COLORS, FONT } from "@arcadivision/shell";
import type { CellKind, Row } from "./engine";

const GLYPHS: Record<CellKind, string> = {
  empty: " ",
  low: "▄",
  overhead: "▀",
  gap: "·",
  full: "█",
  coin: "●",
  magnet: "◈",
  shield: "▣",
  multiplier: "×",
};

const KIND_COLOR: Record<CellKind, string> = {
  empty: COLORS.text,
  low: COLORS.hostile,
  overhead: COLORS.hostile,
  gap: COLORS.dim,
  full: COLORS.hostile,
  coin: COLORS.emphasis,
  magnet: COLORS.emphasis,
  shield: COLORS.emphasis,
  multiplier: COLORS.emphasis,
};

export const PLAYER_GLYFF = "@";

export const RunView = ({
  rows, playerRow, playerLane, airborne, sliding, shield,
}: {
  rows: readonly Row[];
  playerRow: number;
  playerLane: number;
  airborne: boolean;
  sliding: boolean;
  shield: boolean;
}): JSX.Element => (
  <div
    data-runner="view"
    style={{
      fontFamily: FONT,
      fontSize: 20,
      lineHeight: "20px",
      letterSpacing: 6,
      background: COLORS.bg,
      padding: "8px 16px",
      border: `1px solid ${COLORS.dim}`,
      whiteSpace: "pre",
      textAlign: "left",
    }}
  >
    {rows.map((row, r) => {
      const isPlayerRow = r === playerRow;
      const cells = row
        .map((k, lane) => {
          if (isPlayerRow && lane === playerLane) {
            const glyph = airborne ? "^" : sliding ? "_" : "@";
            return <span key={lane} style={{ color: shield ? COLORS.emphasis : COLORS.text }}>{glyph}</span>;
          }
          return (
            <span key={lane} style={{ color: KIND_COLOR[k] }}>
              {GLYPHS[k]}
            </span>
          );
        })
        .reduce<JSX.Element[]>((acc, el) => [...acc, el], []);
      return (
        <div key={r} style={{ display: "flex", gap: 16 }}>
          {cells}
        </div>
      );
    })}
  </div>
);
