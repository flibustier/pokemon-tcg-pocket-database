import { existsSync } from "fs";
import { join } from "path";

import sets from "../dist/sets.json";
import allCards from "../dist/cards.json";
const IMAGE_DIRECTORY = "../dist/images";

const LANGUAGES = [
  "en_US",
  "fr_FR",
  "es_ES",
  "de_DE",
  "it_IT",
  "pt_BR",
  "ja_JP",
  "ko_KR",
  "zh_TW",
];

interface Card {
  imageName: string;
}

const imagePath = (card: Card) =>
  join(__dirname, IMAGE_DIRECTORY, "cards", card.imageName);

const downloadImage = async (card: Card) => {
  const result = await fetch(
    process.env.ASSETS_CARD_IMAGES_ENDPOINT + "/" + card.imageName
  );
  const path = imagePath(card);
  await Bun.write(path, result);
};

const capitalize = (title: string) =>
  String(title).charAt(0).toUpperCase() + String(title).slice(1).toLowerCase();

const downloadImages = async () => {
  const cards = (allCards as Card[]).filter(
    (card) => !existsSync(imagePath(card))
  );

  console.info(
    `Starting download of ${cards.length} images (out of ${allCards.length})`
  );

  for await (const card of cards) {
    try {
      await downloadImage(card);
      console.log(`Downloaded ${card.imageName}`);
    } catch (err) {
      console.error(`Failed to download ${card.imageName}: ${err}`);
    }
  }

  if (process.env.ASSETS_SET_IMAGES_ENDPOINT) {
    for (const set of sets) {
      console.info(`Starting download of set ${set.code}`);
      for (const lang of LANGUAGES) {
        const setImageName = `LOGO_expansion_${
          set.code === "PROMO-A" ? set.code : capitalize(set.code)
        }_${lang}.webp`;
        const path = join(__dirname, IMAGE_DIRECTORY, "sets", setImageName);
        if (!existsSync(path)) {
          const result = await fetch(
            process.env.ASSETS_SET_IMAGES_ENDPOINT + "/" + setImageName
          );
          await Bun.write(path, result);
          console.log(`Downloaded ${setImageName}`);
        }
      }
    }
  }
};

downloadImages().catch(console.error);
