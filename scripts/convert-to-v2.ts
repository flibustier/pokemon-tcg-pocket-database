import fs from "node:fs";

import existing from "../dist/cards.json" with { type: "json" };

const cards = existing.map((card) => {
    const id = card.set + '-' + card.number;

  return {
    id,
    set: card.set,
    number: card.number,
    rarity: card.rarityCode,
    name: card.label.eng,
    image: card.imageName,
    ...(card.packs && card.packs.length > 0 ? { packs: card.packs } : {} ),
  }
})

fs.writeFileSync("./dist/cards.json", JSON.stringify(cards, null, 2));
fs.writeFileSync("./dist/cards.min.json", JSON.stringify(cards));

const sets = [...new Set(cards.map(({ set }) => set))];

for (const set of sets) {
  const setCards = cards.filter((card) => card.set === set);
  fs.writeFileSync(`./dist/cards/${set}.json`, JSON.stringify(setCards, null, 2));
  fs.writeFileSync(`./dist/cards/${set}.min.json`, JSON.stringify(setCards));
}
