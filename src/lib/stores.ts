"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductSummary } from "@/lib/types";

// Carrito y favoritos viven en localStorage: el público no tiene cuenta.
// Los precios aquí son referencia; el total real lo calcula create_order().

export type CartItem = ProductSummary & { qty: number };

/** Último cambio notable del carrito: alimenta el aviso flotante ("Agregado" / "Quitado · Deshacer"). */
export type CartEvent = { kind: "added" | "removed"; item: CartItem; at: number };

type CartState = {
  items: CartItem[];
  lastEvent: CartEvent | null;
  add: (product: ProductSummary, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  /** Resta uno; al llegar a 0 quita el producto (con Deshacer). */
  dec: (id: string) => void;
  remove: (id: string) => void;
  /** Deshace la última eliminación. */
  restore: () => void;
  /** Deshace el último "agregado" (quita el producto sin dejar aviso de eliminación). */
  undoAdd: () => void;
  dismissEvent: () => void;
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
      lastEvent: null,
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
          // Solo la PRIMERA vez que entra al carrito se avisa; después el botón ya muestra la cantidad.
          const item = { ...product, qty };
          return { items: [...s.items, item], lastEvent: { kind: "added", item, at: Date.now() } };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: Math.min(Math.max(qty, 1), MAX_QTY) } : i,
          ),
        })),
      dec: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          if (!item) return s;
          if (item.qty > 1) {
            return { items: s.items.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)) };
          }
          return { items: s.items.filter((i) => i.id !== id), lastEvent: { kind: "removed", item, at: Date.now() } };
        }),
      remove: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          return {
            items: s.items.filter((i) => i.id !== id),
            lastEvent: item ? { kind: "removed", item, at: Date.now() } : s.lastEvent,
          };
        }),
      restore: () =>
        set((s) => {
          const ev = s.lastEvent;
          if (!ev || ev.kind !== "removed" || s.items.some((i) => i.id === ev.item.id)) return { lastEvent: null };
          return { items: [...s.items, ev.item], lastEvent: null };
        }),
      undoAdd: () =>
        set((s) => {
          const ev = s.lastEvent;
          if (!ev || ev.kind !== "added") return { lastEvent: null };
          return { items: s.items.filter((i) => i.id !== ev.item.id), lastEvent: null };
        }),
      dismissEvent: () => set({ lastEvent: null }),
      clear: () => set({ items: [], lastEvent: null }),
      sync: (fresh) => set((s) => ({ items: syncItems(s.items, fresh) })),
    }),
    // El aviso es efímero: solo los productos se guardan en el dispositivo.
    { name: "tienda-cart", version: 1, partialize: (s) => ({ items: s.items }) },
  ),
);

/** Último cambio en favoritos: alimenta el aviso con "Deshacer". */
export type FavEvent = { kind: "added" | "removed"; item: ProductSummary; at: number };

type FavoritesState = {
  items: ProductSummary[];
  lastEvent: FavEvent | null;
  toggle: (product: ProductSummary) => void;
  remove: (id: string) => void;
  /** Deshace lo último: vuelve a poner lo quitado o quita lo recién guardado. */
  undo: () => void;
  dismissEvent: () => void;
  sync: (fresh: ProductSummary[]) => void;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      items: [],
      lastEvent: null,
      toggle: (product) =>
        set((s) =>
          s.items.some((i) => i.id === product.id)
            ? {
                items: s.items.filter((i) => i.id !== product.id),
                lastEvent: { kind: "removed", item: product, at: Date.now() },
              }
            : { items: [product, ...s.items], lastEvent: { kind: "added", item: product, at: Date.now() } },
        ),
      remove: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          return {
            items: s.items.filter((i) => i.id !== id),
            lastEvent: item ? { kind: "removed", item, at: Date.now() } : s.lastEvent,
          };
        }),
      undo: () =>
        set((s) => {
          const ev = s.lastEvent;
          if (!ev) return s;
          if (ev.kind === "added") return { items: s.items.filter((i) => i.id !== ev.item.id), lastEvent: null };
          return s.items.some((i) => i.id === ev.item.id)
            ? { lastEvent: null }
            : { items: [ev.item, ...s.items], lastEvent: null };
        }),
      dismissEvent: () => set({ lastEvent: null }),
      sync: (fresh) => set((s) => ({ items: syncItems(s.items, fresh) })),
    }),
    // El aviso es efímero: solo la lista se guarda en el dispositivo.
    { name: "tienda-favorites", version: 1, partialize: (s) => ({ items: s.items }) },
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

/** Cantidad de un producto en el carrito + acciones. Tarjeta, detalle y barra fija comparten esto. */
export function useCartLine(product: ProductSummary) {
  const hydrated = useHydrated();
  const qty = useCart((s) => s.items.find((i) => i.id === product.id)?.qty ?? 0);
  const add = useCart((s) => s.add);
  const dec = useCart((s) => s.dec);

  return {
    qty: hydrated ? qty : 0,
    inc: () => add(product, 1),
    dec: () => dec(product.id),
  };
}
