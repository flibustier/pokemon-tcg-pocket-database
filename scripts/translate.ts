/**
 * Writes dist/cards.<lang>.json: `bun ./scripts/translate.ts es|fr|it`, then `bun run build`.
 *
 * Each name comes from, in this order:
 * - Pokemon: the species names of the video games (PokeAPI), with the regional form, Mega and ex
 *   put back the way the language writes them. Checked below against every name already known;
 * - the names already in dist/cards.<lang>.json, written by contributors;
 * - the same card in Pocket, then the same English name in Pocket, then in the paper TCG (TCGdex).
 * A name found nowhere stays in English and is listed at the end: nothing is made up.
 *
 * Sources: https://tcgdex.dev (MIT), https://github.com/PokeAPI/pokeapi (BSD-3-Clause)
 */
import fs from "node:fs";
import cards from "../dist/cards.json";

type Names = Map<string, string>;

const LANGUAGES = {
  es: {
    pokeApi: "7",
    ex: " ex",
    mega: "Mega-",
    rocket: "* del Team Rocket",
    regions: {
      Alolan: "* de Alola",
      Galarian: "* de Galar",
      Hisuian: "* de Hisui",
      Paldean: "* de Paldea",
      "Origin Forme": "* Origen",
    },
  },
  fr: {
    pokeApi: "5",
    ex: "-ex",
    mega: "Méga-",
    rocket: "* de la Team Rocket",
    regions: {
      Alolan: "* d’Alola",
      Galarian: "* de Galar",
      Hisuian: "* de Hisui",
      Paldean: "* de Paldea",
      "Origin Forme": "* Forme Originelle",
    },
  },
  it: {
    pokeApi: "8",
    ex: "-ex",
    mega: "Mega ",
    rocket: "* del Team Rocket",
    regions: {
      Alolan: "* di Alola",
      Galarian: "* di Galar",
      Hisuian: "* di Hisui",
      Paldean: "* di Paldea",
      "Origin Forme": "* Forma Originale",
    },
  },
};

const lang = process.argv[2] as keyof typeof LANGUAGES;
const rules = LANGUAGES[lang];
if (!rules) throw new Error("Usage: bun ./scripts/translate.ts es|fr|it");

const TCGDEX = "https://api.tcgdex.net/v2";
const json = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
};

// Apostrophes and spaces are written in several ways in the sources
const key = (name: string) => name.replaceAll("’", "'").replaceAll("‑", "-").replaceAll(" ", " ").trim();
const clean = (name: string) => name.replaceAll("'", "’").replaceAll(" ", " ").trim();

/** The most frequent translation of each English name */
const mostFrequent = (pairs: [string, string][]): Names => {
  const counts = new Map<string, Map<string, number>>();
  for (const [english, name] of pairs) {
    const names = counts.get(key(english)) ?? new Map<string, number>();
    names.set(clean(name), (names.get(clean(name)) ?? 0) + 1);
    counts.set(key(english), names);
  }
  return new Map(
    [...counts].map(([english, names]) => [
      english,
      [...names].sort((a, b) => b[1] - a[1])[0][0],
    ]),
  );
};

const isPokemon = (card: { image: string }) => card.image.startsWith("cPK");

// --- Species
const csv = await (
  await fetch(
    "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv",
  )
).text();
const englishSpecies = new Map<string, string>();
const localSpecies = new Map<string, string>();
for (const line of csv.split("\n").slice(1)) {
  const [id, language, name] = line.split(",");
  if (language === "9") englishSpecies.set(key(name), id);
  if (language === rules.pokeApi) localSpecies.set(id, name);
}

const translatePokemon = (english: string): string | undefined => {
  const rocket = /^Team Rocket's (.+)$/.exec(key(english))?.[1];
  if (rocket) {
    const name = translatePokemon(rocket);
    return name && rules.rocket.replace("*", name);
  }
  const [, prefix, base, letter = "", ex] =
    /^(?:(Mega|Alolan|Galarian|Hisuian|Paldean|Origin Forme) )?(.+?)( [XY])?( ex)?$/.exec(key(english)) ?? [];
  const species = localSpecies.get(englishSpecies.get(base) ?? "");
  if (!species) return undefined;
  const name =
    prefix === "Mega"
      ? rules.mega + species
      : prefix
        ? rules.regions[prefix as keyof typeof rules.regions].replace("*", species)
        : species;
  return clean(name + letter + (ex ? rules.ex : ""));
};

