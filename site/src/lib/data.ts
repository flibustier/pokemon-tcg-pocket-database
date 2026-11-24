// Build time only: reads the published JSON files of ../dist.
import rawCards from "../../../dist/cards.extra.json";
import rawSets from "../../../dist/sets.json";
import rawRarities from "../../../dist/rarities.json";
import rawPullRates from "../../../dist/pullRates.json";
import npmPackage from "../../../package.json";
import { cardId, type Card, type Names, type Rarity } from "./shared";

export interface CardSet {
  code: string;
  series: string;
  releaseDate: string;
  name: Record<string, string>;
  packs: string[];
  cards: Card[];
}

export type RawCard = Record<string, unknown> & { set: string; number: number };

export interface PackRates {
  appearance_rate: number;
  cards: number;
  slots: Record<string, Record<string, number>>;
}

export const version = npmPackage.version;
export const rarities = rawRarities as Record<string, Rarity>;
export const pullRates = rawPullRates as unknown as Record<string, Record<string, PackRates>>;

/** The cards exactly as they are in cards.extra.json. */
export const rawCardsById = new Map((rawCards as RawCard[]).map((card) => [cardId(card), card]));

export const cards: Card[] = (rawCards as any[]).map((card) => ({
  set: card.set,
  number: card.number,
  name: card.name,
  rarity: card.rarity,
  element: card.element,
  type: card.type.toLowerCase(),
  stage: card.stage === undefined ? undefined : String(card.stage),
  health: card.health,
  weakness: card.weakness,
  retreatCost: card.retreatCost,
  evolvesFrom: card.evolvesFrom,
  packs: card.packs ?? [],
}));

const cardsBySet = Map.groupBy(cards, ({ set }) => set);

export const series = Object.entries(rawSets).map(([name, sets]) => ({
  name,
  sets: sets.map((set): CardSet => ({ ...set, series: name, cards: cardsBySet.get(set.code) ?? [] })),
}));

export const sets = series.flatMap(({ sets }) => sets);
export const setsByCode = new Map(sets.map((set) => [set.code, set]));

const cardsByName = Map.groupBy(cards, ({ name }) => name);
export const printsOf = (name: string) => cardsByName.get(name) ?? [];
const cardsByPrevious = Map.groupBy(
  cards.filter(({ evolvesFrom }) => evolvesFrom),
  ({ evolvesFrom }) => evolvesFrom!,
);

const uniqueNames = (list: Card[]) => [...new Map(list.map((card) => [card.name, card])).values()];

/** The cards this one evolves into, one by name, taken in the same set when there is one. */
export const evolutionsOf = (card: Card) => {
  const next = cardsByPrevious.get(card.name) ?? [];
  return uniqueNames([...next, ...next.filter(({ set }) => set === card.set).reverse()]);
};

/** The card this one evolves from, taken in the same set when there is one. */
export const previousOf = (card: Card) => {
  if (!card.evolvesFrom) return undefined;
  const prints = printsOf(card.evolvesFrom);
  return prints.find(({ set }) => set === card.set) ?? prints[0];
};

// Not every pack has an image: promos do not
export const packImages = new Set(
  Object.keys(import.meta.glob("../../../dist/images/packs/*.webp")).map((path) =>
    path.slice(path.lastIndexOf("/") + 1, -".webp".length),
  ),
);

// Every cards.xx.json of ../dist is a language of the site: adding one needs no change here
const translations = import.meta.glob<{ set: string; number: number; name: string }[]>(
  "../../../dist/cards.??.json",
  { eager: true, import: "default" },
);

export const translatedNames = new Map(
  Object.entries(translations).map(([path, list]) => [
    path.slice(-"xx.json".length, -".json".length),
    new Map(list.map((card) => [cardId(card), card.name])),
  ]),
);

export const languages = ["en", ...[...translatedNames.keys()].sort()];

// Names repeat from a set to another, so a map by English name is a fraction of cards.xx.json.
// A card translated another way than its namesakes is there by its id.
export const namesIn = (lang: string): Names => {
  const translated = translatedNames.get(lang)!;
  const names: Record<string, string> = {};
  const seen: Record<string, string> = {};
  for (const card of cards) {
    const id = cardId(card);
    const name = translated.get(id) ?? card.name;
    seen[card.name] ??= name;
    if (name !== seen[card.name]) names[id] = name;
    else if (name !== card.name) names[card.name] = name;
  }
  return {
    sets: Object.fromEntries(sets.map((set) => [set.code, set.name[lang] ?? set.name.en!])),
    cards: names,
  };
};
