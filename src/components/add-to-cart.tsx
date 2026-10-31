"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/stores";
import type { ProductSummary } from "@/lib/types";

export function AddToCart({ product }: { product: ProductSummary }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex h-12 items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-12 place-items-center rounded-full transition hover:bg-powder/70 disabled:opacity-40"
            disabled={qty <= 1}
            aria-label="Menos"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-6 text-center tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="grid size-12 place-items-center rounded-full transition hover:bg-powder/70"
            aria-label="Más"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            add(product, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 1800);
          }}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-medium text-ivory transition hover:bg-navy/90 active:scale-[0.98]"
        >
          {added ? (
            <>
              <Check className="size-[18px]" /> Agregado
            </>
          ) : (
            <>
              <ShoppingBag className="size-[18px]" /> Agregar al carrito
            </>
          )}
        </button>
      </div>
      <p className={`text-sm transition-opacity ${added ? "opacity-100" : "opacity-0"}`} aria-live="polite">
        {added && (
          <>
            Listo.{" "}
            <Link href="/carrito" className="underline underline-offset-4">
              Ver carrito
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
