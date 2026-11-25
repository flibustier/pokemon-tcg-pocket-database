// The page of a set on pokemon-tcg.exchange. A new set has none until that site is updated: its
// sitemap tells which are there, and their list always is.
const LIST = "https://pokemon-tcg.exchange/sets/";

const response = await fetch("https://pokemon-tcg.exchange/sitemap.xml", {
  signal: AbortSignal.timeout(10_000),
}).catch(() => undefined);
const sitemap = response?.ok ? await response.text() : "";
if (!sitemap.includes(LIST)) console.warn(`No sitemap of pokemon-tcg.exchange: cards link to ${LIST}`);

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const exchangeUrl = (englishName: string) => {
  const page = LIST + slug(englishName);
  return sitemap.includes(`<loc>${page}</loc>`) ? page : LIST;
};
