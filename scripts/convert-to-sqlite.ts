import { Database } from "bun:sqlite";

import cards from "../dist/cards.json";
import sets from "../dist/sets.json";

// Create a new SQLite database
const db = new Database("dist/ptcgp.db");

// Create tables
// Create tables
db.run(`CREATE TABLE IF NOT EXISTS sets (
  code TEXT PRIMARY KEY,
  name TEXT,
  release_date TEXT,
  count INTEGER,
  packs TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  number INTEGER,
  rarity TEXT,
  rarity_code TEXT,
  name TEXT,
  slug TEXT,
  image TEXT,
  set_code TEXT,
  FOREIGN KEY (set_code) REFERENCES sets(id)
)`);

const insertSet = db.query(
  "INSERT OR REPLACE INTO sets (code, name, release_date, count, packs) VALUES ($code, $name, $releaseDate, $count, $packs) "
);

for (const set of sets) {
  insertSet.run({
    $code: set.code,
    $name: set.label.en,
    $releaseDate: set.releaseDate,
    $count: set.count,
    $packs: JSON.stringify(set.packs),
  } as any);
}

// Insert data into cards table
const insertCard = db.query(
  "INSERT OR REPLACE INTO cards (id, number, rarity, rarity_code, name, slug, image, set_code) VALUES ($id, $number, $rarity, $rarityCode, $name, $slug, $image, $setCode)"
);
for (const card of cards) {
  insertCard.run({
    $id: card.set + "-" + card.number,
    $number: card.number,
    $rarity: card.rarity,
    $rarityCode: card.rarityCode,
    $name: card.label.eng,
    $slug: card.label.slug,
    $image: card.imageName,
    $setCode: card.set,
  });
}

// Close the database connection
db.close();
