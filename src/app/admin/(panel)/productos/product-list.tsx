"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Search, Star, X } from "lucide-react";
import { storageUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";
import { Pagination } from "@/components/pagination";
import { toggleActive, toggleFeatured } from "./actions";

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_featured: boolean;
  sold_count: number;
  category: { name: string; slug: string } | null;
  cover: string | null;
};

type View = "todos" | "activos" | "ocultos" | "sinfoto";

const views: { value: View; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "ocultos", label: "Ocultos" },
  { value: "sinfoto", label: "Sin foto" },
];

const PAGE = 10;
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function ProductList({
  products,
  categories,
  initialView = "todos",
}: {
  products: ProductRow[];
  categories: { slug: string; name: string }[];
  initialView?: View;
}) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>(initialView);
  const [cat, setCat] = useState("");
  const [page, setPage] = useState(1);
  // Cualquier cambio de búsqueda o filtro vuelve a la primera página.
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const counts = useMemo(
    () => ({
      todos: products.length,
      activos: products.filter((p) => p.is_active).length,
      ocultos: products.filter((p) => !p.is_active).length,
      sinfoto: products.filter((p) => !p.cover).length,
    }),
    [products],
  );

  const shown = useMemo(() => {
    const needle = norm(q.trim());
    return products.filter((p) => {
      if (view === "activos" && !p.is_active) return false;
      if (view === "ocultos" && p.is_active) return false;
      if (view === "sinfoto" && p.cover) return false;
      if (cat && p.category?.slug !== cat) return false;
      return !needle || norm(p.name).includes(needle);
    });
  }, [products, q, view, cat]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages);
  const pageItems = shown.slice((current - 1) * PAGE, current * PAGE);
  const filtered = q.trim() !== "" || view !== "todos" || cat !== "";

  return (
    <>
      <label className="relative mt-5 block">
        <span className="sr-only">Buscar productos</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => reset(setQ)(e.target.value)}
          placeholder="Buscar por nombre…"
          className="h-12 w-full rounded-full border border-transparent bg-powder/70 pl-11 pr-11 text-[15px] outline-none transition placeholder:text-muted/80 focus:border-steel focus:bg-surface focus:ring-4 focus:ring-powder"
        />
        {q && (
          <button
            type="button"
            onClick={() => reset(setQ)("")}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-powder hover:text-navy active:scale-90"
          >
            <X className="size-4" />
          </button>
        )}
      </label>

      <div className="-mx-4 mt-3 border-b border-border/70 sm:-mx-6">
        <div role="tablist" aria-label="Mostrar" className="flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
          {views.map((v) => {
            const active = view === v.value;
            return (
              <button
                key={v.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => reset(setView)(v.value)}
                className={`relative inline-flex h-12 shrink-0 items-center gap-1.5 text-[15px] transition-colors ${
                  active ? "font-bold text-navy" : "font-medium text-muted hover:text-navy"
                }`}
              >
                {v.label}
                <span className="text-xs tabular-nums">{counts[v.value]}</span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[3px] origin-left rounded-full bg-navy transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold tabular-nums" aria-live="polite">
          {shown.length} {shown.length === 1 ? "producto" : "productos"}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Categoría</span>
          <select
            value={cat}
            onChange={(e) => reset(setCat)(e.target.value)}
            className="h-10 rounded-full border border-border bg-surface px-4 pr-8 text-sm font-medium outline-none transition-colors hover:border-steel focus:border-steel"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-powder/50 px-6 py-12 text-center">
          <p className="text-muted">{filtered ? "Ningún producto coincide." : "Aún no hay productos. Crea el primero."}</p>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setView("todos");
                setCat("");
                setPage(1);
              }}
              className="mt-4 h-11 rounded-full bg-navy px-5 text-sm font-semibold text-ivory"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {pageItems.map((p) => (
            <li key={p.id} className="flex items-center gap-1 rounded-3xl bg-surface p-3 ring-1 ring-border">
              <Link href={`/admin/productos/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-powder">
                  {p.cover ? (
                    <Image src={storageUrl(p.cover)} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <CategoryIcon slug={p.category?.slug ?? null} className="size-6 text-steel" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-[15px] font-semibold ${p.is_active ? "" : "text-muted line-through"}`}>{p.name}</p>
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-navy">{formatPrice(p.price)}</span>
                    {p.category && ` · ${p.category.name}`}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                    {!p.is_active && <span className="rounded-full bg-powder px-2 py-0.5">Oculto</span>}
                    {!p.cover && <span className="rounded-full bg-butter px-2 py-0.5 text-honey-ink">Sin foto</span>}
                    {p.sold_count > 0 && <span className="text-muted">{p.sold_count} vendidos</span>}
                  </p>
                </div>
              </Link>

              <form action={toggleFeatured}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="featured" value={String(!p.is_featured)} />
                <button
                  className={`grid size-11 place-items-center rounded-full transition active:scale-90 ${
                    p.is_featured ? "text-honey-ink" : "text-muted hover:text-navy"
                  }`}
                  aria-label={p.is_featured ? `Quitar ${p.name} de destacados` : `Destacar ${p.name}`}
                  aria-pressed={p.is_featured}
                  title={p.is_featured ? "Destacado" : "Destacar"}
                >
                  <Star className={`size-5 ${p.is_featured ? "fill-current" : ""}`} />
                </button>
              </form>
              <form action={toggleActive}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={String(!p.is_active)} />
                <button
                  className="grid size-11 place-items-center rounded-full text-muted transition hover:text-navy active:scale-90"
                  aria-label={p.is_active ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                  title={p.is_active ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                >
                  {p.is_active ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={current}
        totalPages={pages}
        from={(current - 1) * PAGE + 1}
        to={(current - 1) * PAGE + pageItems.length}
        total={shown.length}
        onPage={(n) => {
          setPage(n);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </>
  );
}
