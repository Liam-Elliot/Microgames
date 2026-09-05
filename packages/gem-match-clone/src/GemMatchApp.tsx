import { useCallback, useEffect, useState } from "react";
import {
  COLORS,
  FONT,
  GameShell,
  ScoreBar,
  SeededRng,
  SelectionGrid,
  SPACE,
  Z,
} from "@arcadivision/shell";
import { anyLegalMove, newBoard, playMove, SIZE, type Board } from "./engine";
import { gemCss, specialGlyph } from "./gems";

type Screen = "menu" | "game";

const HI_KEY = "arcadivision.gemmatch.highscore";
const CELL_PX = 40;

const readHi = (): number => {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(HI_KEY) : null;
  return v ? parseInt(v, 10) || 0 : 0;
};

export const GemMatchApp = (): JSX.Element => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [board, setBoard] = useState<Board | null>(null);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [invalid, setInvalid] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(readHi);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState("");

  const rng = new SeededRng(Date.now() >>> 0);

  const start = useCallback((): void => {
    setBoard(newBoard(new SeededRng(Date.now() >>> 0)));
    setScore(0);
    setMoves(0);
    setSelected(null);
    setStatus("the board is set. match three.");
    setScreen("game");
  }, []);

  const exit = useCallback((): void => {
    if (score > highScore) {
      localStorage.setItem(HI_KEY, String(score));
      setHighScore(score);
    }
    setScreen("menu");
  }, [score, highScore]);

  // keyboard: Esc = exit (with hi-score save), R = reshuffle guard is automatic
  useEffect(() => {
    if (screen !== "game") return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" || e.code === "KeyQ") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, exit]);

  const click = (r: number, c: number): void => {
    if (!board) return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    const adjacent = Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1;
    if (!adjacent) {
      setSelected({ r, c });
      return;
    }
    const { board: next, result } = playMove(board, selected.r, selected.c, r, c, rng);
    setSelected(null);
    if (!result.legal) {
      // snap back: brief invalid flash, no penalty (spec §3)
      setInvalid({ r, c });
      setTimeout(() => setInvalid(null), 200);
      setStatus("no match there. try again.");
      return;
    }
    setBoard(next);
    setMoves((m) => m + 1);
    setScore((s) => {
      const ns = s + result.totalPoints;
      return ns;
    });
    const chain = result.steps.length;
    setStatus(
      chain > 1
        ? `chain ×${chain} — ${result.totalPoints} points.`
        : `${result.totalPoints} points.`,
    );
  };

  return (
    <GameShell title="gem match" style={{ position: "fixed" }}>
      {screen === "menu" && (
        <Center>
          <SelectionGrid
            title="gem match"
            options={[
              { id: "play", label: "PLAY" },
              { id: "hi", label: `HIGH SCORE: ${highScore}` },
              { id: "exit", label: "EXIT" },
            ]}
            onConfirm={(id) => {
              if (id === "play") start();
              else if (id === "exit") window.history.back();
            }}
          />
          <Hint>click a gem, then an adjacent gem, to swap</Hint>
        </Center>
      )}

      {screen === "game" && board && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: SPACE.sm }}>
          <ScoreBar
            entries={[
              { label: "score", value: score },
              { label: "hi", value: highScore, emphasized: true },
              { label: "moves", value: moves },
            ]}
          />
          <div
            data-gemmatch="board"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${SIZE}, ${CELL_PX}px)`,
              gridAutoRows: `${CELL_PX}px`,
              border: `1px solid ${COLORS.dim}`,
              background: COLORS.bg,
            }}
          >
            {board.flatMap((row, r) =>
              row.map((cellObj, c) => {
                const sel = selected?.r === r && selected?.c === c;
                const bad = invalid?.r === r && invalid?.c === c;
                const { color, glyph } = gemCss(cellObj);
                const sp = specialGlyph(cellObj.special);
                return (
                  <div
                    key={`${r},${c}`}
                    onClick={() => click(r, c)}
                    style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONT,
                      fontSize: 22,
                      color: bad ? COLORS.hostile : color,
                      border: `1px solid ${sel ? COLORS.emphasis : "rgba(51,255,102,0.08)"}`,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    title={cellObj.special ?? ""}
                  >
                    {sp ?? glyph}
                  </div>
                );
              }),
            )}
          </div>
          <Hint>{status} · [esc] exit</Hint>
          {board && !anyLegalMove(board) && <Hint color={COLORS.emphasis}>reshuffling…</Hint>}
        </div>
      )}
    </GameShell>
  );
};

const Center = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: SPACE.md, fontFamily: FONT, color: COLORS.text, zIndex: Z.panel }}>
    {children}
  </div>
);

const Hint = ({ children, color }: { children: React.ReactNode; color?: string }): JSX.Element => (
  <div style={{ color: color ?? COLORS.dim, fontSize: 14 }}>{children}</div>
);
