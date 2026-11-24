/**
 * Writes dist/cards.<lang>.json: `bun ./scripts/translate.ts es|fr|it|ja|ko|pt|zh`, then `bun run build`.
 *
 * Each name comes from, in this order:
 * - Pokemon: the species names of the video games (PokeAPI), with the regional form, Mega and ex
 *   put back the way the language writes them. Checked below against every name already known;
 * - the names already in dist/cards.<lang>.json, written by contributors;
 * - the same card in Pocket, then the same English name in Pocket (TCGdex), then the "In other
 *   languages" table of the card (Bulbapedia), then the same English name in the paper TCG (TCGdex).
 * A name found nowhere stays in English and is listed at the end: nothing is made up.
 *
 * Sources: https://tcgdex.dev (MIT), https://github.com/PokeAPI/pokeapi (BSD-3-Clause),
 * https://bulbapedia.bulbagarden.net (only the names of the Trainer cards)
 */
import fs from "node:fs";
import cards from "../dist/cards.json";
import sets from "../dist/sets.json";

type Names = Map<string, string>;

type Language = {
  /** Language of the species names. Portuguese has none: it keeps the English ones, but for TCGdex's */
  pokeApi?: string;
  /** TCGdex has no Pocket card in Japanese, Korean and Chinese, and no link from their paper cards to the English ones */
  tcgdex?: { pocket: string; paper: string };
  bulbapedia: string[];
  ex: string;
  /** Mega Charizard X: the last letter follows the name with a space, or with none */
  letter?: string;
  mega: string;
  rocket: string;
  regions: Record<string, string>;
  /** The forms which are neither species nor regional, when TCGdex does not have them */
  forms?: Record<string, string>;
  /** Names known to be wrong in Bulbapedia: the right one, or undefined to leave it in English */
  wrong?: Record<string, string | undefined>;
};

