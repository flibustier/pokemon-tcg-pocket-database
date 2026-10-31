import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  statSync,
} from "fs";
import { extname, join } from "path";

import sets from "../dist/sets.json";
import allCards from "../dist/cards.json";
const IMAGE_DIRECTORY = "../dist/images";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "Sec-Fetch-Dest": "image",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isValidWebpBuffer = (buffer: Uint8Array): boolean => {
  if (buffer.length < 12) return false;
  const riff = String.fromCharCode(...buffer.subarray(0, 4));
  const webp = String.fromCharCode(...buffer.subarray(8, 12));
  return riff === "RIFF" && webp === "WEBP";
};

const isValidWebpFile = (filePath: string): boolean => {
  if (!existsSync(filePath)) return false;
  try {
    const stat = statSync(filePath);
    if (stat.size < 12) return false;
    const fd = openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    readSync(fd, buffer, 0, 12, 0);
    closeSync(fd);
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  } catch {
    return false;
  }
};

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

const downloadImage = async (card: Card, maxRetries = 3) => {
  const url = `${process.env.ASSETS_CARD_IMAGES_ENDPOINT}/${card.image}`;
  const path = imagePath(card);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetch(url, { headers: DEFAULT_HEADERS });
      if (!result.ok) {
        throw new Error(`HTTP ${result.status} ${result.statusText}`);
      }

      const contentType = result.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          `Received HTML instead of image (content-type: ${contentType})`,
        );
      }

      const arrayBuffer = await result.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      if (!isValidWebpBuffer(uint8)) {
        throw new Error("Downloaded data is not a valid WebP image");
      }

      await Bun.write(path, uint8);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(
        `[Attempt ${attempt}/${maxRetries}] Failed to download ${card.image} (${err}). Retrying...`,
      );
      await sleep(1000 * attempt);
    }
  }
};

const downloadSetImage = async (
  url: string,
  path: string,
  maxRetries = 3,
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetch(url, { headers: DEFAULT_HEADERS });
      if (!result.ok) {
        throw new Error(`HTTP ${result.status} ${result.statusText}`);
      }

      const contentType = result.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          `Received HTML instead of image (content-type: ${contentType})`,
        );
      }

      const arrayBuffer = await result.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      if (!isValidWebpBuffer(uint8)) {
        throw new Error("Downloaded data is not a valid WebP image");
      }

      await Bun.write(path, uint8);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(
        `[Attempt ${attempt}/${maxRetries}] Failed to download ${path} (${err}). Retrying...`,
      );
      await sleep(1000 * attempt);
    }
  }
};

const capitalize = (title: string) =>
  String(title).charAt(0).toUpperCase() + String(title).slice(1).toLowerCase();

const downloadImages = async () => {
  const cards = allCards.filter((card) => !isValidWebpFile(imagePath(card)));

  console.info(
    `Starting download of ${cards.length} images (out of ${allCards.length})`,
  );

  for await (const card of cards) {
    try {
      await downloadImage(card);
      console.log(`Downloaded ${card.image}`);
      await sleep(100);
    } catch (err) {
      console.error(`Failed to download ${card.image}: ${err}`);
    }
  }

  if (process.env.ASSETS_SET_IMAGES_ENDPOINT) {
    for (const set of Object.values(sets).flat()) {
      console.info(`Starting download of set ${set.code}`);
      for (const lang of LANGUAGES) {
        const setImageName = `LOGO_expansion_${
          set.code.startsWith("PROMO") || set.code.startsWith("SP")
            ? set.code
            : capitalize(set.code)
        }_${lang}.webp`;
        const path = join(__dirname, IMAGE_DIRECTORY, "sets", setImageName);
        if (!isValidWebpFile(path)) {
          try {
            await downloadSetImage(
              `${process.env.ASSETS_SET_IMAGES_ENDPOINT}/${setImageName}`,
              path,
            );
            console.log(`Downloaded ${setImageName}`);
            await sleep(100);
          } catch (err) {
            console.error(`Failed to download ${setImageName}: ${err}`);
          }
        }
      }
    }
  }

  // populate cards-by-set directory
  allCards.forEach((card) => {
    const src = imagePath(card);
    const dest = imageSecondaryPath(card);

    if (!isValidWebpFile(src)) {
      return;
    }

    if (!isValidWebpFile(dest)) {
      console.log(`Copying ${card.image} to ${dest}`);
      mkdirSync(join(__dirname, IMAGE_DIRECTORY, "cards-by-set", card.set), {
        recursive: true,
      });
      copyFileSync(src, dest);
    }
  });
};

downloadImages().catch(console.error);
