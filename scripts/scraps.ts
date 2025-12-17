import fs from "node:fs";
import * as cheerio from "cheerio";
import rarityMap from "../dist/rarity.json";
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

  if (!Object.keys(rarityMap).includes(rarityCode)) {
    console.error(rarityCode + " is not declared");
  }

  const cardData = {
    set: hrefParts[1].toUpperCase(),
    number: parseInt(hrefParts[2]),
    rarity: rarityMap[rarityCode],
    rarityCode,
    imageName: imageName,
    label: {
      slug: hrefParts[3],
      eng: figcaption,
    },
    packs: packName ? [packName] : [],
  };

  const existingCard = cards.find(
    (card) => card.number === cardData.number && card.set === cardData.set
  );
  if (!existingCard) {
    cards.push(cardData);
  } else if (packName) {
    existingCard.packs.unshift(packName);
  }
});

fs.writeFileSync("./dist/cards.json", JSON.stringify(cards, null, 2));
fs.writeFileSync("./dist/cards.min.json", JSON.stringify(cards));

const sets = [...new Set(cards.map((card) => card.set))];

for (const set of sets) {
  const setCards = cards.filter((card) => card.set === set);

  for (let i = 1; i <= setCards.length; i++) {
    if (!setCards.find((card) => card.number === i)) {
      console.error(`Missing card number ${i} in set ${set}`);
    }
  }
}
