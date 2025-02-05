import fs from "node:fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("./scraps.html", "utf8");

const $ = cheerio.load(html);
const cards = [];

$(".card-grid__cell").each((index, element) => {
  const $card = $(element);
  const hrefParts = $card.find("a").attr("href").split("/").filter(Boolean);
  const imgSrc = $card.find("img").attr("src");
  const figcaption = $card.find("figcaption").text().trim();

  // Extract image name from URL
  const imageName = imgSrc.split("/CardPreviews/")[1].split("?")[0];

  // Extract rarity code from image name
  const rarityCode = imageName.split("_").pop().split(".")[0];
  const rarityMap = {
    C: "Common",
    U: "Uncommon",
    R: "Rare",
    RR: "Double Rare",
    SR: "Super Rare",
    AR: "Art Rare",
    SAR: "Special Art Rare",
    IM: "Immersive Rare",
    UR: "Crown Rare",
  };

  if (!Object.keys(rarityMap).includes(rarityCode )) {
    console.error(rarityCode + " is not declared")
  }

  const cardData = {
    set: hrefParts[1].toUpperCase(),
    number: hrefParts[2],
    rarity: rarityMap[rarityCode],
    rarityCode,
    imageName: imageName,
    label: {
      slug: hrefParts[3],
      eng: figcaption,
    },
  };

  cards.push(cardData);
});

const result = JSON.stringify(cards, null, 2);

fs.writeFileSync("dist/cards.json", result);

const sets = [...new Set(cards.map((card) => card.set))];

fs.writeFileSync("dist/sets.json", JSON.stringify(sets, null, 2));