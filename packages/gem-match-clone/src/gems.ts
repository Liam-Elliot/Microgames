/** 6 gem hues spread evenly around the wheel (spec §2 distinguishability rule). */
import type { Cell } from "./engine";

const HUES = [0, 60, 120, 180, 240, 300];

export const GEM_COLORS: readonly string[] = HUES.map((h) => `hsl(${h}, 100%, 60%)`);

/** Original geometric glyphs, one per hue (spec §9 — no copied jewel art). */
export const GEM_GLYPHS: readonly string[] = ["◆", "▲", "●", "■", "★", "✦"];

export function gemCss(c: Cell): { color: string; glyph: string } {
  return {
    color: GEM_COLORS[c.color] ?? "#33ff66",
    glyph: GEM_GLYPHS[c.color] ?? "?",
  };
}

export function specialGlyph(special: Cell["special"]): string | null {
  switch (special) {
    case "line-h": return "═";
    case "line-v": return "║";
    case "color": return "◉";
    case "radius": return "◎";
    default: return null;
  }
}
