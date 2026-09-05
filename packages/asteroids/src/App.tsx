import { useRef } from "react";
import { COLORS, FONT } from "@arcadivision/shell";
import { WORLD_WIDTH, WORLD_HEIGHT } from "./game";
import { useAsteroids } from "./hooks/useAsteroids";

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useAsteroids(canvasRef);

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: FONT,
      }}
    >
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        style={{
          border: `1px solid ${COLORS.dim}`,
          imageRendering: "pixelated",
          maxWidth: "100%",
          height: "auto",
        }}
      />
      <div style={{ color: COLORS.dim, fontSize: 13 }}>
        ←/→ or A/D rotate&nbsp;&nbsp;|&nbsp;&nbsp;W/↑ thrust&nbsp;&nbsp;|&nbsp;&nbsp;SPACE fire
      </div>
    </div>
  );
}
