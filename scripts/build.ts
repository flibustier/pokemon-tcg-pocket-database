import fs from "node:fs";
import mainCards from "../dist/cards.json";
import frCards from "../dist/cards.fr.json";

type Card = (typeof mainCards)[number];

function generateAllCardsVariation(
  cardsVariation: Card[],
  languageCode?: string,
) {
  console.log(
    "Generating all cards variations for language " +
      (languageCode || "english (default)") +
      "...",
  );

  // fix empty packs
  const cards = cardsVariation.map((card) => ({
    ...card,
    packs: (card.packs?.length || 0) > 0 ? card.packs : undefined,
  }));

  const cardsWithoutImage = cards.map(({ image, ...rest }) => rest);

  const filename = languageCode ? `cards.${languageCode}` : "cards";

  //fs.writeFileSync(`./dist/${filename}.json`, JSON.stringify(cards, null, 2));
  fs.writeFileSync(`./dist/${filename}.min.json`, JSON.stringify(cards));
  fs.writeFileSync(
    `./dist/${filename}.no-image.min.json`,
    JSON.stringify(cardsWithoutImage),
  );

  const sets = [...new Set(cards.map(({ set }) => set))];

  const directory = languageCode
    ? `./dist/cards/${languageCode}`
    : "./dist/cards";
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  for (const set of sets) {
    const setCards = cards.filter((card) => card.set === set);
    const setCardsWithoutImage = setCards.map(({ image, ...rest }) => rest);
    fs.writeFileSync(
      `${directory}/${set}.json`,
      JSON.stringify(setCards, null, 2),
    );
    fs.writeFileSync(`${directory}/${set}.min.json`, JSON.stringify(setCards));
    fs.writeFileSync(
      `${directory}/${set}.no-image.min.json`,
      JSON.stringify(setCardsWithoutImage),
    );
  }
}

generateAllCardsVariation(mainCards);
generateAllCardsVariation(frCards, "fr");

console.log("Done! ✅");
