"use client";

import { useEffect, useRef, useTransition } from "react";
import { debounce, useQueryStates } from "nuqs";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { catalogParsers, priceRanges, sortOptions, type SortValue } from "@/lib/catalog-params";
import { formatPrice } from "@/lib/format";
import type { Category } from "@/lib/types";

type Facets = { categories: Category[]; tags: { tag: string; count: number }[] };


function useFilters() {
  const [isPending, startTransition] = useTransition();
  // shallow: false → el servidor vuelve a renderizar los resultados.
  const [filters, setFilters] = useQueryStates(catalogParsers, {
    shallow: false,
    startTransition,
  });
  // Cualquier cambio de filtro vuelve a la primera página.
  type Patch = { [K in keyof typeof filters]?: (typeof filters)[K] | null };
  const update = (patch: Patch, opts?: Parameters<typeof setFilters>[1]) =>
    setFilters({ ...patch, page: null }, opts);
  return { filters, update, isPending };
}

type FiltersApi = ReturnType<typeof useFilters>;

/** Envuelve barra de filtros + resultados; atenúa resultados mientras carga. */
export function CatalogShell({
  categories,
  tags,
  total,
  children,
}: Facets & { total: number; children: React.ReactNode }) {
  const api = useFilters();
  const facets = { categories, tags };

  return (
    <>
      <Toolbar api={api} facets={facets} total={total} />
      <div className="mt-8 gap-10 lg:grid lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <FilterPanel api={api} facets={facets} />
        </aside>
        <div
          className={`transition-opacity duration-200 ${api.isPending ? "opacity-50" : ""}`}
          aria-busy={api.isPending}
        >
          {children}
        </div>
      </div>
    </>
  );
}

function Toolbar({ api, facets, total }: { api: FiltersApi; facets: Facets; total: number }) {
  const { filters, update } = api;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // El ícono de búsqueda del header lleva a /catalogo#buscar.
  useEffect(() => {
    if (window.location.hash === "#buscar") searchRef.current?.focus();
  }, []);

  const activeCount =
    filters.tag.length + (filters.min != null || filters.max != null ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar productos</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            id="buscar"
            type="search"
            value={filters.q}
            onChange={(e) =>
              update({ q: e.target.value || null }, { limitUrlUpdates: debounce(350) })
            }
            placeholder="Buscar aretes, peluches, llaveros…"
            className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-steel focus:ring-4 focus:ring-powder"
          />
        </label>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="relative inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium transition hover:border-steel lg:hidden"
        >
          <SlidersHorizontal className="size-[18px]" />
          <span className="max-sm:sr-only">Filtros</span>
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-navy text-[11px] text-ivory">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <CategoryChips api={api} categories={facets.categories} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted" aria-live="polite">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
          <ActiveFilters api={api} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted max-sm:sr-only">Ordenar</span>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortValue })}
            className="h-10 rounded-full border border-border bg-surface px-4 pr-8 text-sm outline-none focus:border-steel"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Filtros"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-ivory p-0 text-navy backdrop:bg-navy/30 backdrop:backdrop-blur-[2px] open:animate-[sheet-in_.25s_ease-out] lg:hidden"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-ivory px-5 py-4">
          <p className="font-serif text-2xl font-medium">Filtros</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="grid size-10 place-items-center rounded-full hover:bg-powder"
            aria-label="Cerrar filtros"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 py-5">
          <FilterPanel api={api} facets={facets} />
        </div>
        <div className="sticky bottom-0 border-t border-border bg-ivory p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-12 w-full rounded-full bg-navy text-sm font-medium text-ivory"
          >
            Ver {total} {total === 1 ? "producto" : "productos"}
          </button>
        </div>
      </dialog>
    </div>
  );
}

