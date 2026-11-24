// Used at build time and in the browser: nothing here may import the JSON files of ../dist.

export interface Card {
  set: string;
  number: number;
  name: string;
  rarity: string;
  element?: string;
  type: string;
  stage?: string;
  health?: number;
  weakness?: string;
  retreatCost?: number;
  evolvesFrom?: string;
  packs: string[];
}

export interface Rarity {
  label: string;
  image?: string;
  count?: number;
  group: string;
  tradeable: boolean;
  tradePrice: number | null;
  points?: number;
}

/** What `data/names/xx.json` holds: card names by English name, or by card id when it differs. */
export interface Names {
  sets: Record<string, string>;
  cards: Record<string, string>;
}

// A card as it is sent to the browser. `0` stands for "none", it is shorter than `null`.
export type PackedCard = [
  set: string,
  number: number,
  name: string,
  rarity: string,
  element: string | 0,
  type: string,
  stage: string | 0,
  health: number,
  weakness: string | 0,
  retreatCost: number | -1,
  evolvesFrom: string | 0,
  packs: string[] | 0,
];

export const pack = (card: Card): PackedCard => [
  card.set,
  card.number,
  card.name,
  card.rarity,
  card.element ?? 0,
  card.type,
  card.stage ?? 0,
  card.health ?? 0,
  card.weakness ?? 0,
  card.retreatCost ?? -1,
  card.evolvesFrom ?? 0,
  card.packs.length ? card.packs : 0,
];

export const unpack = (p: PackedCard): Card => ({
  set: p[0],
  number: p[1],
  name: p[2],
  rarity: p[3],
  element: p[4] || undefined,
  type: p[5],
  stage: p[6] || undefined,
  health: p[7] || undefined,
  weakness: p[8] || undefined,
  retreatCost: p[9] < 0 ? undefined : p[9],
  evolvesFrom: p[10] || undefined,
  packs: p[11] || [],
});

export const cardId = ({ set, number }: { set: string; number: number }) => `${set}-${number}`;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const url = (path: string) => BASE + path;

export const cardUrl = ({ set, number }: { set: string; number: number }) =>
  url(`/cards/${set}/${number}/`);
export const setUrl = (code: string) => url(`/sets/${code}/`);

const CDN = "https://cdn.pokemon-tcg.exchange/images";
export const thumbnailUrl = ({ set, number }: { set: string; number: number }) =>
  `${CDN}/thumbnails/${set}/${number}.webp`;
export const imageUrl = ({ set, number }: { set: string; number: number }) =>
  `${CDN}/cards-by-set/${set}/${number}.webp`;

// The logos are named after the locales of the game
const REGIONS: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  it: "it_IT",
  pt: "pt_BR",
  ja: "ja_JP",
  ko: "ko_KR",
  zh: "zh_TW",
};
export const logoUrl = (code: string, lang = "en") =>
  url(`/images/sets/LOGO_expansion_${code}_${REGIONS[lang] ?? REGIONS.en}.webp`);

export const LANGUAGES: Record<string, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ja: "日本語",
  ko: "한국어",
  zh: "繁體中文",
};

export const ELEMENTS = [
  "grass",
  "fire",
  "water",
  "lightning",
  "psychic",
  "fighting",
  "darkness",
  "metal",
  "dragon",
  "colorless",
] as const;

export const TYPES: Record<string, string> = {
  pokemon: "Pokémon",
  supporter: "Supporter",
  item: "Item",
  tool: "Tool",
  stadium: "Stadium",
  fossil: "Fossil",
};

export const STAGES: Record<string, string> = {
  basic: "Basic",
  "1": "Stage 1",
  "2": "Stage 2",
};

// How tall the line of a card is in a barcode, in percents. In the order of the cost to craft.
export const RARITY_HEIGHTS: Record<string, number> = {
  C: 34,
  U: 42,
  R: 50,
  AR: 60,
  RR: 66,
  S: 74,
  SR: 82,
  SAR: 82,
  SSR: 88,
  IM: 94,
  UR: 100,
  AN: 100,
};

// The order of rarities.json has shiny cards after crowns, the cost to craft tells better.
// Anomalies cannot be crafted.
export const rarityRank = ({ points }: Rarity) => points ?? Infinity;

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const formatDate = (date: string, month: "long" | "short" = "long") =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
    timeZone: "UTC",
    year: "numeric",
    month,
    day: "numeric",
  });

export const formatNumber = (value: number) => value.toLocaleString("en");
