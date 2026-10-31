import { normalizeText } from "@/lib/search";
import type { CatalogFilters, SortValue } from "@/lib/catalog-params";
import type { CatalogItem } from "@/lib/types";

type Skip = "cat" | "tag" | "price" | "q";

/** Palabras de la búsqueda: todas deben aparecer (en cualquier orden, parciales). */
export function tokenize(q: string) {
  return normalizeText(q).split(/\s+/).filter(Boolean).slice(0, 6);
}

function matches(item: CatalogItem, f: CatalogFilters, tokens: string[], skip?: Skip) {
  if (skip !== "cat" && f.cat.length && !(item.category && f.cat.includes(item.category.slug))) return false;
  if (skip !== "tag" && f.tag.length && !item.tags.some((t) => f.tag.includes(t))) return false;
  if (skip !== "price") {
    if (f.min != null && item.price < f.min) return false;
    if (f.max != null && item.price > f.max) return false;
  }
  if (skip !== "q" && tokens.some((t) => !item.search.includes(t))) return false;
  return true;
}

const sorters: Record<SortValue, (a: CatalogItem, b: CatalogItem) => number> = {
  nuevo: (a, b) => b.created_at.localeCompare(a.created_at),
  popular: (a, b) =>
    b.sold_count - a.sold_count ||
    Number(b.is_featured) - Number(a.is_featured) ||
    b.created_at.localeCompare(a.created_at),
  "precio-asc": (a, b) => a.price - b.price,
  "precio-desc": (a, b) => b.price - a.price,
};

export function runCatalog(items: CatalogItem[], f: CatalogFilters) {
  const tokens = tokenize(f.q);
  return items.filter((i) => matches(i, f, tokens)).sort((a, b) => sorters[f.sort](a, b) || a.id.localeCompare(b.id));
}

/**
 * Cuántos resultados daría cada opción si se eligiera, respetando los DEMÁS filtros.
 * Así el usuario nunca elige algo que lo deja en cero sin saberlo.
 */
export function facetCounts(items: CatalogItem[], f: CatalogFilters) {
  const tokens = tokenize(f.q);
  const cat: Record<string, number> = {};
  const tag: Record<string, number> = {};
  let catTotal = 0;

  for (const i of items) {
    if (matches(i, f, tokens, "cat")) {
      catTotal++;
      if (i.category) cat[i.category.slug] = (cat[i.category.slug] ?? 0) + 1;
    }
    if (matches(i, f, tokens, "tag")) for (const t of i.tags) tag[t] = (tag[t] ?? 0) + 1;
  }
  return { cat, tag, catTotal };
}

/** Todas las etiquetas existentes, de más a menos usadas (para que el panel no salte). */
export function allTags(items: CatalogItem[]) {
  const counts = new Map<string, number>();
  for (const i of items) for (const t of i.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")).map(([t]) => t);
}

/** Límites del slider de precio, redondeados al paso. */
export function priceBounds(items: CatalogItem[]): { lo: number; hi: number; step: number } | null {
  if (!items.length) return null;
  const prices = items.map((i) => i.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const step = max - min > 2000 ? 50 : max - min > 400 ? 10 : 5;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  return hi - lo >= step * 2 ? { lo, hi, step } : null;
}
