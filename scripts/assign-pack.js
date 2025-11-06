import fs from "node:fs";
import * as cheerio from "cheerio";
import rarityMap from "../dist/rarity.json" with { type: "json" };
import existing from "../dist/cards.json" with { type: "json" };
import existingSets from "../dist/sets.json" with { type: "json" };

const html = fs.readFileSync("./scraps.html", "utf8");

const $ = cheerio.load(html);
const cards = [...existing];

if (process.argv.length < 3) {
console.log(`Usage: node assign-pack.js [PACK_NAME]`);

process.exit(1);
}

const packName = process.argv[2];

if (!Object.values(existingSets).find((set) => set.packs.includes(packName))) {
    console.error(`Pack ${packName} not found in any set`);
    process.exit(1);
}

$(".card-grid__cell").each((index, element) => {
  const $card = $(element);
  const hrefParts = $card.find("a").attr("href").split("/").filter(Boolean);
  const imgSrc = $card.find("img").attr("src");
  const figcaption = $card.find("figcaption").text().trim();

  // Extract image name from URL
  const imageName = imgSrc.split("/CardPreviews/")[1].split("?")[0];

  // Extract rarity code from image name
  const rarityCode = imageName.split("_").pop().split(".")[0];

  if (!Object.keys(rarityMap).includes(rarityCode )) {
    console.error(rarityCode + " is not declared")
  }

  const cardData = cards.find((card) => card.set === hrefParts[1].toUpperCase() && card.number === parseInt(hrefParts[2]));

  if (cardData) {
    if (!cardData.packs) {
        cardData.packs = [packName];
    } else if (!cardData.packs.includes(packName)) {
        cardData.packs.push(packName);
    } 
  } else {
    console.error(`Card not found: ${hrefParts[1].toUpperCase()} ${hrefParts[2]} ${figcaption}`);
  }
});

const result = JSON.stringify(cards, null, 2);

fs.writeFileSync("./dist/cards.json", result);

const sets = [...new Set(cards.map((card) => card.set))];

for (const set of sets) {
  const setCards = cards.filter((card) => card.set === set);

  for (let i = 1; i <= setCards.length; i++) {
    if (!setCards.find((card) => card.number === i)) {
      console.error(`Missing card number ${i} in set ${set}`);
    }
  }
}