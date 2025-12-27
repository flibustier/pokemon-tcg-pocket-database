# Pokemon Trading Card Game Pocket Cards Database

[![npm version](https://badge.fury.io/js/pokemon-tcg-pocket-database.svg#)](https://www.npmjs.com/package/pokemon-tcg-pocket-database)

> You’re consulting the v2 of this dataset. If you wish to see older version of this README, please refer to the [v1 branch](https://github.com/flibustier/pokemon-tcg-pocket-database/tree/v1). Please refer to the [changelog](https://github.com/flibustier/pokemon-tcg-pocket-database/blob/main/CHANGELOG.md#2.0.0) for the migration guide.

## Overview

This npm package provides a database of Pokemon Trading Card Game Pocket cards and sets (Pokemon TCG Pocket).
It includes multiples JSON files: 
- `cards.json` which contains [basic informations](#cards) about the cards,
- `cards.extra.json` which contains [detailed informations](#cards-extra) about the cards,
- `sets.json` which contains all sets grouped by Series (A, B, …),
- `rarities.json` for informations about [rarity codes](#rarities) and cost,
- `pullRates.json` for informations with all statistics about the pull rates of the cards. 

Cards are also available as sets separated JSON files in `cards/` folder (e.g. `dist/cards/A1a.json` or `dist/cards/A1a.min.json`).

## Installation

To install the package, use the following command:

```bash
npm install -D pokemon-tcg-pocket-database
```

Or you can using it as an API :

### GitHub API

Latest version :

```url
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards.min.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards.extra.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/sets.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/rarities.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/pullRates.json
```

For a specific set, like `B1a` :

```url
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards/B1a.json
```

Minified version (save bandwidth) :

```url
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/main/dist/cards/B1a.min.json
```

With a specific version number, like `1.3.0` (see [Releases page](https://github.com/flibustier/pokemon-tcg-pocket-database/releases)) :

```url
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/refs/tags/1.3.0/dist/cards.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/refs/tags/1.3.0/dist/sets.json
https://raw.githubusercontent.com/flibustier/pokemon-tcg-pocket-database/refs/tags/1.3.0/dist/rarity.json
```

### JSDelivr

To avoid rate limits, you can use the JSDelivr CDN :

```url
https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/cards.json
```

Or with specific version number, like `1.14.0` :

```url
https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database@1.14.0/dist/cards.json
```

## Usage

### Importing the Database

You can import the database into your project using the following code:

```js
import sets from "pokemon-tcg-pocket-database/dist/sets.json";
import cards from "pokemon-tcg-pocket-database/dist/cards.json";
import rarities from "pokemon-tcg-pocket-database/dist/rarities.json";
```

### Accessing the Data

#### Cards

The `cards.json` file contains an array of card objects, each with the following properties:

- `set`: The set code of the card.
- `number`: The card number within the set.
- `name`: English name of the card.
- `rarity`: The rarity code of the card (see [rarities.json](#rarities) for labels).
- `image`: The name of the card image file (more details in [images](#images)).
- `packs`: An array of packs where the card can be found.

#### Cards Extra

The `cards.extra.json` file contains an array of card objects, each with the following properties:

- `set`: The set code of the card.
- `number`: The card number within the set.
- `name`: English name of the card.
- `rarity`: The rarity code of the card (see [rarities.json](#rarities) for labels).
- `image`: The name of the card image file (more details in [images](#images)).
- `element`: The element type of the card (e.g., "fire", "water", "grass", "lightning", "psychic", "fighting", "darkness", "metal", "fairy", "dragon", "colorless").
- `type`: The type of the card (e.g., "pokemon", "trainer", "energy").
- `stage`: The stage of the card (e.g., "basic", "stage1", "stage2", "ex", "mega").
- `health`: The health points of the card (if applicable).
- `retreatCost`: The retreat cost of the card (if applicable).
- `weakness`: The weakness of the card (if applicable).
- `goodWith`: When supported, an array of elements that the card is good with (ex. "grass").

#### Rarities

The file `rarities.json` contains :

- `label` (see bellow),
- `image`: The image name of the rarity illustration (like "diamond.webp"),
- `count`: Number of times the image is repeated,
- `group`: Helper to group rarities (ex. "Diamond" category),
- `tradeable`: `true` or `false`, if trade is allowed for this rarity,
- `tradePrice`: Price in shine dust for trading this rarity,
- `points`: Booster points required to craft this card from the booster shop.

Rarity labels are as follows :

- `C`: `Common`,
- `U`: `Uncommon`,
- `R`: `Rare`,
- `RR`: `Double Rare`,
- `SR`: `Super Rare`,
- `AR`: `Art Rare`,
- `SAR`: `Special Art Rare`,
- `IM`: `Immersive Rare`,
- `UR`: `Crown Rare`,

#### Sets

The file `sets.json` is not an array, but an object with Series names as keys, and arrays of sets as values :

```json
{
  "A": [...],
  "B": [...]
}
```

If you want a flat array of sets, you can use `Object.values(sets).flat()` in JavaScript.

Each set object contains :

- `code`: Set code (like "A1"),
- `releaseDate`: Release date of the set,
- `count`: Number of cards in the set,
- `name`: Set name in different languages (Object with language codes as keys, Names as values),
- `packs`: List of packs in the set (Array of strings).

### Example

Here is an example of a card object (`cards.json`):

```json
{
  "set": "A1",
  "number": 1,
  "rarity": "C",
  "image": "cPK_10_000010_00_FUSHIGIDANE_C.webp",
  "name": "Bulbasaur",
  "packs": ["Mewtwo"]
}
```

Here is an example of a card extra object (`cards.extra.json`):

```json
{
  "set": "PROMO-B",
  "number": 11,
  "name": "Eevee",
  "rarity": "R",
  "image": "cPK_90_012660_00_EIEVUI_R.webp",
  "element": "colorless",
  "type": "pokemon",
  "stage": "basic",
  "health": 50,
  "retreatCost": 1,
  "weakness": "fire"
}
```

Here is an example of a set object (`sets.json`):

```json
{
  "code": "A1",
  "releaseDate": "2024-10-30",
  "count": 286,
  "name": {
    "en": "Genetic Apex",
    "fr": "Puissance Génétique",
    "de": "Unschlagbare Gene",
    "zh": "最強的基因",
    "pt": "Dominação Genética",
    "es": "Genes Formidables",
    "it": "Geni Supremi",
    "ja": "最強の遺伝子",
    "ko": "최강의유전자"
  },
  "packs": ["Charizard", "Mewtwo", "Pikachu"]
}
```

### Images 

If you’re looking for images, you can find them [here](https://github.com/flibustier/pokemon-tcg-exchange/tree/main/public/images/cards) or in [latest release](https://github.com/flibustier/pokemon-tcg-pocket-database/releases/).

### Roadmap

- [ ] Add German language (de_DE)
- [ ] Add Spanish language (es_ES)
- [ ] Add French language (fr_FR)
- [ ] Add Italian language (it_IT)
- [ ] Add Japanese language (ja_JP)
- [ ] Add Korean language (ko_KR)
- [ ] Add Portuguese language (pt_BR)
- [ ] Add Chinese language (zh_TW)

Contributions are welcome! If you have any suggestions or improvements, feel free to open an issue or submit a pull request.
