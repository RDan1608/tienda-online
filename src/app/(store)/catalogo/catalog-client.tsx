"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { PAGE_SIZE, sortOptions, type SortValue } from "@/lib/catalog-params";
import { allTags, facetCounts, priceBounds, runCatalog } from "@/lib/catalog-filter";
import { useFlip } from "@/lib/use-flip";
import type { CatalogItem, Category } from "@/lib/types";
import { CategoryArt } from "@/components/illustrations";
import { ProductCard } from "@/components/product-card";
import { FilterPanel } from "./filter-panel";
import { FilterSheet, useSheetClose } from "./filter-sheet";
import { useCatalogFilters, type CatalogApi } from "./use-catalog-filters";

const lps = (n: number) => `L ${n.toLocaleString("es-HN")}`;

export function CatalogClient({ items, categories }: { items: CatalogItem[]; categories: Category[] }) {
  const api = useCatalogFilters();
  const { filters, update } = api;
  const [sheet, setSheet] = useState<"filters" | "sort" | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  // Todo se calcula aquí, en memoria: cambiar un filtro no toca la red.
  const results = useMemo(() => runCatalog(items, filters), [items, filters]);
  const facets = useMemo(() => facetCounts(items, filters), [items, filters]);
  const tags = useMemo(() => allTags(items), [items]);
  const bounds = useMemo(() => priceBounds(items), [items]);

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const visible = results.slice(start, start + PAGE_SIZE);
  useFlip(grid, visible.map((p) => p.id).join());

  // Al cambiar búsqueda, categoría, filtros u orden, se vuelve al buscador para ver el resultado desde el
  // principio. Si hay una hoja abierta se espera a que cierre. Si ya estás arriba (escribiendo), no se mueve nada.
  const filterKey = [filters.q, filters.cat.join(), filters.tag.join(), filters.min, filters.max, filters.sort].join("|");
  const lastKey = useRef(filterKey);
  useEffect(() => {
    if (sheet !== null || lastKey.current === filterKey) return;
    lastKey.current = filterKey;
    const top = document.getElementById("catalogo-top");
    if (!top || top.getBoundingClientRect().top >= 0) return;
    top.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [filterKey, sheet]);

  // Al cambiar de página se vuelve al inicio de los resultados (no al inicio de la página).
  const goPage = (n: number) => {
    api.setPage(n);
    requestAnimationFrame(() =>
      document.getElementById("resultados")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      }),
    );
  };

  const panelActive = filters.tag.length + (filters.min != null || filters.max != null ? 1 : 0);
  const countLabel = `${total} ${total === 1 ? "producto" : "productos"}`;
  const sortShort = { nuevo: "Nuevos", popular: "Populares", "precio-asc": "Precio ↑", "precio-desc": "Precio ↓" }[filters.sort];

  const panel = <FilterPanel api={api} bounds={bounds} tags={tags} tagCounts={facets.tag} />;

  return (
    <>
      <SearchBox api={api} />
      <CategoryTabs api={api} categories={categories} counts={facets.cat} />

      {/* Barra fija (móvil): dos acciones iguales, a la altura del pulgar */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-border/70 bg-ivory/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSheet("filters")}
            className="relative inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface text-sm font-semibold transition active:scale-[0.97]"
          >
            <SlidersHorizontal className="size-[17px]" />
            Filtrar
            {panelActive > 0 && (
              <span className="pill-in grid size-[18px] place-items-center rounded-full bg-rose-ink text-[11px] font-bold text-white">
                {panelActive}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSheet("sort")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-semibold transition active:scale-[0.97]"
          >
            <ArrowUpDown className="size-[17px] shrink-0" />
            <span className="truncate">
              Ordenar: <span className="font-medium text-muted">{sortShort}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Resultados: cuántos hay y qué se está filtrando, en su propia línea */}
      <div id="resultados" className="scroll-mt-32 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-bold tabular-nums" aria-live="polite">
            {countLabel}
          </p>
          <label className="hidden items-center gap-2 text-sm lg:flex">
            <span className="text-muted">Ordenar</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortValue })}
              className="h-10 rounded-full border border-border bg-surface px-4 pr-8 text-sm font-medium outline-none transition-colors hover:border-steel focus:border-steel"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <AppliedSummary api={api} categories={categories} />
      </div>

      <div className="mt-4 gap-10 lg:grid lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24">{panel}</div>
        </aside>

        <div className="min-h-[50vh]">
          {total > 0 ? (
            <>
              <h2 className="sr-only">Productos</h2>
              <div ref={grid} className="relative grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4">
                {visible.map((p, i) => (
                  <div key={p.id} data-flip={p.id} className="card-in" style={{ "--i": i % PAGE_SIZE } as React.CSSProperties}>
                    <ProductCard product={p} priority={i < 4} />
                  </div>
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} from={start + 1} to={start + visible.length} total={total} onPage={goPage} />
            </>
          ) : (
            <EmptyResults api={api} items={items} categories={categories} />
          )}
        </div>
      </div>

      {/* Hoja: Filtrar */}
      <FilterSheet
        open={sheet === "filters"}
        onClose={() => setSheet(null)}
        title="Filtrar"
        footer={
          <FilterFooter
            total={total}
            countLabel={countLabel}
            canClear={panelActive > 0}
            onClear={() => update({ tag: null, min: null, max: null })}
          />
        }
      >
        {panel}
      </FilterSheet>

      {/* Hoja: Ordenar (al elegir, se aplica y se cierra) */}
      <FilterSheet open={sheet === "sort"} onClose={() => setSheet(null)} title="Ordenar por">
        <SortOptions value={filters.sort} onPick={(v) => update({ sort: v })} />      </FilterSheet>
    </>
  );
}

