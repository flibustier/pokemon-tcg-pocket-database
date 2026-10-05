import fs from "node:fs";
import * as cheerio from "cheerio";
import prettier from "prettier";
import existing from "../dist/cards.json";

console.log("Usage: bun ./scripts/scraps.ts [URL] ([packName])");
console.log(`Example: bun ./scripts/scraps.ts "https://…/b1a" "Crimson Blaze"`);

const cards = existing.map((card) => ({
  ...card,
  packs: card.packs?.length > 0 ? card.packs : undefined,
}));

if (process.argv.length > 2) {
  const url = process.argv[2] || "";
  const packName = process.argv[3];

  let html = "";

  if (url === "scraps") {
    console.log("Using scraps.html...");
    html = fs.readFileSync("./scraps.html", "utf-8");
  } else {
    console.log(`Scraping URL ${url}...`);
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    html = await response.text();
  }

  const $ = cheerio.load(html);

  $(".card-grid__cell").each((index, element) => {
    const $card = $(element);
    const href = $card.find("a").attr("href") || "";
    const hrefParts = href.split("/").filter(Boolean);
    const imgSrc =
      $card.find("img").attr("src") ||
      $card.find("img").attr("data-src") ||
      $card.find("img").attr("data-original") ||
      "";
    const figcaption = $card.find("figcaption").text().trim();

    if (!imgSrc || hrefParts.length < 3) {
      return;
    }

    // Extract raw filename from URL (ignoring query parameters)
    const rawFileName = imgSrc.split("/").pop()?.split("?")[0] || "";
    const dotParts = rawFileName.split(".");
    const ext = dotParts.length > 1 ? dotParts[dotParts.length - 1] : "webp";
    const baseName = dotParts[0];

    // Reconstruct clean image name and extract rarity code
    const imageName = `${baseName}.${ext}`;
    const rarityCode = baseName.split("_").pop() || "";

    let set = hrefParts[1];
    if (set.toUpperCase().startsWith("PROMO")) {
      set = set.toUpperCase();
    } else {
      const [firstLetter, ...rest] = set.split("");
      set = firstLetter.toUpperCase() + rest.join("");
    }

    const cardData = {
      set,
      number: parseInt(hrefParts[2]),
      rarity: rarityCode,
      image: imageName,
      name: figcaption,
      packs: packName ? [packName] : [],
    };

    const existingCard = cards.find(
      (card) => card.number === cardData.number && card.set === cardData.set,
    );
    if (!existingCard) {
      const nextCardIndex = cards.findIndex(
        (card) => card.set === cardData.set && card.number > cardData.number,
      );
      if (nextCardIndex !== -1) {
        cards.splice(nextCardIndex, 0, cardData);
      } else {
        const lastSameSetIndex = cards.findLastIndex(
          (card) => card.set === cardData.set,
        );
        if (lastSameSetIndex === -1) {
          cards.push(cardData);
        } else {
          cards.splice(lastSameSetIndex + 1, 0, cardData);
        }
      }
    } else if (packName) {
      if (!existingCard.packs) {
        existingCard.packs = [packName];
      } else if (!existingCard.packs.includes(packName)) {
        existingCard.packs.unshift(packName);
      }
    }
  });
}

const setOrder = [...new Set(cards.map(({ set }) => set))];
const setIndexMap = new Map(setOrder.map((s, i) => [s, i]));

cards.sort((a, b) => {
  const setDiff = (setIndexMap.get(a.set) ?? 0) - (setIndexMap.get(b.set) ?? 0);
  if (setDiff !== 0) return setDiff;
  return a.number - b.number;
});

const cardsWithoutImage = cards.map(({ image, ...rest }) => rest);

const prettierOptions = await prettier.resolveConfig("./dist/cards.json");
const formattedCards = await prettier.format(JSON.stringify(cards), {
  ...prettierOptions,
  parser: "json",
});

fs.writeFileSync("./dist/cards.json", formattedCards);
fs.writeFileSync("./dist/cards.min.json", JSON.stringify(cards));
fs.writeFileSync(
  "./dist/cards.no-image.min.json",
  JSON.stringify(cardsWithoutImage),
);

const sets = [...new Set(cards.map(({ set }) => set))];

for (const set of sets) {
  const setCards = cards.filter((card) => card.set === set);
  const setCardsWithoutImage = setCards.map(({ image, ...rest }) => rest);
  fs.writeFileSync(
    `./dist/cards/${set}.json`,
    JSON.stringify(setCards, null, 2),
  );
  fs.writeFileSync(`./dist/cards/${set}.min.json`, JSON.stringify(setCards));
  fs.writeFileSync(
    `./dist/cards/${set}.no-image.min.json`,
    JSON.stringify(setCardsWithoutImage),
  );
}
