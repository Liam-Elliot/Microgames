import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Vec } from "./engine";
import {
  COLORS,
  FONT,
  GameShell,
  Overlay,
  ScoreBar,
  SeededRng,
  SelectionGrid,
  SPACE,
  Z,
} from "@arcadivision/shell";
import { createGame, queueDir, step, type Dir, type GameState } from "./engine";
import { hslCss, rollColors, type Hsl } from "./colors";

type Screen = "menu" | "options" | "game" | "over";

const CELL = 16;
const TICK_MS = 110;

const P1_KEYS: Record<string, Dir> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
};
const P2_KEYS: Record<string, Dir> = {
  KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
};

const HI_KEY = "arcadivision.snake.highscore";

const readHi = (): number => {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(HI_KEY) : null;
  return v ? parseInt(v, 10) || 0 : 0;
};

export const SnakeApp = (): JSX.Element => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [players, setPlayers] = useState<1 | 2>(1);
  const [lives, setLives] = useState(3);
  const [foodCount, setFoodCount] = useState(1);
  const [paused, setPaused] = useState(false);
  const [highScore, setHighScore] = useState(readHi);

  const [game, setGame] = useState<GameState | null>(null);
  const [colors, setColors] = useState<{ p1: Hsl; p2: Hsl; food: Hsl } | null>(null);
  const rngRef = useRef(new SeededRng(Date.now() >>> 0));

  const start = useCallback((p: 1 | 2): void => {
    setPlayers(p);
    setScreen("options");
  }, []);

  const beginMatch = useCallback((): void => {
    rngRef.current = new SeededRng(Date.now() >>> 0);
    setColors(rollColors(rngRef.current));
    setGame(createGame({ width: 24, height: 24, playerCount: players, foodCount }, lives));
    setPaused(false);
    setScreen("game");
  }, [players, foodCount, lives]);

  // main loop
  useEffect(() => {
    if (screen !== "game" || !game || paused) return;
    const t = setInterval(() => {
      setGame((g) => {
        if (!g || g.phase !== "playing") return g;
        const cloned = g.snakes.map((s) => ({ ...s, body: [...s.body] as Vec[] }));
        const next = { ...g, snakes: cloned as unknown as typeof g.snakes, food: [...g.food] as Vec[] };
        return step(next, rngRef.current);
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [screen, game === null, paused, game?.phase]);

  // phase transition + 1P high score
  useEffect(() => {
    if (game?.phase === "over" && screen === "game") {
      if (players === 1 && game.snakes[0].score > highScore) {
        localStorage.setItem(HI_KEY, String(game.snakes[0].score));
        setHighScore(game.snakes[0].score);
      }
      setScreen("over");
    }
  }, [game?.phase, screen, players, game, highScore]);

  // input
  useEffect(() => {
    if (screen !== "game" || paused) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.code === "KeyP" || e.code === "Escape") {
        setPaused((p) => !p);
        return;
      }
      const d1 = P1_KEYS[e.key];
      if (d1) {
        setGame((g) => {
          if (g) queueDir(g, 0, d1);
          return g;
        });
        return;
      }
      if (players === 2) {
        const d2 = P2_KEYS[e.code];
        if (d2) {
          setGame((g) => {
            if (g) queueDir(g, 1, d2);
            return g;
          });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, paused, players]);

  const board = useMemo(() => {
    if (!game || !colors) return null;
    const { width, height } = game.config;
    const grid: { color: string; kind: "snake" | "food" | "corpse" }[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null as unknown as { color: string; kind: "snake" | "food" | "corpse" }),
    );
    for (const f of game.food) if (grid[f.y]) grid[f.y][f.x] = { color: hslCss(colors.food), kind: "food" };
    game.snakes.forEach((s, i) => {
      const c = hslCss(i === 0 ? colors.p1 : colors.p2);
      s.body.forEach((seg) => {
        if (grid[seg.y]) grid[seg.y][seg.x] = { color: c, kind: s.exploding ? "corpse" : "snake" };
      });
    });
    return grid;
  }, [game, colors]);

  const winnerText = game
    ? players === 1
      ? `final score: ${game.snakes[0].score}`
      : game.winner === -1
        ? "draw. both of you died."
        : `player ${game.winner + 1} wins!`
    : "";

  return (
    <GameShell title="snake" paused={paused} onResume={() => setPaused(false)} pauseLines={["the dark waits."]}>
      {screen === "menu" && (
        <Center>
          <SelectionGrid
            title="snake"
            options={[
              { id: "1p", label: "1 PLAYER" },
              { id: "2p", label: "2 PLAYER", disabled: false },
              { id: "hi", label: `HIGH SCORE: ${highScore}` },
              { id: "exit", label: "EXIT" },
            ]}
            onConfirm={(id) => {
              if (id === "1p") start(1);
              else if (id === "2p") start(2);
              else if (id === "exit") window.history.back();
            }}
          />
          <Hint>p — pause · 1P arrows or wasd · 2P: arrows vs wasd</Hint>
        </Center>
      )}

      {screen === "options" && (
        <Center>
          <OptionsForm
            lives={lives} setLives={setLives}
            foodCount={foodCount} setFoodCount={setFoodCount}
            players={players}
            onConfirm={beginMatch}
            onBack={() => setScreen("menu")}
          />
        </Center>
      )}

      {screen === "game" && game && board && colors && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: SPACE.sm }}>
          <ScoreBar
            entries={[
              { label: "p1 score", value: game.snakes[0].score },
              ...(players === 2 ? [{ label: "p2 score", value: game.snakes[1]!.score }] : []),
              { label: "p1 lives", value: game.snakes[0].lives },
              ...(players === 2 ? [{ label: "p2 lives", value: game.snakes[1]!.lives }] : []),
              { label: "hi", value: highScore, emphasized: true },
            ]}
          />
          <div
            data-snake="board"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${game.config.width}, ${CELL}px)`,
              gridAutoRows: `${CELL}px`,
              border: `1px solid ${COLORS.dim}`,
              background: COLORS.bg,
            }}
          >
            {board.flatMap((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x},${y}`}
                  style={{
                    width: CELL,
                    height: CELL,
                    boxSizing: "border-box",
                    background: cell ? cell.color : "transparent",
                    opacity: cell?.kind === "corpse" ? 0.45 : 1,
                    outline: cell?.kind === "food" ? "none" : undefined,
                  }}
                />
              )),
            )}
          </div>
        </div>
      )}

      {screen === "over" && (
        <Overlay title="game over" lines={[winnerText, players === 1 ? `high score: ${highScore}` : "", "[enter] menu"]} onDismiss={() => setScreen("menu")} />
      )}
    </GameShell>
  );
};

