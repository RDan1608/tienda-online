"use client";

import { useCallback, useDeferredValue, useMemo } from "react";
import { useQueryStates } from "nuqs";
import { catalogParsers, type CatalogFilters } from "@/lib/catalog-params";

export type Patch = { [K in keyof CatalogFilters]?: CatalogFilters[K] | null };

/**
 * Estado de los filtros en la URL, pero SIN ir al servidor: `shallow` actualiza la URL en el
 * navegador y el filtrado se calcula aquí, al instante. `replace` evita llenar el historial.
 */
export function useCatalogFilters() {
  const [raw, setRaw] = useQueryStates(catalogParsers, { shallow: true, history: "replace" });

  // La búsqueda se difiere un instante: escribir nunca se traba aunque haya muchos productos.
  const q = useDeferredValue(raw.q);
  const filters = useMemo<CatalogFilters>(() => ({ ...raw, q }), [raw, q]);

  // Cualquier cambio de filtro vuelve a la primera página.
  const update = useCallback((patch: Patch) => setRaw({ ...patch, page: null }), [setRaw]);
  const clear = useCallback(() => update({ q: null, cat: null, tag: null, min: null, max: null }), [update]);
  const setPage = useCallback((page: number) => setRaw({ page }), [setRaw]);

  return { filters, search: raw.q, update, clear, setPage };
}

export type CatalogApi = ReturnType<typeof useCatalogFilters>;
