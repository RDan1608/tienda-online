"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { PAGE_SIZE, sortOptions, type SortValue } from "@/lib/catalog-params";
import { allTags, facetCounts, priceBounds, runCatalog } from "@/lib/catalog-filter";
import { useFlip } from "@/lib/use-flip";
import type { CatalogItem, Category } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { FilterPanel } from "./filter-panel";
import { FilterSheet } from "./filter-sheet";
import { useCatalogFilters, type CatalogApi } from "./use-catalog-filters";

const lps = (n: number) => `L ${n.toLocaleString("es-HN")}`;

const chip = (active: boolean, disabled = false) =>
  `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out active:scale-95 ${
    active
      ? "border-navy bg-navy text-ivory"
      : disabled
        ? "border-border bg-surface opacity-40"
        : "border-border bg-surface hover:border-steel"
  }`;

export function CatalogClient({ items, categories }: { items: CatalogItem[]; categories: Category[] }) {
  const api = useCatalogFilters();
  const { filters, update } = api;
  const [sheetOpen, setSheetOpen] = useState(false);
  const grid = useRef<HTMLDivElement>(null);

  // Todo se calcula aquí, en memoria: cambiar un filtro no toca la red.
  const results = useMemo(() => runCatalog(items, filters), [items, filters]);
  const facets = useMemo(() => facetCounts(items, filters), [items, filters]);
  const tags = useMemo(() => allTags(items), [items]);
  const bounds = useMemo(() => priceBounds(items), [items]);

  const page = Math.min(Math.max(filters.page, 1), 20);
  const visible = results.slice(0, page * PAGE_SIZE);
  useFlip(grid, visible.map((p) => p.id).join());

  const priceActive = filters.min != null || filters.max != null;
  const activeCount = filters.tag.length + (priceActive ? 1 : 0);
  const total = results.length;
  const countLabel = `${total} ${total === 1 ? "producto" : "productos"}`;

  const panel = <FilterPanel api={api} bounds={bounds} tags={tags} tagCounts={facets.tag} />;

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2">
          <SearchBox api={api} />
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="relative inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium transition hover:border-steel active:scale-95 lg:hidden"
          >
            <SlidersHorizontal className="size-[18px]" />
            <span className="max-sm:sr-only">Filtros</span>
            {activeCount > 0 && (
              <span className="pill-in grid size-5 place-items-center rounded-full bg-navy text-[11px] text-ivory">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <div
          role="group"
          aria-label="Categorías"
          className="-mx-4 flex scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <button
            type="button"
            onClick={() => update({ cat: null })}
            aria-pressed={filters.cat.length === 0}
            className={chip(filters.cat.length === 0)}
          >
            Todo
            <span className={`text-xs tabular-nums ${filters.cat.length === 0 ? "text-ivory/70" : "text-muted"}`}>
              {facets.catTotal}
            </span>
          </button>
          {categories.map((c) => {
            const active = filters.cat.includes(c.slug);
            const count = facets.cat[c.slug] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                disabled={count === 0 && !active}
                onClick={() =>
                  update({ cat: active ? filters.cat.filter((s) => s !== c.slug) : [...filters.cat, c.slug] })
                }
                className={chip(active, count === 0 && !active)}
              >
                {active && <Check className="pill-in size-3.5" />}
                {c.name}
                <span className={`text-xs tabular-nums ${active ? "text-ivory/70" : "text-muted"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm tabular-nums text-muted" aria-live="polite">
              {countLabel}
            </p>
            <ActivePills api={api} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted max-sm:sr-only">Ordenar</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortValue })}
              className="h-10 rounded-full border border-border bg-surface px-4 pr-8 text-sm outline-none transition-colors hover:border-steel focus:border-steel"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 gap-10 lg:grid lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24">{panel}</div>
        </aside>

        <div className="min-h-[50vh]">
          {total > 0 ? (
            <>
              <h2 className="sr-only">Productos</h2>
              <div ref={grid} className="relative grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
                {visible.map((p, i) => (
                  <div key={p.id} data-flip={p.id} className="card-in" style={{ "--i": i % PAGE_SIZE } as React.CSSProperties}>
                    <ProductCard product={p} priority={i < 4} />
                  </div>
                ))}
              </div>
              {visible.length < total && (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() => api.setPage(page + 1)}
                    className="inline-flex h-12 items-center rounded-full border border-border px-8 text-sm font-medium transition hover:border-steel active:scale-95"
                  >
                    Ver más ({total - visible.length})
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyResults api={api} />
          )}
        </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtros"
        actionLabel={total > 0 ? `Ver ${countLabel}` : "Sin resultados"}
      >
        {panel}
      </FilterSheet>
    </>
  );
}

function SearchBox({ api }: { api: CatalogApi }) {
  const ref = useRef<HTMLInputElement>(null);
  const { search, update } = api;

  return (
    <label className="relative flex-1">
      <span className="sr-only">Buscar productos</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        id="buscar"
        type="search"
        autoFocus={typeof window !== "undefined" && window.location.hash === "#buscar"}
        value={search}
        onChange={(e) => update({ q: e.target.value || null })}
        onKeyDown={(e) => e.key === "Escape" && search && update({ q: null })}
        placeholder="Buscar aretes, peluches, llaveros…"
        className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-11 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-steel focus:ring-4 focus:ring-powder"
      />
      {search && (
        <button
          type="button"
          onClick={() => {
            update({ q: null });
            ref.current?.focus();
          }}
          aria-label="Borrar búsqueda"
          className="pill-in absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-powder hover:text-navy active:scale-90"
        >
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}

function pills(api: CatalogApi) {
  const { filters, update } = api;
  const list: { key: string; label: string; clear: () => void }[] = [];

  if (filters.q) list.push({ key: "q", label: `“${filters.q}”`, clear: () => update({ q: null }) });
  if (filters.min != null || filters.max != null) {
    const label =
      filters.min != null && filters.max != null
        ? `${lps(filters.min)} – ${lps(filters.max)}`
        : filters.min != null
          ? `Desde ${lps(filters.min)}`
          : `Hasta ${lps(filters.max!)}`;
    list.push({ key: "price", label, clear: () => update({ min: null, max: null }) });
  }
  for (const t of filters.tag) {
    list.push({ key: `t-${t}`, label: t, clear: () => update({ tag: filters.tag.filter((x) => x !== t) }) });
  }
  return list;
}

function ActivePills({ api }: { api: CatalogApi }) {
  const list = pills(api);
  if (!list.length) return null;

  return (
    <>
      {list.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={p.clear}
          aria-label={`Quitar filtro ${p.label}`}
          className="pill-in inline-flex h-8 items-center gap-1 rounded-full bg-powder px-3 text-xs capitalize transition active:scale-95 hover:bg-dusty/60"
        >
          {p.label}
          <X className="size-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={api.clear}
        className="pill-in text-xs text-muted underline underline-offset-4 transition-colors hover:text-navy"
      >
        Limpiar todo
      </button>
    </>
  );
}

function EmptyResults({ api }: { api: CatalogApi }) {
  const list = pills(api);
  return (
    <div className="card-in rounded-3xl bg-powder/50 px-6 py-14 text-center">
      <p className="font-serif text-2xl">No encontramos productos</p>
      <p className="mt-2 text-sm text-muted">
        {list.length ? "Prueba quitando alguno de estos filtros:" : "Aún no hay productos en esta categoría."}
      </p>
      {list.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {list.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={p.clear}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ivory px-4 text-sm capitalize transition active:scale-95 hover:ring-1 hover:ring-steel"
            >
              <X className="size-3.5" /> {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={api.clear}
            className="inline-flex h-10 items-center rounded-full bg-navy px-5 text-sm text-ivory transition active:scale-95"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
