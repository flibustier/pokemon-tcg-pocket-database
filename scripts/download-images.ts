import { copyFileSync, existsSync, mkdirSync } from "fs";
import { extname, join } from "path";

import sets from "../dist/sets.json";
import allCards from "../dist/cards.json";
const IMAGE_DIRECTORY = "../dist/images";

const LANGUAGES = [
  "en_US",
  /*
  "fr_FR",
  "es_ES",
  "de_DE",
  "it_IT",
  "pt_BR",
  "ja_JP",
  "ko_KR",
  "zh_TW",
  */
];

interface Card {
  image: string;
  set: string;
  number: number;
}

const imagePath = (card: Card) =>
  join(__dirname, IMAGE_DIRECTORY, "cards", card.image);

const imageSecondaryPath = (card: Card) =>
  join(
    __dirname,
    IMAGE_DIRECTORY,
    "cards-by-set",
    card.set,
    card.number.toString() + extname(card.image),
  );

const downloadImage = async (card: Card) => {
  const result = await fetch(
    process.env.ASSETS_CARD_IMAGES_ENDPOINT + "/" + card.image,
  );
  const path = imagePath(card);
  await Bun.write(path, result);
};

const capitalize = (title: string) =>
  String(title).charAt(0).toUpperCase() + String(title).slice(1).toLowerCase();

const downloadImages = async () => {
  const cards = allCards.filter((card) => !existsSync(imagePath(card)));

  console.info(
    `Starting download of ${cards.length} images (out of ${allCards.length})`,
  );

  for await (const card of cards) {
    try {
      await downloadImage(card);
      console.log(`Downloaded ${card.image}`);
    } catch (err) {
      console.error(`Failed to download ${card.image}: ${err}`);
    }
  }

  if (process.env.ASSETS_SET_IMAGES_ENDPOINT) {
    for (const set of Object.values(sets).flat()) {
      console.info(`Starting download of set ${set.code}`);
      for (const lang of LANGUAGES) {
        const setImageName = `LOGO_expansion_${
          set.code.startsWith("PROMO") || set.code.startsWith("SP") ? set.code : capitalize(set.code)
        }_${lang}.webp`;
        const path = join(__dirname, IMAGE_DIRECTORY, "sets", setImageName);
        if (!existsSync(path)) {
          const result = await fetch(
            process.env.ASSETS_SET_IMAGES_ENDPOINT + "/" + setImageName,
          );
          await Bun.write(path, result);
          console.log(`Downloaded ${setImageName}`);
        }
      }
    }
  }

  // populate cards-by-set directory
  allCards.forEach((card) => {
    if (!existsSync(imageSecondaryPath(card))) {
      console.log(`Copying ${card.image} to ${imageSecondaryPath(card)}`);
      mkdirSync(join(__dirname, IMAGE_DIRECTORY, "cards-by-set", card.set), {
        recursive: true,
      });
      copyFileSync(imagePath(card), imageSecondaryPath(card));
    }
  });
};

downloadImages().catch(console.error);
