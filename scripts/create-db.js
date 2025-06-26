import fs from "node:fs";
import * as cheerio from "cheerio";
import rarityMap from "../dist/rarity.json" with { type: "json" };
import existing from "../dist/cards.json" with { type: "json" };

const html = fs.readFileSync("./scraps.html", "utf8");

const $ = cheerio.load(html);
const cards = [...existing];

const packName = process.argv[2];

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
    packs: [packName]
  };

  cards.push(cardData);
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