function SearchBox({ api }: { api: CatalogApi }) {
  const ref = useRef<HTMLInputElement>(null);
  const { search, update } = api;

  // Llegar con #buscar (botón de la lupa): se enfoca el campo y se centra a la vista.
  useEffect(() => {
    if (window.location.hash !== "#buscar") return;
    ref.current?.focus();
    document.getElementById("catalogo-top")?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <label id="catalogo-top" className="relative block scroll-mt-20">
      <span className="sr-only">Buscar productos</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        id="buscar"
        type="search"
        value={search}
        onChange={(e) => update({ q: e.target.value || null })}
        onKeyDown={(e) => e.key === "Escape" && search && update({ q: null })}
        placeholder="Buscar aretes, peluches, llaveros…"
        className="h-12 w-full rounded-full border border-transparent bg-powder/70 pl-11 pr-11 text-[15px] outline-none transition placeholder:text-muted/80 focus:border-steel focus:bg-surface focus:ring-4 focus:ring-powder"
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

/** Categorías como pestañas con subrayado (no pastillas): una a la vez, siempre a la vista. */
function CategoryTabs({
  api,
  categories,
  counts,
}: {
  api: CatalogApi;
  categories: Category[];
  counts: Record<string, number>;
}) {
  const { filters, update } = api;
  const list = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const selected = filters.cat.length === 1 ? filters.cat[0] : null;

  // Al cambiar de categoría, la pestaña activa se lleva al centro (no en la primera carga).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [selected, filters.cat.length]);

  const tab = (label: string, active: boolean, onClick: () => void, dim = false) => (
    <button
      key={label}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      // Sin resultados con los filtros actuales: deshabilitada (no desaparece, así la fila no salta).
      disabled={dim}
      className={`relative h-12 shrink-0 text-[15px] transition-colors duration-200 active:opacity-60 ${
        active ? "font-bold text-navy" : dim ? "font-medium text-muted opacity-45" : "font-medium text-muted hover:text-navy"
      }`}
    >
      {label}
      {/* El subrayado de cada pestaña crece desde la izquierda al activarse */}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-[3px] origin-left rounded-full bg-navy transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          active ? "scale-x-100" : "scale-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="-mx-4 mt-3 border-b border-border/70 sm:-mx-6 lg:mx-0">
      <div
        ref={list}
        role="tablist"
        aria-label="Categorías"
        className="flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:px-0"
      >
        {tab("Todo", filters.cat.length === 0, () => update({ cat: null }))}
        {categories.map((c) =>
          tab(
            c.name,
            selected === c.slug,
            () => update({ cat: [c.slug] }),
            (counts[c.slug] ?? 0) === 0 && selected !== c.slug,
          ),
        )}
      </div>
    </div>
  );
}

function pills(api: CatalogApi, categories: Category[]) {
  const { filters, update } = api;
  const list: { key: string; label: string; clear: () => void }[] = [];

  if (filters.q) list.push({ key: "q", label: `“${filters.q}”`, clear: () => update({ q: null }) });
  // Varias categorías solo pueden venir de enlaces antiguos: se muestran para poder quitarlas.
  if (filters.cat.length > 1) {
    for (const slug of filters.cat) {
      const name = categories.find((c) => c.slug === slug)?.name ?? slug;
      list.push({ key: `c-${slug}`, label: name, clear: () => update({ cat: filters.cat.filter((s) => s !== slug) }) });
    }
  }
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

/** Resumen de lo filtrado en una línea de texto con ✕ (sin pastillas), como pide la guía de Baymard. */
function AppliedSummary({ api, categories }: { api: CatalogApi; categories: Category[] }) {
  const list = pills(api, categories);
  if (!list.length) return null;

  return (
    <div className="pill-in flex flex-wrap items-center gap-x-1 pt-1 text-[13px]">
      {list.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={p.clear}
          aria-label={`Quitar filtro ${p.label}`}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 font-semibold capitalize transition-colors active:bg-powder/70"
        >
          {p.label}
          <X className="size-3.5 text-muted" />
        </button>
      ))}
      <button
        type="button"
        onClick={api.clear}
        className="h-9 rounded-lg px-2 font-medium text-rose-ink underline-offset-4 hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  );
}

function EmptyResults({ api, items, categories }: { api: CatalogApi; items: CatalogItem[]; categories: Category[] }) {
  const list = pills(api, categories);
  const slug = api.filters.cat[0] ?? null;
  // Una salida clara: lo más pedido, para que nunca sea un callejón sin salida.
  const suggestions = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.sold_count - a.sold_count || Number(b.is_featured) - Number(a.is_featured))
        .slice(0, 4),
    [items],
  );

  return (
    <div className="card-in">
      <div className="rounded-[28px] bg-powder/50 px-6 py-10 text-center">
        <CategoryArt slug={slug} className="mx-auto w-28 opacity-90" />
        <p className="mt-3 font-display text-2xl font-bold tracking-[-0.025em]">No encontramos productos</p>
        <p className="mt-1.5 text-sm text-muted">
          {list.length ? "Prueba quitando alguno de estos filtros" : "Aún no hay productos aquí."}
        </p>
        {list.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-1">
            {list.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={p.clear}
                className="inline-flex h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold capitalize active:bg-ivory/70"
              >
                <X className="size-3.5" /> {p.label}
              </button>
            ))}
            <button type="button" onClick={api.clear} className="h-10 rounded-lg px-2 text-sm font-semibold text-rose-ink">
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <section className="mt-10" aria-labelledby="quiza">
          <h2 id="quiza" className="mb-4 font-display text-xl font-bold tracking-[-0.025em]">
            Quizá te guste
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FilterFooter({
  total,
  countLabel,
  canClear,
  onClear,
}: {
  total: number;
  countLabel: string;
  canClear: boolean;
  onClear: () => void;
}) {
  const close = useSheetClose();
  return (
    <div>
      {total === 0 && <p className="mb-2 text-center text-sm text-muted">Quita un filtro para ver productos</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear}
          className="h-12 shrink-0 px-3 text-[15px] font-semibold underline-offset-4 transition-opacity hover:underline disabled:opacity-35"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={close}
          disabled={total === 0}
          className="h-12 flex-1 rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98] disabled:opacity-45"
        >
          {total > 0 ? `Ver ${countLabel}` : "Sin resultados"}
        </button>
      </div>
    </div>
  );
}

/** Filas con radio: al elegir, se aplica y la hoja se cierra sola (sin botón "Aplicar"). */
function SortOptions({ value, onPick }: { value: SortValue; onPick: (v: SortValue) => void }) {
  const close = useSheetClose();
  return (
    <div role="radiogroup" aria-label="Ordenar por" className="pb-3">
      {sortOptions.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              onPick(o.value);
              setTimeout(close, 120);
            }}
            className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-border text-left text-[15px] last:border-b-0 active:bg-powder/50"
          >
            <span className={selected ? "font-semibold" : ""}>{o.label}</span>
            <span
              className={`grid size-6 place-items-center rounded-full transition-colors duration-150 ${
                selected ? "bg-navy text-ivory" : "border-2 border-dusty"
              }`}
            >
              {selected && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function pageList(page: number, total: number): (number | "…")[] {
  const nums = [...new Set([1, total, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

/** Paginador numerado: anterior, páginas con "…" y siguiente. Solo aparece si hay más de una página. */
function Pagination({
  page,
  totalPages,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPage: (n: number) => void;
}) {
  if (totalPages <= 1) return null;
  const nav =
    "grid size-10 place-items-center rounded-full text-sm font-semibold tabular-nums transition-[background-color,transform] duration-150 active:scale-90 disabled:opacity-30 disabled:active:scale-100";

  return (
    <nav aria-label="Paginación" className="mt-10">
      <ul className="flex items-center justify-center gap-1">
        <li>
          <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Página anterior" className={`${nav} hover:bg-powder`}>
            <ChevronLeft className="size-5" />
          </button>
        </li>
        {pageList(page, totalPages).map((n, i) => (
          <li key={`${n}-${i}`}>
            {n === "…" ? (
              <span aria-hidden className="grid size-8 place-items-center text-muted">…</span>
            ) : (
              <button
                type="button"
                onClick={() => onPage(n)}
                aria-label={`Página ${n}`}
                aria-current={n === page ? "page" : undefined}
                className={`${nav} ${n === page ? "bg-navy text-ivory" : "hover:bg-powder"}`}
              >
                {n}
              </button>
            )}
          </li>
        ))}
        <li>
          <button type="button" onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Página siguiente" className={`${nav} hover:bg-powder`}>
            <ChevronRight className="size-5" />
          </button>
        </li>
      </ul>
      <p className="mt-3 text-center text-xs tabular-nums text-muted">
        Mostrando {from}–{to} de {total}
      </p>
    </nav>
  );
}
