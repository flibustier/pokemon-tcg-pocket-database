import fs from "node:fs/promises";
import cards from "../dist/cards.json";
import sets from "../dist/sets.json";

type SetsResponse = { query: { categorymembers: { pageid: number }[] } };
type PageResponse = { parse: { wikitext: string } };

async function apiRequest<T>(params: Record<string, string>): Promise<T> {
  const url = new URL("/api.php", "https://www.pokewiki.de");
  for (const name in params) {
    url.searchParams.append(name, params[name]);
  }
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const response = await fetch(url);
  return response.json() as T;
}

console.log("Fetching all sets...");
const setsResponse = await apiRequest<SetsResponse>({
  action: "query",
  list: "categorymembers",
  cmtitle: "Kategorie:Erweiterung_im_Pokémon-Sammelkartenspiel-Pocket",
  cmlimit: "max",
});

function matchRegex(string: string, regExp: RegExp): string | undefined {
  const regExpExecArray = new RegExp(regExp, "im").exec(string);
  if (!regExpExecArray) return undefined;
  return regExpExecArray.at(1);
}

const nameDeRegExp = /^\|name=(.*?)$/;
const setRegExp = /^\|kürzel=(.*?)$/;
const cardRegExp = /^{{Setzeile\|(?<number>.*?)\|(?<name>.*?)\|/gm;

console.log("Processing sets...");
await Promise.allSettled(
  setsResponse.query.categorymembers.map(async (page) => {
    const { parse: { wikitext } } = await apiRequest<PageResponse>({
      action: "parse",
      pageid: page.pageid.toString(),
      prop: "wikitext",
    });
    const setNameDe = matchRegex(wikitext, nameDeRegExp);
    let setCode = matchRegex(wikitext, setRegExp);
    if (setCode?.startsWith("P-")) setCode = "PROMO-" + setCode.at(2);
    const setMatch = Object.values(sets).flat().find((set) =>
      set.code === setCode
    );
    if (setMatch && setNameDe) setMatch.name.de = setNameDe;
    wikitext.matchAll(cardRegExp).forEach((r) => {
      let cardName = r.groups?.name;
      if (!cardName) return;
if (cardName.startsWith("Mega-")) {
        cardName = cardName.replace(/^Mega-/, "Mega ");
      }
      if (cardName.endsWith("-ex")) {
        cardName = cardName.replace(/-ex$/, " ex");
      }
      const cardNumber = Number(r.groups?.number);
      const match = cards.find((card) =>
        card.set === setCode && card.number === cardNumber
      );
      if (!match) {
        console.warn(setCode, cardNumber);
        return;
      }
      match.name = cardName;
    });
  }),
);

console.log("Generating/Updating dist/cards.de.json...");
await fs.writeFile(
  "./dist/cards.de.json",
  JSON.stringify(cards, null, 2) + "\n",
);
console.log("Updating dist/sets.json...");
await fs.writeFile(
  "./dist/sets.json",
  JSON.stringify(sets, null, 2) + "\n",
);
console.log("Done! ✅");