const Center = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: SPACE.md, fontFamily: FONT, color: COLORS.text, zIndex: Z.panel }}>
    {children}
  </div>
);

const Hint = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div style={{ color: COLORS.dim, fontSize: 14 }}>{children}</div>
);

const OptionsForm = ({
  lives, setLives, foodCount, setFoodCount, players, onConfirm, onBack,
}: {
  lives: number; setLives: (n: number) => void;
  foodCount: number; setFoodCount: (n: number) => void;
  players: 1 | 2; onConfirm: () => void; onBack: () => void;
}): JSX.Element => (
  <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md, alignItems: "center" }}>
    <Stepper label="lives" value={lives} min={1} max={5} onChange={setLives} />
    <Stepper label="food items" value={foodCount} min={1} max={5} onChange={setFoodCount} />
    <div style={{ color: COLORS.dim }}>players: {players}</div>
    <SelectionGrid
      options={[{ id: "go", label: "BEGIN" }, { id: "back", label: "BACK" }]}
      onConfirm={(id) => (id === "go" ? onConfirm() : onBack())}
    />
  </div>
);


const Stepper = ({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }): JSX.Element => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (document.activeElement?.getAttribute("data-stepper") !== label) return;
      if (e.key === "ArrowUp") onChange(Math.min(max, value + 1));
      if (e.key === "ArrowDown") onChange(Math.max(min, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [label, value, min, max, onChange]);

  return (
    <div
      data-stepper={label}
      tabIndex={0}
      onClick={() => onChange(value >= max ? min : value + 1)}
      style={{
        fontFamily: FONT,
        color: COLORS.text,
        border: `1px solid ${COLORS.dim}`,
        padding: `${SPACE.xs}px ${SPACE.sm}px`,
        cursor: "pointer",
        minWidth: 220,
        textAlign: "center",
      }}
    >
      {label}: <span style={{ color: COLORS.emphasis }}>{value}</span>
      <span style={{ color: COLORS.dim }}> (click / arrows)</span>
    </div>
  );
};
