import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const sortOptions = [
  { value: "nuevo", label: "Más nuevos" },
  { value: "popular", label: "Más vendidos" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

// Compartido entre servidor (lectura) y cliente (useQueryStates).
export const catalogParsers = {
  q: parseAsString.withDefault(""),
  cat: parseAsArrayOf(parseAsString).withDefault([]),
  tag: parseAsArrayOf(parseAsString).withDefault([]),
  min: parseAsInteger,
  max: parseAsInteger,
  sort: parseAsStringLiteral(sortOptions.map((o) => o.value)).withDefault("nuevo"),
  page: parseAsInteger.withDefault(1),
};

export const loadCatalogParams = createLoader(catalogParsers);

export type CatalogFilters = {
  q: string;
  cat: string[];
  tag: string[];
  min: number | null;
  max: number | null;
  sort: SortValue;
  page: number;
};

export const priceRanges = [
  { label: "Hasta L 200", min: null, max: 200 },
  { label: "L 200 – 500", min: 200, max: 500 },
  { label: "L 500 – 1,000", min: 500, max: 1000 },
  { label: "Más de L 1,000", min: 1000, max: null },
] as const;
