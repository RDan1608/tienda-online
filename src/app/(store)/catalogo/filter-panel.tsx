"use client";

import { useId } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { CatalogApi } from "./use-catalog-filters";
import { PriceRange } from "./price-range";

export type Bounds = { lo: number; hi: number; step: number };

const lps = (n: number) => `L ${n.toLocaleString("es-HN")}`;

/** Tres rangos rápidos calculados del catálogo real (nunca inventados). */
function quickRanges(b: Bounds) {
  const span = b.hi - b.lo;
  const round = span > 600 ? 50 : 10;
  const a = Math.round((b.lo + span / 3) / round) * round;
  const c = Math.round((b.lo + (2 * span) / 3) / round) * round;
  if (!(b.lo < a && a < c && c < b.hi)) return [];
  return [
    { label: `Hasta ${lps(a)}`, min: null, max: a },
    { label: `${lps(a)} – ${lps(c)}`, min: a, max: c },
    { label: `Más de ${lps(c)}`, min: c, max: null },
  ];
}

/** Grupo plegable (<details> nativo: accesible y sin JS). Muestra a la derecha lo elegido. */
function Group({
  title,
  value,
  defaultOpen,
  children,
}: {
  title: string;
  value?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-2xl bg-surface px-4 ring-1 ring-border">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="flex min-w-0 items-center gap-2">
          {value && <span className="truncate text-sm font-medium text-rose-ink">{value}</span>}
          <ChevronDown className="size-[18px] shrink-0 text-muted transition-transform duration-200 ease-out group-open:rotate-180" />
        </span>
      </summary>
      <div className="@container pb-5">{children}</div>
    </details>
  );
}

/** Precio + estilos como acordeones. Igual en la columna de escritorio y en la hoja móvil. */
export function FilterPanel({
  api,
  bounds,
  tags,
  tagCounts,
}: {
  api: CatalogApi;
  bounds: Bounds | null;
  tags: string[];
  tagCounts: Record<string, number>;
}) {
  const { filters, update } = api;
  const uid = useId();

  const priceValue =
    filters.min != null && filters.max != null
      ? `${lps(filters.min)} – ${lps(filters.max)}`
      : filters.min != null
        ? `Desde ${lps(filters.min)}`
        : filters.max != null
          ? `Hasta ${lps(filters.max)}`
          : undefined;
  const ranges = bounds ? quickRanges(bounds) : [];

  return (
    <div className="space-y-3">
      {bounds && (
        <Group title="Precio" value={priceValue} defaultOpen>
          <PriceRange
            lo={bounds.lo}
            hi={bounds.hi}
            step={bounds.step}
            min={filters.min}
            max={filters.max}
            onChange={(min, max) => update({ min, max })}
          />
          {ranges.length > 0 && (
            <div role="radiogroup" aria-label="Rangos de precio" className="mt-3">
              {ranges.map((r) => {
                const selected = filters.min === r.min && filters.max === r.max;
                return (
                  <button
                    key={r.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update(selected ? { min: null, max: null } : { min: r.min, max: r.max })}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl text-left text-[15px] transition-colors active:bg-powder/60"
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 ${
                        selected ? "border-navy bg-navy" : "border-dusty"
                      }`}
                    >
                      {selected && <span className="size-1.5 rounded-full bg-ivory" />}
                    </span>
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}
        </Group>
      )}

      {tags.length > 0 && (
        <Group title="Estilo" value={filters.tag.length ? `${filters.tag.length} elegido${filters.tag.length > 1 ? "s" : ""}` : undefined} defaultOpen>
          <ul className="grid grid-cols-1 gap-x-4 @[18rem]:grid-cols-2">
            {tags.map((tag) => {
              const checked = filters.tag.includes(tag);
              const count = tagCounts[tag] ?? 0;
              // Sin resultados: se atenúa pero NO desaparece, para que el panel no salte.
              const empty = count === 0 && !checked;
              const id = `${uid}-${tag}`;
              return (
                <li key={tag}>
                  <label
                    htmlFor={id}
                    className={`flex min-h-12 min-w-0 cursor-pointer items-center gap-3 rounded-xl text-[15px] capitalize transition-[opacity,background-color] duration-150 active:bg-powder/60 ${
                      empty ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      disabled={empty}
                      onChange={() =>
                        update({ tag: checked ? filters.tag.filter((t) => t !== tag) : [...filters.tag, tag] })
                      }
                      className="peer sr-only"
                    />
                    <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-dusty text-ivory transition-colors duration-150 peer-checked:border-navy peer-checked:bg-navy peer-focus-visible:ring-2 peer-focus-visible:ring-steel peer-focus-visible:ring-offset-2 [&>svg]:scale-0 peer-checked:[&>svg]:scale-100">
                      <Check className="size-3.5 transition-transform duration-150 ease-out" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{tag}</span>
                    <span className="text-sm tabular-nums text-muted">{count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Group>
      )}
    </div>
  );
}
