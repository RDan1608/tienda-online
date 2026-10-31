"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/lib/types";

// Carrito y favoritos viven en localStorage: el público no tiene cuenta.
// Los precios aquí son referencia; el total real lo calcula create_order().

export type CartItem = ProductSummary & { qty: number };

type CartState = {
  items: CartItem[];
  add: (product: ProductSummary, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  sync: (fresh: ProductSummary[]) => void;
};

const MAX_QTY = 99;

/** Actualiza nombre/precio/imagen y descarta productos que ya no están activos. */
function syncItems<T extends ProductSummary>(items: T[], fresh: ProductSummary[]): T[] {
  const byId = new Map(fresh.map((p) => [p.id, p]));
  return items.flatMap((i) => {
    const p = byId.get(i.id);
    return p ? [{ ...i, ...p }] : [];
  });
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === product.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, MAX_QTY) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...product, qty }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: Math.min(Math.max(qty, 1), MAX_QTY) } : i,
          ),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      sync: (fresh) => set((s) => ({ items: syncItems(s.items, fresh) })),
    }),
    { name: "tienda-cart", version: 1 },
  ),
);

type FavoritesState = {
  items: ProductSummary[];
  toggle: (product: ProductSummary) => void;
  remove: (id: string) => void;
  sync: (fresh: ProductSummary[]) => void;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (product) =>
        set((s) =>
          s.items.some((i) => i.id === product.id)
            ? { items: s.items.filter((i) => i.id !== product.id) }
            : { items: [product, ...s.items] },
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      sync: (fresh) => set((s) => ({ items: syncItems(s.items, fresh) })),
    }),
    { name: "tienda-favorites", version: 1 },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((n, i) => n + i.price * i.qty, 0);
}

const noop = () => () => {};

/** false en el servidor y en el primer render: evita desajustes con localStorage. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
