"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useFlip } from "@/lib/use-flip";
import { formatPrice } from "@/lib/format";
import { useCart, useFavorites, useHydrated } from "@/lib/stores";
import type { ProductSummary } from "@/lib/types";
import { useFreshProducts } from "@/lib/use-fresh-products";
import { CartButton } from "@/components/cart-button";
import { EmptyState } from "@/components/empty-state";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductImage } from "@/components/product-image";

export function FavoritesList() {
  const hydrated = useHydrated();
  const items = useFavorites((s) => s.items);
  const sync = useFavorites((s) => s.sync);
  const cart = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const toggle = useFavorites((s) => s.toggle);
  const grid = useRef<HTMLUListElement>(null);
  // Tarjetas que se están yendo: se encogen y se desvanecen, y recién entonces salen (con "Deshacer").
  const [leaving, setLeaving] = useState<string[]>([]);
  useFlip(grid, items.map((p) => p.id).join());
  const leave = (p: ProductSummary) => {
    setLeaving((l) => [...l, p.id]);
    setTimeout(() => {
      toggle(p);
      setLeaving((l) => l.filter((id) => id !== p.id));
    }, 260);
  };
  const removed = useFreshProducts(
    items.map((i) => i.id),
    hydrated,
    sync,
  );

  if (!hydrated) return <div className="mt-8 h-64 shimmer rounded-[28px]" />;

  if (!items.length) {
    return (
      <EmptyState
        art="corazon"
        title="Aún no tienes favoritos"
        text="Toca el corazón en cualquier producto para guardarlo aquí y encontrarlo después."
        cta="Descubrir productos"
        href="/catalogo?sort=popular"
      />
    );
  }

  // Solo los que todavía no están en el pedido: así "Agregar todo" nunca duplica cantidades.
  const pending = items.filter((p) => !cart.some((c) => c.id === p.id));

  return (
    <>
      {removed > 0 && (
        <p className="mt-6 rounded-2xl bg-butter p-3.5 text-sm">
          {removed === 1 ? "Un producto ya no está disponible" : `${removed} productos ya no están disponibles`} y se
          quitó de tu lista.
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm tabular-nums text-muted">
          {items.length} {items.length === 1 ? "favorito" : "favoritos"}
        </p>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={() => pending.forEach((p) => add(p, 1))}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-navy px-4 text-sm font-semibold text-ivory transition active:scale-95"
          >
            <Plus className="size-4" /> Agregar todo al pedido
          </button>
        )}
      </div>

      <h2 className="sr-only">Tus favoritos</h2>
      <ul ref={grid} className="relative mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4">
        {items.map((p, i) => (
          <li
            key={p.id}
            data-flip={p.id}
            className={"card-in transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] " + (leaving.includes(p.id) ? "scale-90 opacity-0" : "")}
            style={{ "--i": i } as React.CSSProperties}
          >
            <FavoriteCard product={p} onRemove={() => leave(p)} />
          </li>
        ))}
      </ul>

      <Link href="/carrito" className="mt-10 inline-block text-sm font-semibold underline underline-offset-4">
        Ir a mi pedido
      </Link>
    </>
  );
}

function FavoriteCard({ product: p, onRemove }: { product: ProductSummary; onRemove: () => void }) {
  const href = `/producto/${p.slug}`;
  return (
    <article className="group relative">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden className="block">
          <ProductImage path={p.imagePath} alt="" categorySlug={p.categorySlug} sizes="(min-width: 640px) 33vw, 50vw" />
        </Link>
        <div className="absolute right-2.5 top-2.5">
          <FavoriteButton product={p} onRemove={onRemove} />
        </div>
        <div className="absolute bottom-2.5 right-2.5">
          <CartButton product={p} variant="sm" />
        </div>
      </div>
      <Link href={href} className="mt-3 block space-y-0.5 rounded-md px-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</h3>
        <p className="text-[15px] font-bold tabular-nums">{formatPrice(p.price)}</p>
      </Link>
    </article>
  );
}
