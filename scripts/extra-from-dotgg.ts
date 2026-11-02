import fs from "node:fs";
import prettier from "prettier";
import mainCards from "../dist/cards.json";
import currentExtra from "../dist/cards.extra.json";

// Rebuilds dist/cards.extra.json for every card of cards.json from the card data behind ptcgpocket.gg.
// Cards are matched by the internal id in their image name (cPK_10_000010_… ⇔ dotgg game_id 10), so reprints and
// promos resolve without relying on set numbers.
console.log("Usage: bun ./scripts/extra-from-dotgg.ts");

const DOTGG_URL = "https://api.dotgg.gg/cgfw/getcards?game=pokepocket";
const HUGO_SETS_URL =
  "https://api.github.com/repos/hugoburguete/pokemon-tcg-pocket-card-database/contents/cards/en";

// Trainer subtypes are not part of the dotgg data. They come from the current cards.extra.json, then from
// hugoburguete/pokemon-tcg-pocket-card-database (up to B4), then from this list for the sets released since.
const TRAINER_TYPES: Record<string, string> = {
  Arcade: "stadium",
  "Abandoned Station": "stadium",
  Eviolite: "tool",
  "Light Ball": "tool",
  "Team Rocket's Boss": "supporter",
  "Team Rocket's Researcher": "supporter",
  Lorelei: "supporter",
  Rika: "supporter",
  "Poké Mart Guy": "supporter",
  "Sweet Honey": "item",
  "Super Potion": "item",
  "Max Repel": "item",
  "Full Heal": "item",
  "Genome Converter Y": "item",
};

type DotggCard = {
  name: string;
  color: string | null;
  type: "Pokemon" | "Trainer";
  stage: "Basic" | "Stage 1" | "Stage 2" | null;
  hp: string | null;
  retreat: string | null;
  weakness: string | null;
  prew_stage_name: string | null;
  game_kind: "PK" | "TR";
  game_id: string;
};

const STAGES = { Basic: "basic", "Stage 1": 1, "Stage 2": 2 } as const;

const response = await fetch(DOTGG_URL, {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const dotggCards = (await response.json()) as DotggCard[];
const dotggById = new Map(
  dotggCards.map((card) => [`${card.game_kind}${Number(card.game_id)}`, card]),
);

const trainerKey = (name: string) => name.replaceAll("’", "'");

const hugoTrainerTypes = new Map<string, string>();
const hugoSets = (await (await fetch(HUGO_SETS_URL)).json()) as {
  name: string;
  download_url: string;
}[];
for (const set of hugoSets.filter(({ name }) => name.endsWith(".json"))) {
  const cards = (await (await fetch(set.download_url)).json()) as {
    name: string;
    type: string;
    subtype?: string;
  }[];
  for (const card of cards) {
    if (card.type === "Trainer" && card.subtype)
      hugoTrainerTypes.set(trainerKey(card.name), card.subtype.toLowerCase());
  }
}

const trainerTypes = new Map<string, string>(Object.entries(TRAINER_TYPES));
for (const [name, type] of hugoTrainerTypes) trainerTypes.set(name, type);
for (const card of currentExtra as { name: string; type: string }[]) {
  if (card.type !== "pokemon" && card.type !== "trainer")
    trainerTypes.set(trainerKey(card.name), card.type);
}
const current = new Map(
  (
    currentExtra as {
      set: string;
      number: number;
      stage?: string;
      goodWith?: string[];
    }[]
  ).map((card) => [`${card.set}-${card.number}`, card]),
);

const lower = (value: string | null) =>
  value && value.toLowerCase() !== "none" ? value.toLowerCase() : undefined;
const number = (value: string | null) =>
  value == null ? undefined : Number(value);

const missing: string[] = [];
const extra = mainCards.flatMap((card) => {
  const id = card.image?.match(/^c(PK|TR)_\d+_(\d{6})_/);
  const dotgg = id && dotggById.get(`${id[1]}${Number(id[2])}`);
  if (!dotgg) {
    missing.push(`${card.set}-${card.number} ${card.name}`);
    return [];
  }
  const base = {
    set: card.set,
    number: card.number,
    name: card.name,
    rarity: card.rarity,
    image: card.image,
    packs: card.packs?.length ? card.packs : undefined,
  };
  if (dotgg.type === "Trainer") {
    const type = trainerTypes.get(trainerKey(card.name));
    if (!type)
      missing.push(
        `${card.set}-${card.number} ${card.name} (trainer type unknown)`,
      );
    const { stage, goodWith } = current.get(`${card.set}-${card.number}`) ?? {}; // fossils are played as Basic
    return [{ ...base, type: type ?? "trainer", stage, goodWith }];
  }
  return [
    {
      ...base,
      element: lower(dotgg.color),
      type: "pokemon",
      stage: dotgg.stage ? STAGES[dotgg.stage] : undefined,
      health: number(dotgg.hp),
      retreatCost: number(dotgg.retreat),
      weakness: lower(dotgg.weakness),
      evolvesFrom: dotgg.prew_stage_name ?? undefined,
      goodWith: current.get(`${card.set}-${card.number}`)?.goodWith,
    },
  ];
});

const filePath = "./dist/cards.extra.json";
const prettierOptions = await prettier.resolveConfig(filePath);
fs.writeFileSync(
  filePath,
  await prettier.format(JSON.stringify(extra), {
    ...prettierOptions,
    parser: "json",
  }),
);

console.log(`Wrote ${extra.length} cards to ${filePath}`);
if (missing.length)
  console.log(`Needs a look (${missing.length}):\n  ${missing.join("\n  ")}`);
