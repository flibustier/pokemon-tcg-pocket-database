import fs from "node:fs";
import * as cheerio from "cheerio";
import rarityMap from "../dist/rarities.json";
import existing from "../dist/cards.json";

if (process.argv.length < 3) {
  console.log("Usage: bun ./scripts/scraps.ts [URL] ([packName])");
  console.log(
    `Example: bun ./scripts/scraps.ts "https://…/b1a" "Crimson Blaze"`
  );

  process.exit(1);
}

const url = process.argv[2] || "";
const packName = process.argv[3];

console.log(`Scraping URL ${url}...`);
const response = await fetch(url);

const html = await response.text();

const $ = cheerio.load(html);
const cards = [...existing];

$(".card-grid__cell").each((index, element) => {
  const $card = $(element);
  const hrefParts = $card.find("a").attr("href").split("/").filter(Boolean);
  const imgSrc = $card.find("img").attr("src");
  const figcaption = $card.find("figcaption").text().trim();

  // Extract image name from URL
  const imageName = imgSrc.split("/CardPreviews/")[1].split("?")[0];

  // Extract rarity code from image name
  const rarityCode = imageName.split("_").pop().split(".")[0];

  const cardData = {
    set: hrefParts[1].toUpperCase(),
    number: parseInt(hrefParts[2]),
    rarity: rarityCode,
    image: imageName,
    name: figcaption,
    packs: packName ? [packName] : [],
  };

  const existingCard = cards.find(
    (card) => card.number === cardData.number && card.set === cardData.set
  );
  if (!existingCard) {
    const lastSameSetIndex = cards.findLastIndex(
      (card) => card.set === cardData.set
    );
    if (lastSameSetIndex === -1) {
      cards.push(cardData);
    } else {
      cards.splice(lastSameSetIndex + 1, 0, cardData);
    }
  } else if (packName) {
    existingCard.packs.unshift(packName);
  }
});

fs.writeFileSync("./dist/cards.json", JSON.stringify(cards, null, 2));
fs.writeFileSync("./dist/cards.min.json", JSON.stringify(cards));

const sets = [...new Set(cards.map(({ set }) => set))];

for (const set of sets) {
  const setCards = cards.filter((card) => card.set === set);
  fs.writeFileSync(`./dist/cards/${set}.json`, JSON.stringify(setCards, null, 2));
  fs.writeFileSync(`./dist/cards/${set}.min.json`, JSON.stringify(setCards));
}
