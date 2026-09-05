import { COLORS, FONT } from "@arcadivision/shell";
import { useEffect } from "react";
import { useBubblePop } from "./hooks/useBubblePop";
import { Board } from "./present/Board";

export function App(): JSX.Element {
  const c = useBubblePop();
  const { game } = c;

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const k = e.key;
      if (k >= "1" && k <= "9") c.setAim(Number(k) - 1);
      else if (k === "Enter" || k === " " || k === "Spacebar") {
        if (game.phase === "menu" || game.phase === "over") c.start();
        else c.fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: FONT }}>
      {(game.phase === "menu" || game.phase === "over") ? (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 26, color: COLORS.text, margin: "0 0 8px" }}>BUBBLE POP</h1>
          <p style={{ color: COLORS.dim, fontSize: 14, margin: "4px 0" }}>
            {game.phase === "over" ? (
              <>GAME OVER — score {game.score}</>
            ) : (
              <>shoot 3+ matching bubbles to pop them</>
            )}
          </p>
          <button onClick={c.start} style={btnStyle}>
            {game.phase === "over" ? "PLAY AGAIN" : "START"}
          </button>
          <p style={{ color: COLORS.dim, fontSize: 12, marginTop: 12 }}>or press ENTER</p>
        </div>
      ) : (
        <>
          <Board game={game} aim={c.aim} onAim={c.setAim} onShoot={c.fire} />
          {c.lastPopped >= 3 && (
            <div style={{ color: COLORS.emphasis, fontSize: 14 }}>POP {c.lastPopped}</div>
          )}
        </>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 15, background: COLORS.text, color: COLORS.onHighlight,
  border: `1px solid ${COLORS.text}`, padding: "8px 20px", cursor: "pointer",
};
