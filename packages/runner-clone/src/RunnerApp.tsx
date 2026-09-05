import { useCallback, useEffect, useRef, useState } from "react";
import {
  COLORS,
  FONT,
  GameShell,
  Overlay,
  ScoreBar,
  SeededRng,
  SelectionGrid,
  SPACE,
} from "@arcadivision/shell";
import {
  createRunner,
  input,
  PLAYER_ROW,
  tick,
  view,
  type PlayerAction,
  type RunnerState,
} from "./engine";
import { RunView } from "./RunView";

type Screen = "menu" | "game" | "over";

const HI_KEY = "arcadivision.runner.highscore";
const TICK_MS = 110;
const VIEW_ROWS = 16;

const readHi = (): number => {
  const v = typeof localStorage !== "undefined" ? localStorage.getItem(HI_KEY) : null;
  return v ? parseInt(v, 10) || 0 : 0;
};

const KEY_ACTIONS: Record<string, PlayerAction> = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump",
  ArrowDown: "slide", KeyS: "slide",
};

export const RunnerApp = (): JSX.Element => {
  const [screen, setScreen] = useState<Screen>("menu");
  const [state, setState] = useState<RunnerState | null>(null);
  const [highScore, setHighScore] = useState(readHi);
  const [status, setStatus] = useState("");
  const rngRef = useRef(new SeededRng(Date.now() >>> 0));

  const start = useCallback((): void => {
    rngRef.current = new SeededRng(Date.now() >>> 0);
    setState(createRunner(rngRef.current));
    setStatus("you run. the city does not wait.");
    setScreen("game");
  }, []);


  // hi-score on death
  useEffect(() => {
    if (state && !state.alive && screen === "game") {
      const final = Math.floor(state.score);
      if (final > highScore) {
        localStorage.setItem(HI_KEY, String(final));
        setHighScore(final);
      }
      setScreen("over");
    }
  }, [state?.alive, screen, state, highScore]);

  // main loop
  useEffect(() => {
    if (screen !== "game" || !state?.alive) return;
    const t = setInterval(() => {
      setState((s) => {
        if (!s?.alive) return s;
        const next = { ...s, track: [...s.track] };
        const res = tick(next, rngRef.current);
        if (res.powerPicked) setStatus(`picked up: ${res.powerPicked}`);
        else if (res.shieldUsed) setStatus("the shield shatters. you run on.");
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [screen, state?.alive]);

  // input
  useEffect(() => {
    if (screen !== "game") return;
    const onKey = (e: KeyboardEvent): void => {
      const action = KEY_ACTIONS[e.key] ?? KEY_ACTIONS[e.code];
      if (action) {
        e.preventDefault();
        setState((s) => {
          if (s) input(s, action);
          return s;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  return (
    <GameShell title="runner">
      {screen === "menu" && (
        <Center>
          <SelectionGrid
            title="runner"
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
          <Hint>a/d or arrows — lanes · w/up jump · s/down slide</Hint>
        </Center>
      )}

      {screen === "game" && state && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: SPACE.sm }}>
          <ScoreBar
            entries={[
              { label: "score", value: Math.floor(state.score) },
              { label: "distance", value: Math.floor(state.distance + PLAYER_ROW) },
              { label: "coins", value: state.coins },
              { label: "hi", value: highScore, emphasized: true },
              ...(state.shield ? [{ label: "shield", value: "on" }] : []),
              ...(state.activePower ? [{ label: state.activePower, value: state.powerTicks }] : []),
            ]}
          />
          <RunView
            rows={view(state, VIEW_ROWS)}
            playerRow={PLAYER_ROW}
            playerLane={state.lane}
            airborne={state.jumpTicks > 0}
            sliding={state.slideTicks > 0}
            shield={state.shield}
          />
          <Hint>{status}</Hint>
        </div>
      )}

      {screen === "over" && state && (
        <Overlay
          title="the run ends"
          lines={[
            `final score: ${Math.floor(state.score)}`,
            `distance: ${Math.floor(state.distance + PLAYER_ROW)}`,
            `coins: ${state.coins}`,
            `high score: ${highScore}`,
            "[enter] menu",
          ]}
          onDismiss={() => setScreen("menu")}
        />
      )}
      
    </GameShell>
  );
};

const Center = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", gap: SPACE.md, fontFamily: FONT, color: COLORS.text }}>
    {children}
  </div>
);

const Hint = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div style={{ color: COLORS.dim, fontSize: 14 }}>{children}</div>
);
