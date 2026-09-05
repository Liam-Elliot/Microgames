// Solitaire (Klondike) — decoupled game model (no DOM/React/framework dep).
// 7 tableau piles, 4 foundations, stock/waste with 3-card deals.
// RNG is INJECTED (style-guide §9 — never constructs its own SeededRng).

// Structural RNG shape matching @arcadivision/shell's SeededRng (injectable or mock).
export interface RngLike {
  next(): number;
  int(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

type Rng = RngLike;

// Fisher-Yates shuffle (deterministic given an Rng).
function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const SUIT_COLOR: Record<Suit, "red" | "black"> = {
  hearts: "red",
  diamonds: "red",
  clubs: "black",
  spades: "black",
};

export interface GameState {
  tableau: Card[][]; // 7 piles; last card face-up
  foundations: Card[][]; // 4 piles; built up same suit A->K
  stock: Card[]; // face-down draw pile
  waste: Card[]; // face-up discard (top is last)
  phase: "playing" | "won";
  moves: number;
  rng: Rng;
}

export type Config = Record<string, never>;

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false });
    }
  }
  return deck;
}

export function createGame(
  rng: Rng,
  _config: Partial<Config> = {},
): GameState {
  const deck = shuffle(rng, makeDeck());

  const tableau: Card[][] = [];
  for (let i = 0; i < 7; i++) {
    const pile: Card[] = [];
    for (let j = 0; j <= i; j++) {
      const card = deck.shift()!;
      pile.push({ ...card, faceUp: j === i }); // top card face-up
    }
    tableau.push(pile);
  }

  return {
    tableau,
    foundations: [[], [], [], []],
    stock: deck.map((c) => ({ ...c, faceUp: false })),
    waste: [],
    phase: "playing",
    moves: 0,
    rng,
  };
}

// --- Draw from stock (1 or 3 cards) ---
export function draw(state: GameState, count = 3): void {
  if (state.stock.length === 0) {
    // recycle waste -> stock
    state.stock = state.waste.reverse().map((c) => ({ ...c, faceUp: false }));
    state.waste = [];
    state.moves++;
    return;
  }
  for (let i = 0; i < count && state.stock.length > 0; i++) {
    const card = state.stock.pop()!;
    state.waste.push({ ...card, faceUp: true });
  }
  state.moves++;
}

function topOf(pile: Card[]): Card | null {
  return pile.length ? pile[pile.length - 1] : null;
}

function canStackTableau(card: Card, onto: Card): boolean {
  return SUIT_COLOR[card.suit] !== SUIT_COLOR[onto.suit] && card.rank === onto.rank - 1;
}

function canStackFoundation(card: Card, onto: Card): boolean {
  return card.suit === onto.suit && card.rank === onto.rank + 1;
}

// --- Move from waste to tableau pile ---
export function wasteToTableau(state: GameState, pileIndex: number): boolean {
  if (pileIndex < 0 || pileIndex >= 7) return false;
  const card = topOf(state.waste);
  if (!card) return false;
  const onto = topOf(state.tableau[pileIndex]);
  if (onto === null) {
    if (card.rank !== 13) return false; // only King on empty
  } else if (!canStackTableau(card, onto)) {
    return false;
  }
  state.waste.pop();
  state.tableau[pileIndex].push(card);
  state.moves++;
  return true;
}

// --- Move from waste to foundation ---
export function wasteToFoundation(state: GameState, foundationIndex: number): boolean {
  if (foundationIndex < 0 || foundationIndex >= 4) return false;
  const card = topOf(state.waste);
  if (!card) return false;
  const onto = topOf(state.foundations[foundationIndex]);
  if (onto === null) {
    if (card.rank !== 1) return false; // only Ace on empty
  } else if (!canStackFoundation(card, onto)) {
    return false;
  }
  state.waste.pop();
  state.foundations[foundationIndex].push(card);
  state.moves++;
  checkWin(state);
  return true;
}

// --- Move a run of cards (from tableau) to another tableau pile ---
export function tableauToTableau(
  state: GameState,
  fromIndex: number,
  cardIndex: number,
  toIndex: number,
): boolean {
  if (fromIndex === toIndex) return false;
  if (fromIndex < 0 || fromIndex >= 7 || toIndex < 0 || toIndex >= 7) return false;
  const fromPile = state.tableau[fromIndex];
  if (cardIndex < 0 || cardIndex >= fromPile.length) return false;
  const moving = fromPile[cardIndex];
  if (!moving.faceUp) return false;
  const onto = topOf(state.tableau[toIndex]);
  if (onto === null) {
    if (moving.rank !== 13) return false;
  } else if (!canStackTableau(moving, onto)) {
    return false;
  }
  const run = fromPile.splice(cardIndex);
  state.tableau[toIndex].push(...run);
  // flip new top of source
  flipTop(state.tableau[fromIndex]);
  state.moves++;
  return true;
}

// --- Move top tableau card to foundation ---
export function tableauToFoundation(
  state: GameState,
  fromIndex: number,
  foundationIndex: number,
): boolean {
  if (fromIndex < 0 || fromIndex >= 7 || foundationIndex < 0 || foundationIndex >= 4)
    return false;
  const card = topOf(state.tableau[fromIndex]);
  if (!card || !card.faceUp) return false;
  const onto = topOf(state.foundations[foundationIndex]);
  if (onto === null) {
    if (card.rank !== 1) return false;
  } else if (!canStackFoundation(card, onto)) {
    return false;
  }
  state.tableau[fromIndex].pop();
  state.foundations[foundationIndex].push(card);
  flipTop(state.tableau[fromIndex]);
  state.moves++;
  checkWin(state);
  return true;
}

// --- Move from foundation back to tableau (seldom used, but valid) ---
export function foundationToTableau(
  state: GameState,
  foundationIndex: number,
  toIndex: number,
): boolean {
  if (foundationIndex < 0 || foundationIndex >= 4 || toIndex < 0 || toIndex >= 7)
    return false;
  const card = topOf(state.foundations[foundationIndex]);
  if (!card) return false;
  const onto = topOf(state.tableau[toIndex]);
  if (onto === null) {
    if (card.rank !== 13) return false;
  } else if (!canStackTableau(card, onto)) {
    return false;
  }
  state.foundations[foundationIndex].pop();
  state.tableau[toIndex].push(card);
  state.moves++;
  return true;
}

function flipTop(pile: Card[]): void {
  const top = topOf(pile);
  if (top && !top.faceUp) top.faceUp = true;
}

function checkWin(state: GameState): void {
  const total = state.foundations.reduce((sum, p) => sum + p.length, 0);
  if (total === 52) {
    state.phase = "won";
  }
}

export function isWon(state: GameState): boolean {
  return state.phase === "won";
}