// --- TCGdex: the sets of Pocket, then every card of the paper TCG
type Listed = { id: string; localId: string; name: string };
const setCode = (id: string) => (id.startsWith("P-") ? id.replace("P-", "PROMO-") : id);
const pocketCards = async (language: string) => {
  const { sets } = await json(`${TCGDEX}/${language}/series/tcgp`);
  const found = new Map<string, string>();
  for (const { id } of sets) {
    const { cards: listed } = await json(`${TCGDEX}/${language}/sets/${id}`);
    for (const { localId, name } of listed as Listed[]) {
      found.set(`${setCode(id)}-${Number(localId)}`, name);
    }
  }
  return found;
};
const allCards = async (language: string) =>
  new Map(
    ((await json(`${TCGDEX}/${language}/cards`)) as Listed[]).map(({ id, name }) => [id, name]),
  );

const [pocketEnglish, pocketLocal, allEnglish, allLocal] = await Promise.all([
  pocketCards("en"),
  pocketCards(lang),
  allCards("en"),
  allCards(lang),
]);

const id = (card: { set: string; number: number }) => `${card.set}-${card.number}`;
// The same card only if both databases give it the same English name
const direct: Names = new Map(
  cards
    .filter((card) => pocketLocal.has(id(card)))
    .filter((card) => key(pocketEnglish.get(id(card)) ?? "") === key(card.name))
    .map((card) => [id(card), clean(pocketLocal.get(id(card))!)]),
);
const pocketNames = mostFrequent(
  cards.filter((card) => direct.has(id(card))).map((card) => [card.name, direct.get(id(card))!]),
);
const paperNames = mostFrequent(
  [...allEnglish].filter(([i]) => allLocal.has(i)).map(([i, name]) => [name, allLocal.get(i)!]),
);

// --- The names already in the repository, unless they are the English ones
const path = `./dist/cards.${lang}.json`;
const existing = fs.existsSync(path)
  ? (JSON.parse(fs.readFileSync(path, "utf-8")) as typeof cards)
  : [];
const englishById = new Map(cards.map((card) => [id(card), card.name]));
const existingNames = mostFrequent(
  existing
    .filter((card) => englishById.has(id(card)))
    .filter((card) => key(card.name) !== key(englishById.get(id(card))!))
    .map((card) => [englishById.get(id(card))!, card.name]),
);

const translate = (card: (typeof cards)[number]) =>
  (isPokemon(card) ? translatePokemon(card.name) : undefined) ??
  existingNames.get(key(card.name)) ??
  direct.get(id(card)) ??
  pocketNames.get(key(card.name)) ??
  paperNames.get(key(card.name));

// --- The rules must give the names already known, whatever the source
const checked = cards.filter((card) => isPokemon(card) && translatePokemon(card.name) && direct.has(id(card)));
const wrong = checked.filter((card) => key(translatePokemon(card.name)!) !== key(direct.get(id(card))!));
console.log(`Pokemon names: ${checked.length - wrong.length}/${checked.length} as in Pocket`);
for (const card of wrong) {
  console.log(`  ${id(card)} ${card.name}: ${translatePokemon(card.name)} here, ${direct.get(id(card))} in TCGdex`);
}

// Few of these are known in Pocket: check them on all of TCGdex, the paper TCG writes them the same way
for (const form of ["Mega", "Alolan", "Galarian", "Hisuian", "Paldean", "Origin Forme", "Team Rocket's"]) {
  const paper = [...allEnglish].filter(
    ([i, name]) => allLocal.has(i) && key(name).startsWith(`${form} `) && translatePokemon(name),
  );
  const other = paper.filter(([i, name]) => key(translatePokemon(name)!) !== key(allLocal.get(i)!));
  console.log(`${form}: ${paper.length - other.length}/${paper.length} as in TCGdex`);
  for (const [i, name] of other.slice(0, 6)) {
    console.log(`  ${i} ${name}: ${translatePokemon(name)} here, ${allLocal.get(i)} in TCGdex`);
  }
}

const unknown = new Map<string, number>();
const translated = cards.map((card) => {
  const name = translate(card);
  if (!name) unknown.set(card.name, (unknown.get(card.name) ?? 0) + 1);
  return { ...card, name: name ?? card.name };
});
fs.writeFileSync(path, JSON.stringify(translated, null, 2) + "\n");

const left = [...unknown.values()].reduce((sum, count) => sum + count, 0);
console.log(`${path}: ${cards.length - left}/${cards.length} cards named`);
console.log(`Left in English, ${unknown.size} names: ${[...unknown.keys()].sort().join(", ")}`);
