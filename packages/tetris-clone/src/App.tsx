import { useRef } from "react";
import { COLORS, FONT } from "@arcadivision/shell";
import { useTetris } from "./hooks/useTetris";
import { CANVAS_W, CANVAS_H } from "./present/render";

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useTetris(canvasRef);

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
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ border: `1px solid ${COLORS.dim}`, imageRendering: "pixelated", maxWidth: "100%", height: "auto" }}
      />
      <div style={{ color: COLORS.dim, fontSize: 13 }}>
        ←/→ move&nbsp;&nbsp;|&nbsp;&nbsp;↓ soft drop&nbsp;&nbsp;|&nbsp;&nbsp;↑/X rotate&nbsp;&nbsp;|&nbsp;&nbsp;Z ccw&nbsp;&nbsp;|&nbsp;&nbsp;SPACE hard drop&nbsp;&nbsp;|&nbsp;&nbsp;C hold
      </div>
    </div>
  );
}
