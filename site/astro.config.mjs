import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";

export default defineConfig({
  site: "https://cards.pokemon-tcg.exchange",
  trailingSlash: "always",
  integrations: [vue(), sitemap()],
  vite: {
    // The data is read from ../dist, outside of the site
    server: { fs: { allow: [".."] } },
  },
});
