# Changelog

## 2.0.0

Breaking changes!

### New card structure

```json
{
  "set": "B1",
  "number": 1,
  "rarity": "C",
  "name": "Pinsir",
  "image": "cPK_10_010830_00_KAILIOS_C.webp",
  "packs": ["Mega Blaziken"]
}
```

- replace `rarity` with previous `rarityCode` (the rarity label can be took in `rarities.json`)
- remove `label` field with `slug`, only use english name as `name` property
- `imageName` became `image`
- `packs` is present only when it has a value

> /!\ set name have been renamed to match the convention "A1a" instead of "A1A" (all uppercase), if you want to stick to the old one, just do an uppercase transformation

Cards could be retrieved from `dist/cards.json` (or the new minimized version `dist/cards.min.json`) to get the full list of cards, but now you can also cherry-pick the cards from a particular set :
`dist/cards/A1a.json` (or `dist/cards/A1a.min.json`)

### New set structure

```json
{
  "A": [
    {
      "code": "A1",
      "releaseDate": "2024-10-30",
      "count": 286,
      "name": {
        "en": "Genetic Apex"
      },
      "packs": ["Charizard", "Mewtwo", "Pikachu"]
    },
    …
  ],
  "B": [
    {
      "code": "B1",
      "releaseDate": "2025-10-30",
      "count": 331,
      "name": {
        "en": "Mega Rising"
      },
      "packs": ["Mega Altaria", "Mega Blaziken", "Mega Gyarados"]
    },
    …
  ]
}
```

`sets.json` is now an Object (`Record<string, Set[]>`), sets are grouped by Series ("A", "B"…).
If you don’t care of this feature, you can simply do a :

```ts
import sets from "pokemon-tcg-pocket-database/dist/sets.json" with { type: "json" };

const flattenSets = Object.values(sets).flat(); // will return a flat array of all sets
```

### New rarity informations

```json
{
  "C": {
    "label": "Common",
    "image": "diamond.webp",
    "count": 1,
    "group": "Diamond",
    "tradeable": true,
    "tradePrice": 0,
    "points": 35
  },
  ...
}
```

You can now have informations about cost to trade or image to render the rarity.

### New cards.extra.json

```json
[
  {
    "set": "PROMO-A",
    "number": 29,
    "name": "Blastoise",
    "rarity": "AR",
    "image": "cPK_90_000550_00_KAMEX_AR.webp",
    "packs": ["Vol. 3"],
    "element": "water",
    "type": "pokemon",
    "stage": 2,
    "health": 50,
    "retreatCost": 1,
    "weakness": "Lightning",
    "evolvesFrom": "Wartortle"
  },
  ...
]
```

Thanks to @KostasKrits you can now access more technical informations about cards!

Just use: `import cards from "pokemon-tcg-pocket-database/dist/cards.extra.json";`

### Embedded images

You can find cards images, rarity images, sets images, directly from:

- `dist/images/cards`
- `dist/images/rarities`
- `dist/images/sets`
