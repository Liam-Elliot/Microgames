import { useRef } from "react";
import { COLORS, FONT, ALPHA, SPACE } from "@arcadivision/shell";
import { SUIT_COLOR, type Card, type Suit, type Rank } from "./game/game";
import { useSolitaire } from "./hooks/useSolitaire";

const RANK_LABEL: Record<Rank, string> = {
  1: "A", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8",
  9: "9", 10: "10", 11: "J", 12: "Q", 13: "K",
};

const SUIT_LABEL: Record<Suit, string> = {
  hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠",
};

function cardColor(card: Card): string {
  return SUIT_COLOR[card.suit] === "red" ? COLORS.hostile : COLORS.text;
}

function cardLabel(card: Card): string {
  return `${RANK_LABEL[card.rank]}${SUIT_LABEL[card.suit]}`;
}

export function App(): JSX.Element {
  const seedRef = useRef<number>((Date.now() & 0x7fffffff) >>> 0);
  const {
    game,
    selection,
    onDraw,
    onWasteClick,
    onTableauClick,
    onTableauFaceDownClick,
    onFoundationClick,
  } = useSolitaire(seedRef.current);

  const isSelectedWaste = selection?.source === "waste";

  const cardBox: React.CSSProperties = {
    width: 44,
    height: 60,
    border: `1px solid ${COLORS.dim}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontFamily: FONT,
  };

  function renderFaceDown(key: number): JSX.Element {
    return (
      <div
        key={key}
        style={{ ...cardBox, background: COLORS.dim, color: COLORS.bg }}
      >
        ?
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.md,
        fontFamily: FONT,
        color: COLORS.text,
      }}
    >
      <div style={{ fontVariant: "small-caps", letterSpacing: 3, fontSize: 20 }}>
        solitaire
      </div>
      {game.phase === "won" && (
        <div style={{ color: COLORS.emphasis, fontSize: 16 }}>YOU WIN</div>
      )}

      {/* Top row: stock + waste + foundations */}
      <div style={{ display: "flex", gap: SPACE.md, alignItems: "flex-start" }}>
        <div onClick={onDraw} style={{ ...cardBox, cursor: "pointer", background: COLORS.dim, color: COLORS.bg }}>
          {game.stock.length === 0 ? "↻" : game.stock.length}
        </div>
        <div
          onClick={onWasteClick}
          style={{
            ...cardBox,
            cursor: "pointer",
            background: COLORS.bg,
            border: isSelectedWaste ? `1px solid ${COLORS.emphasis}` : `1px solid ${COLORS.dim}`,
          }}
        >
          {game.waste.length ? (
            <span style={{ color: cardColor(game.waste[game.waste.length - 1]) }}>
              {cardLabel(game.waste[game.waste.length - 1])}
            </span>
          ) : ""}
        </div>
        <div style={{ width: SPACE.md }} />
        {game.foundations.map((foundation, fi) => (
          <div
            key={fi}
            onClick={() => onFoundationClick(fi)}
            style={{
              ...cardBox,
              cursor: "pointer",
              background: COLORS.bg,
              border: `1px solid ${COLORS.dim}`,
            }}
          >
            {foundation.length ? (
              <span style={{ color: cardColor(foundation[foundation.length - 1]) }}>
                {cardLabel(foundation[foundation.length - 1])}
              </span>
            ) : (
              <span style={{ color: ALPHA.deemphasis }}>{SUIT_LABEL.hearts}</span>
            )}
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ display: "flex", gap: SPACE.sm }}>
        {game.tableau.map((pile, pi) => {
          const topIndex = pile.length - 1;
          const isSelectedPile =
            selection?.source === "tableau" && selection.pileIndex === pi;
          return (
            <div
              key={pi}
              style={{
                minWidth: 46,
                minHeight: 62,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                border: isSelectedPile ? `1px solid ${COLORS.emphasis}` : `1px solid ${COLORS.dim}`,
                padding: SPACE.xs,
                background: ALPHA.gridHairline,
              }}
            >
              {pile.length === 0 && (
                <div
                  onClick={() => onTableauClick(pi, 0)}
                  style={{ ...cardBox, background: COLORS.bg, cursor: "pointer" }}
                />
              )}
              {pile.map((card, ci) => {
                if (!card.faceUp) {
                  return (
                    <div key={ci} onClick={() => onTableauFaceDownClick(pi)}>
                      {renderFaceDown(ci)}
                    </div>
                  );
                }
                const selected =
                  selection?.source === "tableau" &&
                  selection.pileIndex === pi &&
                  selection.cardIndex === ci;
                return (
                  <div
                    key={ci}
                    onClick={() => onTableauClick(pi, ci)}
                    style={{
                      ...cardBox,
                      background: selected ? COLORS.highlightBg : COLORS.bg,
                      color: selected ? COLORS.onHighlight : cardColor(card),
                      cursor: "pointer",
                      marginTop: ci === topIndex ? 0 : -40,
                    }}
                  >
                    {cardLabel(card)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ color: COLORS.dim, fontSize: 12 }}>
        click stock to draw 3&nbsp;&nbsp;|&nbsp;&nbsp;click card then destination
      </div>
    </div>
  );
}