function CategoryChips({ api, categories }: { api: FiltersApi; categories: Category[] }) {
  const { filters, update } = api;
  const toggle = (slug: string) =>
    update({
      cat: filters.cat.includes(slug)
        ? filters.cat.filter((c) => c !== slug)
        : [...filters.cat, slug],
    });

  const chip = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition active:scale-95 ${
      active
        ? "border-navy bg-navy text-ivory"
        : "border-border bg-surface hover:border-steel"
    }`;

  return (
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
      </button>
      {categories.map((c) => {
        const active = filters.cat.includes(c.slug);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.slug)}
            aria-pressed={active}
            className={chip(active)}
          >
            {active && <Check className="size-3.5" />}
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function ActiveFilters({ api }: { api: FiltersApi }) {
  const { filters, update } = api;
  const pills: { label: string; clear: () => void }[] = [];

  if (filters.q) pills.push({ label: `“${filters.q}”`, clear: () => update({ q: null }) });
  if (filters.min != null || filters.max != null) {
    const label =
      filters.min != null && filters.max != null
        ? `${formatPrice(filters.min)} – ${formatPrice(filters.max)}`
        : filters.min != null
          ? `Desde ${formatPrice(filters.min)}`
          : `Hasta ${formatPrice(filters.max!)}`;
    pills.push({ label, clear: () => update({ min: null, max: null }) });
  }
  for (const t of filters.tag) {
    pills.push({
      label: t,
      clear: () => update({ tag: filters.tag.filter((x) => x !== t) }),
    });
  }

  if (!pills.length) return null;

  return (
    <>
      {pills.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={p.clear}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-powder px-3 text-xs transition hover:bg-dusty/60"
          aria-label={`Quitar filtro ${p.label}`}
        >
          {p.label}
          <X className="size-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => update({ q: null, cat: null, tag: null, min: null, max: null })}
        className="text-xs text-muted underline underline-offset-4 hover:text-navy"
      >
        Limpiar todo
      </button>
    </>
  );
}

function FilterPanel({ api, facets }: { api: FiltersApi; facets: Facets }) {
  const { filters, update } = api;

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Precio
        </legend>
        <div className="flex flex-col gap-1">
          {priceRanges.map((r) => {
            const active = filters.min === r.min && filters.max === r.max;
            return (
              <button
                key={r.label}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  update(active ? { min: null, max: null } : { min: r.min, max: r.max })
                }
                className={`flex h-10 items-center justify-between rounded-xl px-3 text-left text-sm transition ${
                  active ? "bg-navy text-ivory" : "hover:bg-powder/70"
                }`}
              >
                {r.label}
                {active && <Check className="size-4" />}
              </button>
            );
          })}
        </div>
        <PriceInputs
          key={`${filters.min}-${filters.max}`}
          min={filters.min}
          max={filters.max}
          onApply={(min, max) => update({ min, max })}
        />
      </fieldset>

      {facets.tags.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Estilo
          </legend>
          <div className="flex flex-wrap gap-2">
            {facets.tags.map(({ tag, count }) => {
              const active = filters.tag.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    update({
                      tag: active ? filters.tag.filter((t) => t !== tag) : [...filters.tag, tag],
                    })
                  }
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm capitalize transition active:scale-95 ${
                    active
                      ? "border-navy bg-navy text-ivory"
                      : "border-border bg-surface hover:border-steel"
                  }`}
                >
                  {tag}
                  <span className={active ? "text-ivory/70" : "text-muted"}>{count}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}

function PriceInputs({
  min,
  max,
  onApply,
}: {
  min: number | null;
  max: number | null;
  onApply: (min: number | null, max: number | null) => void;
}) {
  const parse = (v: FormDataEntryValue | null) => {
    const n = Number(v);
    return v === "" || v == null || Number.isNaN(n) || n < 0 ? null : Math.round(n);
  };

  return (
    <form
      className="mt-3 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        onApply(parse(data.get("min")), parse(data.get("max")));
      }}
    >
      <input
        name="min"
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={min ?? ""}
        placeholder="Mín"
        aria-label="Precio mínimo"
        className="h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-steel"
      />
      <span className="text-muted">–</span>
      <input
        name="max"
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={max ?? ""}
        placeholder="Máx"
        aria-label="Precio máximo"
        className="h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-steel"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-xl border border-border px-3 text-sm transition hover:border-steel"
      >
        Ir
      </button>
    </form>
  );
}