const LANGUAGES: Record<string, Language> = {
  es: {
    pokeApi: "7",
    tcgdex: { pocket: "es", paper: "es" },
    bulbapedia: ["es", "es_eu"],
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
    // "Investigación del Team Rocket": the research, not the researcher, and no other source
    wrong: { "Team Rocket's Researcher": undefined },
  },
  fr: {
    pokeApi: "5",
    tcgdex: { pocket: "fr", paper: "fr" },
    bulbapedia: ["fr"],
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
    tcgdex: { pocket: "it", paper: "it" },
    bulbapedia: ["it"],
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
    forms: { "Ultra Necrozma": "Ultra Necrozma" },
    // Written without the capital that all the other cards have
    wrong: { "Max Repel": "Repellente Max", "Rising Star": "Giovane Speranza" },
  },
  // As in Pocket: no space after the region, unlike the paper cards of the last series
  ja: {
    pokeApi: "11",
    bulbapedia: ["ja"],
    ex: "ex",
    letter: "",
    mega: "メガ",
    rocket: "ロケット団の*",
    regions: {
      Alolan: "アローラ*",
      Galarian: "ガラル*",
      Hisuian: "ヒスイ*",
      Paldean: "パルデア*",
      "Origin Forme": "オリジン*",
    },
    forms: {
      "Heat Rotom": "ヒートロトム",
      "Wash Rotom": "ウォッシュロトム",
      "Frost Rotom": "フロストロトム",
      "Fan Rotom": "スピンロトム",
      "Mow Rotom": "カットロトム",
      "Dusk Mane Necrozma": "ネクロズマ たそがれのたてがみ",
      "Dawn Wings Necrozma": "ネクロズマ あかつきのつばさ",
      "Ultra Necrozma": "ウルトラネクロズマ",
      "Teal Mask Ogerpon": "オーガポン みどりのめん",
      "Wellspring Mask Ogerpon": "オーガポン いどのめん",
      "Hearthflame Mask Ogerpon": "オーガポン かまどのめん",
      "Cornerstone Mask Ogerpon": "オーガポン いしずえのめん",
      "Castform Sunny Form": "ポワルン たいようのすがた",
      "Castform Rainy Form": "ポワルン あまみずのすがた",
      "Castform Snowy Form": "ポワルン ゆきぐものすがた",
      "Single Strike Urshifu": "いちげきウーラオス",
      "Rapid Strike Urshifu": "れんげきウーラオス",
    },
  },
  ko: {
    pokeApi: "3",
    bulbapedia: ["ko"],
    ex: " ex",
    letter: "",
    mega: "메가",
    rocket: "로켓단의 *",
    regions: {
      Alolan: "알로라*",
      Galarian: "가라르*",
      Hisuian: "히스이*",
      Paldean: "팔데아*",
      "Origin Forme": "오리진*",
    },
    forms: {
      "Heat Rotom": "히트로토무",
      "Wash Rotom": "워시로토무",
      "Frost Rotom": "프로스트로토무",
      "Fan Rotom": "스핀로토무",
      "Mow Rotom": "커트로토무",
      "Dusk Mane Necrozma": "네크로즈마 황혼의 갈기",
      "Dawn Wings Necrozma": "네크로즈마 새벽의 날개",
      "Ultra Necrozma": "울트라네크로즈마",
      "Teal Mask Ogerpon": "오거폰 벽록의 가면",
      "Wellspring Mask Ogerpon": "오거폰 우물의 가면",
      "Hearthflame Mask Ogerpon": "오거폰 화덕의 가면",
      "Cornerstone Mask Ogerpon": "오거폰 주춧돌의 가면",
      "Castform Sunny Form": "캐스퐁 태양의 모습",
      "Castform Rainy Form": "캐스퐁 빗방울의 모습",
      "Castform Snowy Form": "캐스퐁 설운의 모습",
      "Single Strike Urshifu": "일격우라오스",
      "Rapid Strike Urshifu": "연격우라오스",
    },
    // Not the name that their own romanization spells. The fossil is the one of the games (PokeAPI)
    wrong: {
      "Blue's Provocation": "그린의 도발",
      "Plume Fossil": "깃털화석",
      "Poké Mart Guy": "프렌들리숍 직원",
    },
  },
  // Brazilian
  pt: {
    tcgdex: { pocket: "pt-br", paper: "pt" },
    bulbapedia: ["pt_br"],
    ex: " ex",
    mega: "Mega ",
    rocket: "* da Equipe Rocket",
    regions: {
      Alolan: "* de Alola",
      Galarian: "* de Galar",
      Hisuian: "* de Hisui",
      Paldean: "* de Paldea",
      "Origin Forme": "* Forma Origem",
    },
    forms: { "Ultra Necrozma": "Ultra Necrozma" },
    // "Caeva Arcoíris": a typo, and no other source to correct it
    wrong: { "Rainbow Cave": undefined },
  },
  // Traditional
  zh: {
    pokeApi: "4",
    bulbapedia: ["zh_cmn"],
    ex: "ex",
    letter: "",
    mega: "超級",
    rocket: "火箭隊的*",
    regions: {
      Alolan: "阿羅拉 *",
      Galarian: "伽勒爾 *",
      Hisuian: "洗翠 *",
      Paldean: "帕底亞 *",
      "Origin Forme": "起源*",
    },
    forms: {
      "Heat Rotom": "加熱洛托姆",
      "Wash Rotom": "清洗洛托姆",
      "Frost Rotom": "結冰洛托姆",
      "Fan Rotom": "旋轉洛托姆",
      "Mow Rotom": "切割洛托姆",
      "Dusk Mane Necrozma": "奈克洛茲瑪 黃昏之鬃",
      "Dawn Wings Necrozma": "奈克洛茲瑪 拂曉之翼",
      "Ultra Necrozma": "究極奈克洛茲瑪",
      "Teal Mask Ogerpon": "厄鬼椪 碧草面具",
      "Wellspring Mask Ogerpon": "厄鬼椪 水井面具",
      "Hearthflame Mask Ogerpon": "厄鬼椪 火灶面具",
      "Cornerstone Mask Ogerpon": "厄鬼椪 礎石面具",
      "Castform Sunny Form": "飄浮泡泡 太陽的樣子",
      "Castform Rainy Form": "飄浮泡泡 雨水的樣子",
      "Castform Snowy Form": "飄浮泡泡 雪雲的樣子",
      "Single Strike Urshifu": "一擊武道熊師",
      "Rapid Strike Urshifu": "連擊武道熊師",
    },
  },
};

