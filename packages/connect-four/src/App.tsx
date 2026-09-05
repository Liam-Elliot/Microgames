import { COLORS, FONT } from "@arcadivision/shell";
import { useConnectFour, useAiTurn } from "./hooks/useConnectFour";
import { Board } from "./present/Board";

function Menu() {
  return (
    <div style={{ textAlign: "center", fontFamily: FONT, color: COLORS.text }}>
      <h1 style={{ fontSize: 28, color: COLORS.text, margin: "0 0 24px" }}>CONNECT FOUR</h1>
      <p style={{ color: COLORS.dim, fontSize: 14, margin: "0 0 16px" }}>first to 4 in a row</p>
      <p style={{ color: COLORS.emphasis, fontSize: 14, margin: "4px 0" }}>
        1 - 2P LOCAL&nbsp;&nbsp;|&nbsp;&nbsp;2 - VS AI (EASY)&nbsp;&nbsp;|&nbsp;&nbsp;3 - VS AI (HARD)
      </p>
      <p style={{ color: COLORS.dim, fontSize: 13, marginTop: 24 }}>keys 1/2/3 or click</p>
    </div>
  );
}

function HUD({ game }: { game: ReturnType<typeof useConnectFour>["game"] }) {
  const turnLabel =
    game.mode === "gameover"
      ? game.winner
        ? game.winner === 1 ? "GREEN WINS" : "AMBER WINS"
        : "DRAW"
      : game.current === 1 ? "GREEN TO MOVE" : "AMBER TO MOVE";
  const color =
    game.mode === "gameover" && game.winner === 2
      ? COLORS.emphasis
      : game.mode === "gameover" && game.winner === 1
        ? COLORS.text
        : COLORS.dim;
  return (
    <div style={{ fontFamily: FONT, fontSize: 15, color, marginBottom: 8 }}>
      {turnLabel}
      {game.isVersusAi && game.mode === "playing" && game.current === 2 && "  (AI thinking)"}
    </div>
  );
}

export function App(): JSX.Element {
  const c = useConnectFour();
  useAiTurn(c);
  const { game } = c;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONT }}>
      {game.mode === "menu" ? (
        <>
          <Menu />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => c.start(false, "easy")} style={btn}>2P LOCAL</button>
            <button onClick={() => c.start(true, "easy")} style={btn}>VS AI EASY</button>
            <button onClick={() => c.start(true, "hard")} style={btn}>VS AI HARD</button>
          </div>
        </>
      ) : (
        <>
          <HUD game={game} />
          <Board game={game} onDrop={(col) => c.drop(col)} />
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => c.start(game.isVersusAi, game.difficulty)} style={btn}>REMATH</button>
            <button onClick={c.toMenu} style={btn}>MENU</button>
          </div>
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  background: COLORS.text,
  color: COLORS.onHighlight,
  border: `1px solid ${COLORS.text}`,
  padding: "6px 12px",
  cursor: "pointer",
};
