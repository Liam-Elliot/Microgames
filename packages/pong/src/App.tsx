import { useRef } from "react";
import { COLORS, FONT } from "@arcadivision/shell";
import { usePong } from "./hooks/usePong";

export function App(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  usePong(canvasRef);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONT }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={400}
        style={{ border: `1px solid ${COLORS.dim}`, imageRendering: "pixelated" }}
      />
      <div style={{ color: COLORS.dim, fontSize: 13 }}>
        L: W/S or Arrow Up/Down&nbsp;&nbsp;|&nbsp;&nbsp;R: Arrow keys (P2)&nbsp;&nbsp;|&nbsp;&nbsp;SPACE serve&nbsp;&nbsp;|&nbsp;&nbsp;P pause&nbsp;&nbsp;|&nbsp;&nbsp;ESC menu
      </div>
    </div>
  );
}
