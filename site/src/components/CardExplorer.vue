<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { onLocale, translate } from "../lib/locale";
import {
  cardId,
  cardUrl,
  capitalize,
  ELEMENTS,
  formatNumber,
  rarityRank,
  STAGES,
  thumbnailUrl,
  TYPES,
  unpack,
  url,
  type Card,
  type Names,
  type PackedCard,
  type Rarity,
} from "../lib/shared";
import ElementIcon from "./ElementIcon.vue";
import RaritySymbol from "./RaritySymbol.vue";

interface SetOption {
  code: string;
  series: string;
  name: string;
  releaseDate: string;
}

const props = defineProps<{
  /** JSON of the first cards, or of all the cards of a set. */
  initial: string;
  /** How many cards there are in all. The others are loaded in the browser. */
  total: number;
  rarities: Record<string, Rarity>;
  /** The sets to pick from. None on the page of a set. */
  sets?: SetOption[];
  packs?: string[];
}>();

const PAGE = 60;
const SORTS: Record<string, string> = {
  number: "Set and number",
  newest: "Newest set first",
  name: "Name",
  rarity: "Rarest first",
  health: "Highest HP first",
};

const cards = shallowRef<Card[]>((JSON.parse(props.initial) as PackedCard[]).map(unpack));
const isComplete = computed(() => cards.value.length >= props.total);
const hasFailed = ref(false);

const empty = () => ({
  q: "",
  set: "",
  pack: "",
  type: "",
  stage: "",
  sort: "number",
  view: "grid",
  element: [] as string[],
  rarity: [] as string[],
});
const filters = reactive(empty());

const locale = shallowRef<{ lang: string; names: Names }>({
  lang: "en",
  names: { sets: {}, cards: {} },
});
const nameOf = (card: Card) => translate(locale.value.names, card.name, cardId(card));
const setName = (set: SetOption) => locale.value.names.sets[set.code] ?? set.name;

// "Flabébé" is found by "flabebe"
const simplify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’']/g, "'")
    .toLowerCase();

const haystacks = computed(
  () =>
    new Map(
      cards.value.map((card) => [
        card,
        simplify(`${nameOf(card)} ${card.name} ${card.set}-${card.number}`),
      ]),
    ),
);

const words = computed(() => simplify(filters.q).split(/\s+/).filter(Boolean));

const matchesSearch = (card: Card) =>
  words.value.every(
    (word) =>
      // "25" is the card number, not a part of A1-125
      (/^\d+$/.test(word) ? card.number === Number(word) : haystacks.value.get(card)!.includes(word)) ||
      (/^\d+$/.test(word) && simplify(nameOf(card)).includes(word)),
  );

