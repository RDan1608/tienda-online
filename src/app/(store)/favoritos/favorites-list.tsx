"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart, useFavorites, useHydrated } from "@/lib/stores";
import { useFreshProducts } from "@/lib/use-fresh-products";
import { SummaryRow } from "@/components/summary-row";
import { EmptyState } from "@/components/empty-state";

export function FavoritesList() {
  const hydrated = useHydrated();
  const items = useFavorites((s) => s.items);
  const remove = useFavorites((s) => s.remove);
  const sync = useFavorites((s) => s.sync);
  const addToCart = useCart((s) => s.add);
  const removed = useFreshProducts(
    items.map((i) => i.id),
    hydrated,
    sync,
  );

  if (!hydrated) return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-powder/50" />;

  if (!items.length) {
    return (
      <EmptyState
        icon={<Heart className="size-7" strokeWidth={1.5} />}
        title="Aún no tienes favoritos"
        text="Toca el corazón en cualquier producto para guardarlo aquí."
      />
    );
  }

  return (
    <>
      {removed > 0 && (
        <p className="mt-6 rounded-xl bg-powder/60 p-3 text-sm">
          {removed === 1 ? "Un producto ya no está disponible" : `${removed} productos ya no están disponibles`} y
          se quitó de tu lista.
        </p>
      )}
      <ul className="mt-6 divide-y divide-border border-y border-border">
        {items.map((p) => (
          <SummaryRow key={p.id} product={p}>
            <div className="flex items-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => addToCart(p)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy px-4 text-ivory transition active:scale-95"
              >
                <ShoppingBag className="size-4" /> Agregar
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="text-muted underline-offset-4 hover:text-navy hover:underline"
              >
                Quitar
              </button>
            </div>
          </SummaryRow>
        ))}
      </ul>
      <Link href="/carrito" className="mt-6 inline-block text-sm underline underline-offset-4">
        Ir al carrito
      </Link>
    </>
  );
}
