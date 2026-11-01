"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

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
export function Pagination({
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