const rarityOrder = Object.keys(props.rarities);
const ranks = new Map(Object.entries(props.rarities).map(([code, rarity]) => [code, rarityRank(rarity)]));
// Sets released on the same day stay in the order of sets.json
const newestFirst = new Map(
  props.sets
    ?.toSorted((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .map(({ code }, i) => [code, i]),
);

const sorted = (list: Card[]) => {
  switch (filters.sort) {
    case "newest":
      return list.toSorted((a, b) => (newestFirst.get(a.set) ?? 0) - (newestFirst.get(b.set) ?? 0));
    case "name":
      return list.toSorted((a, b) => nameOf(a).localeCompare(nameOf(b), locale.value.lang));
    case "rarity":
      return list.toSorted((a, b) => {
        const [rankA, rankB] = [ranks.get(a.rarity) ?? 0, ranks.get(b.rarity) ?? 0];
        // Two infinities do not subtract to zero
        return rankA === rankB ? 0 : rankB > rankA ? 1 : -1;
      });
    case "health":
      return list.toSorted((a, b) => (b.health ?? 0) - (a.health ?? 0));
    default:
      return list;
  }
};

const found = computed(() =>
  sorted(
    cards.value.filter(
      (card) =>
        (!filters.set || card.set === filters.set) &&
        (!filters.pack || card.packs.includes(filters.pack)) &&
        (!filters.type || card.type === filters.type) &&
        (!filters.stage || card.stage === filters.stage) &&
        (!filters.element.length || filters.element.includes(card.element ?? "")) &&
        (!filters.rarity.length || filters.rarity.includes(card.rarity)) &&
        matchesSearch(card),
    ),
  ),
);

const isFiltered = computed(
  () =>
    !!(filters.q || filters.set || filters.pack || filters.type || filters.stage) ||
    filters.element.length + filters.rarity.length > 0,
);

const limit = ref(PAGE);
const shown = computed(() => found.value.slice(0, limit.value));

const countLabel = computed(() => {
  if (!isComplete.value && isFiltered.value) return "Searching…";
  const count = isComplete.value ? found.value.length : props.total;
  return `${formatNumber(count)} ${count === 1 ? "card" : "cards"}`;
});

// Only what this list has: the cards of a set do not have all the rarities
const available = <K extends "rarity" | "element" | "type" | "stage">(key: K, order: readonly string[]) =>
  computed(() => {
    if (!isComplete.value) return order;
    const values = new Set(cards.value.map((card) => card[key]));
    return order.filter((value) => values.has(value));
  });
const elements = available("element", ELEMENTS);
const rarityCodes = available("rarity", rarityOrder);
const types = available("type", Object.keys(TYPES));
const stages = available("stage", Object.keys(STAGES));

const setsBySeries = computed(() => [...Map.groupBy(props.sets ?? [], ({ series }) => series)]);

const packsOfSet = computed(() => {
  if (props.packs) return props.packs.length > 1 ? props.packs : [];
  if (!filters.set || !isComplete.value) return [];
  const packs = new Set(
    cards.value.filter(({ set }) => set === filters.set).flatMap(({ packs }) => packs),
  );
  return packs.size > 1 ? [...packs] : [];
});

const toggle = (list: string[], value: string) => {
  const index = list.indexOf(value);
  if (index < 0) list.push(value);
  else list.splice(index, 1);
};

const reset = () => Object.assign(filters, empty(), { sort: filters.sort, view: filters.view });

// The filters are kept in the address, to share a search or come back to it
const readAddress = () => {
  const params = new URLSearchParams(location.search);
  const list = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  const sort = params.get("sort") ?? "";
  Object.assign(filters, empty(), {
    q: params.get("q") ?? "",
    set: params.get("set") ?? "",
    pack: params.get("pack") ?? "",
    type: params.get("type") ?? "",
    stage: params.get("stage") ?? "",
    sort: sort in SORTS ? sort : "number",
    view: params.get("view") === "list" ? "list" : "grid",
    element: list("element"),
    rarity: list("rarity"),
  });
};

const writeAddress = () => {
  const params = new URLSearchParams();
  const defaults = empty();
  for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
    const value = String(filters[key]);
    if (value && value !== String(defaults[key])) params.set(key, value);
  }
  const query = params.toString();
  history.replaceState(history.state, "", query ? `?${query}` : location.pathname);
};

const sentinel = ref<HTMLElement>();
let observer: IntersectionObserver | undefined;
let stopLocale: (() => void) | undefined;

const load = async () => {
  hasFailed.value = false;
  try {
    const response = await fetch(url("/data/cards.json"));
    if (!response.ok) throw new Error(String(response.status));
    cards.value = ((await response.json()) as PackedCard[]).map(unpack);
  } catch (error) {
    console.error(error);
    hasFailed.value = true;
  }
};

onMounted(() => {
  readAddress();
  watch(
    () => filters.set,
    () => (filters.pack = ""),
  );
  watch(filters, () => {
    limit.value = PAGE;
    writeAddress();
  });
  stopLocale = onLocale((value) => (locale.value = value));
  if (!isComplete.value) load();

  // Observed again after each page: when it is still in view, there is no new intersection
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && limit.value < found.value.length) limit.value += PAGE;
    },
    { rootMargin: "1200px" },
  );
  watch(
    [shown, sentinel],
    () => {
      if (!sentinel.value) return;
      observer!.disconnect();
      observer!.observe(sentinel.value);
    },
    { immediate: true, flush: "post" },
  );
});

