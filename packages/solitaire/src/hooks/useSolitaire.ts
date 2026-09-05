// React hook wrapping the decoupled Solitaire (Klondike) game logic.
import { useCallback, useRef, useState } from "react";
import { SeededRng } from "@arcadivision/shell";
import {
  createGame,
  draw,
  wasteToTableau,
  wasteToFoundation,
  tableauToTableau,
  tableauToFoundation,
  type GameState,
  type Rng,
} from "../game";

export interface Selection {
  source: "waste" | "tableau" | "foundation";
  pileIndex: number; // tableau pile index (0-6) or foundation index (0-3)
  cardIndex: number; // for tableau runs
}

export function useSolitaire(seedNumber: number) {
  const rngRef = useRef<Rng | null>(null);
  if (rngRef.current === null) rngRef.current = new SeededRng(seedNumber);
  const gameRef = useRef<GameState | null>(null);
  if (gameRef.current === null) gameRef.current = createGame({}, rngRef.current);

  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);
  const [selection, setSelection] = useState<Selection | null>(null);

  const game = gameRef.current;

  const onDraw = useCallback(() => {
    draw(game, 3);
    rerender();
  }, [game, rerender]);

  // Click waste pile: select top card
  const onWasteClick = useCallback(() => {
    if (game.waste.length === 0) {
      // recycle if empty stock
      if (game.stock.length === 0) { draw(game, 3); rerender(); }
      return;
    }
    setSelection((sel) => (sel?.source === "waste" ? null : { source: "waste", pileIndex: 0, cardIndex: 0 }));
  }, [game, rerender]);

  const onTableauClick = useCallback((pileIndex: number, cardIndex: number) => {
    const pile = game.tableau[pileIndex];
    const card = pile[cardIndex];
    if (card && !card.faceUp) {
      // flip face down card
      return; // face-down cards flipped by logic on move, not click
    }
    if (!selection) {
      setSelection({ source: "tableau", pileIndex, cardIndex });
    } else {
      // attempt move from selection -> this tableau pile
      if (selection.source === "waste") {
        if (wasteToTableau(game, pileIndex)) rerender();
      } else if (selection.source === "tableau") {
        if (tableauToTableau(game, selection.pileIndex, selection.cardIndex, pileIndex)) rerender();
      }
      setSelection(null);
    }
  }, [game, selection, rerender]);

  const onTableauFaceDownClick = useCallback((pileIndex: number) => {
    const pile = game.tableau[pileIndex];
    const top = pile[pile.length - 1];
    if (top && !top.faceUp) {
      top.faceUp = true;
      rerender();
    }
  }, [game, rerender]);

  const onFoundationClick = useCallback((foundationIndex: number) => {
    if (!selection) return;
    if (selection.source === "waste") {
      if (wasteToFoundation(game, foundationIndex)) rerender();
    } else if (selection.source === "tableau") {
      if (tableauToFoundation(game, selection.pileIndex, foundationIndex)) rerender();
    }
    setSelection(null);
  }, [game, selection, rerender]);

  return {
    game,
    selection,
    onDraw,
    onWasteClick,
    onTableauClick,
    onTableauFaceDownClick,
    onFoundationClick,
    clearSelection: () => setSelection(null),
  };
}
