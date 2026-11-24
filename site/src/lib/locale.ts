// The language of card and set names, picked in the header and kept from a page to the next.
// Pages are built in English; the names are replaced in the browser.
import { logoUrl, url, type Names } from "./shared";

const KEY = "names-language";
const ENGLISH: Names = { sets: {}, cards: {} };

let current = { lang: "en", names: ENGLISH };
const listeners = new Set<(locale: typeof current) => void>();

/** Calls back now, and each time the language changes. */
export const onLocale = (listener: (locale: typeof current) => void) => {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
};

export const translate = (names: Names, name: string, id?: string) =>
  (id && names.cards[id]) || names.cards[name] || name;

const translateText = (el: HTMLElement, key: "cardName" | "setName") => {
  const english = (el.dataset.english ??= el.textContent?.trim() ?? "");
  const text =
    key === "cardName"
      ? translate(current.names, english, el.dataset.cardName)
      : (current.names.sets[el.dataset.setName!] ?? english);
  el.textContent = text;
  if (text === english) el.removeAttribute("lang");
  else el.lang = current.lang;
};

const translatePage = () => {
  for (const el of document.querySelectorAll<HTMLElement>("[data-card-name]"))
    translateText(el, "cardName");
  for (const el of document.querySelectorAll<HTMLElement>("[data-set-name]"))
    translateText(el, "setName");
  for (const el of document.querySelectorAll<HTMLImageElement>("[data-set-logo]"))
    el.src = logoUrl(el.dataset.setLogo!, current.lang);
};

const load = async (lang: string): Promise<Names> => {
  if (lang === "en") return ENGLISH;
  const response = await fetch(url(`/data/names/${lang}.json`));
  if (!response.ok) throw new Error(`names in ${lang}: ${response.status}`);
  return response.json();
};

let requested = "en";

export const setLanguage = async (lang: string) => {
  requested = lang;
  const names = await load(lang);
  // Another language was picked meanwhile
  if (requested !== lang) return;
  current = { lang, names };
  translatePage();
  for (const listener of listeners) listener(current);
};

export const savedLanguage = () => {
  try {
    return localStorage.getItem(KEY) ?? "en";
  } catch {
    return "en";
  }
};

export const saveLanguage = (lang: string) => {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // Private browsing: the language lasts for this page only
  }
};
