"use client";

import { useId } from "react";
import type { CatalogApi } from "./use-catalog-filters";
import { PriceRange } from "./price-range";

export type Bounds = { lo: number; hi: number; step: number };

const heading = "mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted";

/** Precio + estilos. Se usa igual en la columna de escritorio y en la hoja móvil. */
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
  // Este panel se monta dos veces (columna y hoja móvil): los ids deben ser únicos.
  const uid = useId();

  return (
    <div className="space-y-9">
      {bounds && (
        <section aria-labelledby={`${uid}-precio`}>
          <h2 id={`${uid}-precio`} className={heading}>
            Precio
          </h2>
          <PriceRange
            lo={bounds.lo}
            hi={bounds.hi}
            step={bounds.step}
            min={filters.min}
            max={filters.max}
            onChange={(min, max) => update({ min, max })}
          />
        </section>
      )}

      {tags.length > 0 && (
        <section aria-labelledby={`${uid}-estilo`}>
          <h2 id={`${uid}-estilo`} className={heading}>
            Estilo
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = filters.tag.includes(tag);
              const count = tagCounts[tag] ?? 0;
              // Sin resultados: se atenúa pero NO desaparece, para que el panel no salte.
              const empty = count === 0 && !active;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  disabled={empty}
                  onClick={() =>
                    update({ tag: active ? filters.tag.filter((t) => t !== tag) : [...filters.tag, tag] })
                  }
                  className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm capitalize transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out active:scale-95 ${
                    active
                      ? "border-navy bg-navy text-ivory"
                      : empty
                        ? "border-border bg-surface opacity-40"
                        : "border-border bg-surface hover:border-steel"
                  }`}
                >
                  {tag}
                  <span className={`text-xs tabular-nums ${active ? "text-ivory/70" : "text-muted"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