onBeforeUnmount(() => {
  observer?.disconnect();
  stopLocale?.();
});
</script>

<template>
  <section class="explorer" aria-label="Cards">
    <form class="filters" role="search" @submit.prevent>
      <div class="row">
        <label class="search">
          <span class="visually-hidden">Search by name or number</span>
          <input
            v-model="filters.q"
            class="field"
            type="search"
            placeholder="Name or number, like “pikachu” or “A1-96”"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
        <label v-if="sets">
          <span class="visually-hidden">Set</span>
          <select v-model="filters.set" class="field">
            <option value="">All sets</option>
            <optgroup
              v-for="[series, list] in setsBySeries"
              :key="series"
              :label="series.length === 1 ? `Series ${series}` : series"
            >
              <option v-for="set in list" :key="set.code" :value="set.code">
                {{ set.code }} · {{ setName(set) }}
              </option>
            </optgroup>
          </select>
        </label>
        <label v-if="packsOfSet.length">
          <span class="visually-hidden">Pack</span>
          <select v-model="filters.pack" class="field">
            <option value="">All packs</option>
            <option v-for="name in packsOfSet" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <label>
          <span class="visually-hidden">Type</span>
          <select v-model="filters.type" class="field">
            <option value="">All types</option>
            <option v-for="type in types" :key="type" :value="type">{{ TYPES[type] }}</option>
          </select>
        </label>
        <label>
          <span class="visually-hidden">Stage</span>
          <select v-model="filters.stage" class="field">
            <option value="">All stages</option>
            <option v-for="stage in stages" :key="stage" :value="stage">{{ STAGES[stage] }}</option>
          </select>
        </label>
      </div>

      <div class="row">
        <div class="chips" role="group" aria-label="Element">
          <button
            v-for="element in elements"
            :key="element"
            type="button"
            class="chip round"
            :aria-pressed="filters.element.includes(element)"
            @click="toggle(filters.element, element)"
          >
            <ElementIcon :element="element" />
          </button>
        </div>
        <div class="chips" role="group" aria-label="Rarity">
          <button
            v-for="code in rarityCodes"
            :key="code"
            type="button"
            class="chip"
            :aria-pressed="filters.rarity.includes(code)"
            @click="toggle(filters.rarity, code)"
          >
            <span v-if="code === 'SAR'" class="mono" aria-hidden="true">SAR</span>
            <RaritySymbol :rarity="rarities[code]!" />
          </button>
        </div>
      </div>
    </form>

    <div class="status">
      <p aria-live="polite"><strong>{{ countLabel }}</strong></p>
      <button v-if="isFiltered" type="button" class="link" @click="reset">Clear filters</button>
      <label class="sort">
        <span class="visually-hidden">Sort by</span>
        <select v-model="filters.sort" class="field">
          <template v-for="(label, key) in SORTS" :key="key">
            <option v-if="sets || key !== 'newest'" :value="key">{{ label }}</option>
          </template>
        </select>
      </label>
      <div class="views" role="group" aria-label="View">
        <button
          v-for="view in ['grid', 'list']"
          :key="view"
          type="button"
          class="chip"
          :aria-pressed="filters.view === view"
          @click="filters.view = view"
        >
          {{ capitalize(view) }}
        </button>
      </div>
    </div>

    <p v-if="hasFailed" class="message" role="alert">
      The cards could not be loaded.
      <button type="button" class="link" @click="load">Try again</button>
    </p>
    <p v-else-if="isComplete && !found.length" class="message">
      No card matches these filters.
      <button type="button" class="link" @click="reset">Clear filters</button>
    </p>

    <ul v-if="filters.view === 'grid'" class="grid">
      <li v-for="card in shown" :key="cardId(card)">
        <a :href="cardUrl(card)" data-card-link>
          <img
            class="card-image"
            :src="thumbnailUrl(card)"
            alt=""
            width="208"
            height="290"
            loading="lazy"
            decoding="async"
          />
          <span class="caption">
            <span class="name" :lang="locale.lang">{{ nameOf(card) }}</span>
            <span class="meta">
              <span class="mono muted">{{ sets ? `${card.set} ${card.number}` : card.number }}</span>
              <RaritySymbol :rarity="rarities[card.rarity]!" />
            </span>
          </span>
        </a>
      </li>
    </ul>

    <div v-else class="table">
      <table>
        <thead>
          <tr>
            <th scope="col">Number</th>
            <th scope="col">Name</th>
            <th scope="col">Rarity</th>
            <th scope="col">Element</th>
            <th scope="col">Type</th>
            <th scope="col">Stage</th>
            <th scope="col" class="numeric">HP</th>
            <th scope="col">Weakness</th>
            <th scope="col" class="numeric">Retreat</th>
            <th scope="col">Packs</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="card in shown" :key="cardId(card)">
            <td class="mono muted">{{ card.set }} {{ card.number }}</td>
            <th scope="row">
              <a :href="cardUrl(card)" :lang="locale.lang">{{ nameOf(card) }}</a>
            </th>
            <td><RaritySymbol :rarity="rarities[card.rarity]!" /></td>
            <td><ElementIcon v-if="card.element" :element="card.element" /></td>
            <td>{{ TYPES[card.type] ?? capitalize(card.type) }}</td>
            <td>{{ card.stage && STAGES[card.stage] }}</td>
            <td class="numeric">{{ card.health }}</td>
            <td><ElementIcon v-if="card.weakness" :element="card.weakness" /></td>
            <td class="numeric">{{ card.retreatCost }}</td>
            <td class="muted">{{ card.packs.join(", ") }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div ref="sentinel" class="sentinel" aria-hidden="true"></div>
  </section>
</template>

<style scoped>
.filters {
  display: grid;
  gap: 0.75rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.row > label {
  min-width: 0;
}
.search {
  flex: 1 1 20rem;
}
.search input {
  width: 100%;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.chips + .chips {
  margin-left: auto;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 2.25rem;
  padding: 0 0.7rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: none;
  cursor: pointer;
}
.chip.round {
  width: 2.25rem;
  padding: 0;
  justify-content: center;
}
.chip:hover {
  border-color: var(--line-strong);
}
.chip[aria-pressed="true"] {
  background: var(--raised);
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}
.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  margin: 1.75rem 0 1.25rem;
}
.sort {
  margin-left: auto;
}
.views {
  display: flex;
  gap: 0.375rem;
}
.link {
  padding: 0;
  border: 0;
  background: none;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}
.message {
  padding: 3rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 1.75rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.grid a {
  display: block;
  text-decoration: none;
}
.grid .card-image {
  transition: translate 0.15s ease-out, box-shadow 0.15s ease-out;
}
.grid a:hover .card-image {
  translate: 0 -4px;
  box-shadow: 0 10px 24px var(--shadow);
}
@media (prefers-reduced-motion: reduce) {
  .grid .card-image {
    transition: none;
  }
}
.caption {
  display: grid;
  gap: 0.15rem;
  padding: 0.6rem 0.15rem 0;
}
.name {
  font-weight: 600;
  line-height: 1.2;
}
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.table {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}
th,
td {
  padding: 0.45rem 1rem 0.45rem 0;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
thead th {
  font-weight: 500;
  color: var(--muted);
}
tbody th {
  font-weight: 600;
}
.numeric {
  text-align: right;
  padding-right: 2rem;
}
td:last-child {
  white-space: normal;
  min-width: 12rem;
  padding-right: 0;
}
.sentinel {
  height: 1px;
}

@media (max-width: 40rem) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(5.75rem, 1fr));
    gap: 1.25rem 0.75rem;
  }
  .chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin-inline: calc(-1 * var(--gutter));
    padding: 2px var(--gutter);
    width: 100vw;
    scrollbar-width: none;
  }
  .chips + .chips {
    margin-left: calc(-1 * var(--gutter));
  }
  .chip {
    flex: none;
  }
  .row > label:not(.search) {
    flex: 1 1 40%;
  }
  .row select {
    width: 100%;
  }
}
</style>
