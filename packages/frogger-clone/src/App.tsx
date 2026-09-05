import { useRef } from "react";
import { COLORS, FONT } from "@arcadivision/shell";
import { useFrogger } from "./hooks/useFrogger";
import { CANVAS_W, CANVAS_H } from "./present/render";

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useFrogger(canvasRef);

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
        arrows / WASD hop&nbsp;&nbsp;|&nbsp;&nbsp;cross the road, ride the logs
      </div>
    </div>
  );
}
