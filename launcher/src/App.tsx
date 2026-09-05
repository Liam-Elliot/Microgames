import { useEffect, useState } from "react";
import {
  COLORS,
  FONT,
  GameShell,
  Launcher,
  SPACE,
  Z,
  type GameRegistration,
} from "@arcadivision/shell";
import { GAMES, PLAYABLE, TOTAL } from "./registry";

const BOOT_LINES = [
  "arcadivision microgames",
  `${PLAYABLE} of ${TOTAL} cartridges respond.`,
  "the dark hums, patient.",
];

export const App = (): JSX.Element => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const games: readonly GameRegistration[] = GAMES.map((g) => ({
    id: g.id,
    title: g.Mount ? g.label : `${g.label} (soon)`,
  }));

  const Active = activeId !== null ? GAMES.find((g) => g.id === activeId)?.Mount : null;

  // [esc] returns to the menu from any game
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  if (Active) {
    return (
      <>
        <Active />
        <button
          onClick={() => setActiveId(null)}
          style={{
            position: "fixed",
            top: SPACE.xs,
            left: SPACE.xs,
            zIndex: Z.modal,
            fontFamily: FONT,
            fontSize: 12,
            color: COLORS.dim,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          [esc] menu
        </button>
      </>
    );
  }

  return (
    <GameShell title="arcadivision" bootLines={BOOT_LINES}>
      <Launcher games={games} onLaunch={setActiveId} />
    </GameShell>
  );
};