const lang = process.argv[2];
const rules = LANGUAGES[lang];
if (!rules) throw new Error(`Usage: bun ./scripts/translate.ts ${Object.keys(LANGUAGES).join("|")}`);

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
  // The Japanese cards write ポリゴンZ, the games ポリゴンＺ
  if (language === rules.pokeApi) {
    localSpecies.set(id, lang === "ja" ? name.replace(/[０-９Ａ-Ｚ]/g, (c) => c.normalize("NFKC")) : name);
  }
}

const translateSpecies = (english: string): string | undefined => {
  const id = englishSpecies.get(english);
  if (!id) return undefined;
  if (rules.pokeApi) return localSpecies.get(id);
  return pocketNames.get(english) ?? paperNames.get(english) ?? english;
};

const translatePokemon = (english: string): string | undefined => {
  const rocket = /^Team Rocket's (.+)$/.exec(key(english))?.[1];
  if (rocket) {
    const name = translatePokemon(rocket);
    return name && rules.rocket.replace("*", name);
  }
  const [, prefix, base, letter, ex] =
    /^(?:(Mega|Alolan|Galarian|Hisuian|Paldean|Origin Forme) )?(.+?)(?: ([XY]))?( ex)?$/.exec(key(english)) ?? [];
  const species = rules.forms?.[base] ?? translateSpecies(base);
  if (!species) return undefined;
  const name =
    prefix === "Mega"
      ? rules.mega + species
      : prefix
        ? rules.regions[prefix].replace("*", species)
        : species;
  return clean(name + (letter ? (rules.letter ?? " ") + letter : "") + (ex ? rules.ex : ""));
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

const none = new Map<string, string>();
const [pocketEnglish, pocketLocal, allEnglish, allLocal] = rules.tcgdex
  ? await Promise.all([
      pocketCards("en"),
      pocketCards(rules.tcgdex.pocket),
      allCards("en"),
      allCards(rules.tcgdex.paper),
    ])
  : [none, none, none, none];

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

// --- Bulbapedia: the Trainer cards, under the name of their first print, "Erika (Genetic Apex 219)"
const setNames = new Map(
  Object.values(sets)
    .flat()
    .map(({ code, name }) => [code, code.startsWith("PROMO-") ? `Promo-${code.at(-1)}` : key(name.en)]),
);
const pages = new Map<string, string>();
for (const card of cards) {
  if (isPokemon(card) || pages.has(key(card.name))) continue;
  pages.set(key(card.name), `${key(card.name)} (${setNames.get(card.set)} ${card.number})`);
}
const wikitexts = async (titles: string[]) => {
  const url = new URL("https://bulbapedia.bulbagarden.net/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    redirects: "1",
    format: "json",
    formatversion: "2",
    maxlag: "5",
    titles: titles.join("|"),
  }).toString();
  const { query } = await json(url.toString());
  const redirects = new Map<string, string>(
    [...(query.normalized ?? []), ...(query.redirects ?? [])].map(({ from, to }) => [from, to]),
  );
  const texts = new Map<string, string>(
    query.pages.map(({ title, revisions }: any) => [title, revisions?.[0].slots.main.content ?? ""]),
  );
  return titles.map((title) => {
    let page = title;
    while (redirects.has(page)) page = redirects.get(page)!;
    return texts.get(page) ?? "";
  });
};
const trainerNames: Names = new Map();
const trainers = [...pages];
for (let i = 0; i < trainers.length; i += 20) {
  const batch = trainers.slice(i, i + 20);
  const texts = await wikitexts(batch.map(([, title]) => title));
  batch.forEach(([english], index) => {
    const table = texts[index].split(/==\s*In other languages\s*==/)[1] ?? "";
    for (const code of rules.bulbapedia) {
      // |ja=かいの化石 ''Kai no Kaseki''
      const name = new RegExp(`^\\|\\s*${code}\\s*=(.*)$`, "m").exec(table)?.[1];
      if (!name || trainerNames.has(english)) continue;
      trainerNames.set(english, clean(name.replace(/<!--.*?-->/g, "").split("''")[0]));
    }
  });
}
for (const [english, name] of Object.entries(rules.wrong ?? {})) {
  if (name) trainerNames.set(english, name);
  else trainerNames.delete(english);
}

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
  trainerNames.get(key(card.name)) ??
  paperNames.get(key(card.name));

// --- The rules must give the names already known, whatever the source
if (rules.tcgdex) {
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
