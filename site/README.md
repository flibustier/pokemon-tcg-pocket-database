# Website

The site of the database: all the sets and cards of `../dist`, on <https://flibustier.github.io/pokemon-tcg-pocket-database/>.

GitHub Pages serves the `gh-pages` branch, which only holds the built pages. `.github/workflows/pages.yml` builds it again each time `dist/` or `site/` changes on `main`.

Built with [Astro](https://astro.build), and a [Vue](https://vuejs.org) island for the card explorer.

```sh
bun install
bun run dev
bun run check # types
bun run build # every page, in dist/
```

- Data is read from `../dist` when building. A new set needs no change here, and neither does a new `cards.xx.json` language: add its name to `LANGUAGES` in `src/lib/shared.ts` if it is not there.
- Set logos, packs and rarities come from `../dist/images`, through links in `public/images`.
- Card images are not in this repository, they come from `cdn.pokemon-tcg.exchange`.
