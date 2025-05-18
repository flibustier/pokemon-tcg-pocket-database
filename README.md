# Pokemon Trading Card Game Pocket Cards Database

[![npm version](https://badge.fury.io/js/pokemon-tcg-pocket-database.svg#)](https://www.npmjs.com/package/pokemon-tcg-pocket-database)

## Overview

This npm package provides a database of Pokemon Trading Card Game Pocket cards and sets (Pokemon TCG Pocket). 
It includes three JSON files: `cards.json`, `sets.json` and `rarity.json` which contain detailed information about the cards and sets, respectively.

## Installation

To install the package, use the following command:

```bash
npm install -D pokemon-tcg-pocket-database
```

## Usage

### Importing the Database

You can import the database into your project using the following code:

```js
import sets from "pokemon-tcg-pocket-database/dist/sets.json";
import cards from "pokemon-tcg-pocket-database/dist/cards.json";
import rarity from "pokemon-tcg-pocket-database/dist/rarity.json";
```

### Accessing the Data

The `cards.json` file contains an array of card objects, each with the following properties:

- `set`: The set code of the card.
- `number`: The card number within the set.
- `rarity`: The rarity of the card.
- `rarityCode`: The rarity code of the card.
- `imageName`: The name of the card image file.
- `label`: An object containing the slug and English name of the card.
- `packs`: An array of packs where the card can be found.

Rarity codes are as follows (use `rarity.json` for this mapping):

- C: "Common",
- U: "Uncommon",
- R: "Rare",
- RR: "Double Rare",
- SR: "Super Rare",
- AR: "Art Rare",
- SAR: "Special Art Rare",
- IM: "Immersive Rare",
- UR: "Crown Rare",

### Example

Here is an example of a card object (`cards.json`):

```json
{
  "set": "A1",
  "number": 1,
  "rarity": "Common",
  "rarityCode": "C",
  "imageName": "cPK_10_000010_00_FUSHIGIDANE_C.webp",
  "label": {
    "slug": "bulbasaur",
    "eng": "Bulbasaur"
  },
  "packs": ["Mewtwo"]
}
```

Here is an example of a set object (`sets.json`):

```json
{
  "code": "A3",
  "releaseDate": "2025-04-30",
  "count": 239,
  "label": {
    "en": "Celestial Guardians"
  },
  "packs": ["Lunala", "Solgaleo"]
}
```

If you’re looking for images, you can find them [here](https://github.com/flibustier/pokemon-tcg-exchange/tree/main/public/images/cards) or in [latest release](https://github.com/flibustier/pokemon-tcg-pocket-database/releases/).

### Roadmap

- [ ] Add Japanese language (ja_JP)
- [ ] Add Chinese language (zh_TW)
- [ ] Add Korean languase (ko_KR)
- [ ] Add French language (fr_FR)
- [ ] Add Italian language (it_IT)
- [ ] Add Spanish language (es_ES)
- [ ] Add German language (de_DE)

Contributions are welcome! If you have any suggestions or improvements, feel free to open an issue or submit a pull request.
