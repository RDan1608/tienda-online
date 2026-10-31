import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const PAGE_SIZE = 12;

export const sortOptions = [
  { value: "nuevo", label: "Más nuevos" },
  { value: "popular", label: "Más vendidos" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

// El estado de los filtros vive en la URL (links compartibles) y se lee en el navegador.
export const catalogParsers = {
  q: parseAsString.withDefault(""),
  cat: parseAsArrayOf(parseAsString).withDefault([]),
  tag: parseAsArrayOf(parseAsString).withDefault([]),
  min: parseAsInteger,
  max: parseAsInteger,
  sort: parseAsStringLiteral(sortOptions.map((o) => o.value)).withDefault("nuevo"),
  page: parseAsInteger.withDefault(1),
};

export type CatalogFilters = {
  q: string;
  cat: string[];
  tag: string[];
  min: number | null;
  max: number | null;
  sort: SortValue;
  page: number;
};
