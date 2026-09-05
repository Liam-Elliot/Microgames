import { useRef } from "react";
import { COLORS, FONT } from "@arcadivision/shell";
import { WORLD_W, WORLD_H } from "./game/game";
import { useFlappy } from "./hooks/useFlappy";

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useFlappy(canvasRef);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONT }}>
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        style={{ border: `1px solid ${COLORS.dim}`, imageRendering: "pixelated", maxWidth: "100%", height: "auto", cursor: "pointer" }}
      />
      <div style={{ color: COLORS.dim, fontSize: 13 }}>
        SPACE / ↑ / click to flap
      </div>
    </div>
  );
}
