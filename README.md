# Pokemon Trading Card Game Pocket Cards Database 
[![npm version](https://badge.fury.io/js/pokemon-tcg-pocket-database.svg)](https://www.npmjs.com/package/pokemon-tcg-pocket-database)

## Overview

This npm package provides a database of Pokemon Trading Card Game Pocket cards. It includes two JSON files: `cards.json` and `sets.json`, which contain detailed information about the cards and sets, respectively.

## Installation

To install the package, use the following command:

```bash
npm install -D pokemon-tcg-pocket-database
```

## Usage

### Importing the Database

You can import the database into your project using the following code:

```js
import cards from "pokemon-tcg-pocket-database/dist/cards.json";
import sets from "pokemon-tcg-pocket-database/dist/sets.json";
```

### Accessing the Data

The `cards.json` file contains an array of card objects, each with the following properties:
- `set`: The set code of the card.
- `number`: The card number within the set.
- `rarity`: The rarity of the card.
- `rarityCode`: The rarity code of the card.
- `imageName`: The name of the card image file.
- `label`: An object containing the slug and English name of the card.

Rarity codes are as follows:
- C: "Common",
- U: "Uncommon",
- R: "Rare",
- RR: "Double Rare",
- SR: "Super Rare",
- AR: "Art Rare",
- SAR: "Special Art Rare",
- IM: "Immersive Rare",
- UR: "Crown Rare",

