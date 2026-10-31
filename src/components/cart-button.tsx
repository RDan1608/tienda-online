"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartLine } from "@/lib/stores";
import type { ProductSummary } from "@/lib/types";

type Variant = "lg" | "md" | "sm";

const MAX_QTY = 99;

/**
 * Único botón de "agregar al pedido" de toda la tienda (detalle, barra fija y tarjetas).
 * Tras agregar, se CONVIERTE en un contador con la cantidad real del carrito: tocar de nuevo
 * ya no suma a ciegas, y "−" en 1 quita el producto (con "Deshacer" en el aviso).
 */
export function CartButton({ product, variant = "lg" }: { product: ProductSummary; variant?: Variant }) {
  const { qty, inc, dec } = useCartLine(product);
  const MinusIcon = qty === 1 ? Trash2 : Minus;
  const minusLabel = qty === 1 ? `Quitar ${product.name} del pedido` : `Quitar uno de ${product.name}`;
  const plusLabel = `Agregar uno más de ${product.name}`;

  // ───────── Tarjeta: "+" flotante → contador compacto ─────────
  if (variant === "sm") {
    if (qty === 0) {
      return (
        <button
          type="button"
          onClick={inc}
          aria-label={`Agregar ${product.name} al pedido`}
          className="relative grid size-9 place-items-center rounded-full bg-navy text-ivory shadow-float transition-transform duration-150 ease-out before:absolute before:-inset-1.5 active:scale-90"
        >
          <Plus className="size-[18px]" strokeWidth={2.25} />
        </button>
      );
    }
    return (
      <div className="swap-in flex h-9 items-center rounded-full bg-ivory/95 text-navy shadow-float backdrop-blur">
        <button
          type="button"
          onClick={dec}
          aria-label={minusLabel}
          className="relative grid size-9 place-items-center rounded-full transition-transform duration-150 before:absolute before:-inset-1 active:scale-90"
        >
          <MinusIcon className="size-4" />
        </button>
        <span aria-live="polite" className="min-w-4 text-center text-sm font-semibold tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={qty >= MAX_QTY}
          aria-label={plusLabel}
          className="relative grid size-9 place-items-center rounded-full transition-transform duration-150 before:absolute before:-inset-1 active:scale-90 disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
    );
  }

  // ───────── Barra fija móvil ─────────
  if (variant === "md") {
    if (qty === 0) {
      return (
        <button
          type="button"
          onClick={inc}
          className="swap-in inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-ivory transition duration-150 active:scale-95"
        >
          <ShoppingBag className="size-[18px]" /> Agregar
        </button>
      );
    }
    return (
      <div className="swap-in flex h-12 shrink-0 items-center rounded-full bg-powder p-1">
        <button
          type="button"
          onClick={dec}
          aria-label={minusLabel}
          className="grid size-10 place-items-center rounded-full bg-ivory text-navy shadow-soft transition-transform duration-150 active:scale-90"
        >
          <MinusIcon className="size-[18px]" />
        </button>
        <span aria-live="polite" className="min-w-9 text-center text-[15px] font-semibold tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={qty >= MAX_QTY}
          aria-label={plusLabel}
          className="grid size-10 place-items-center rounded-full bg-navy text-ivory transition-transform duration-150 active:scale-90 disabled:opacity-40"
        >
          <Plus className="size-[18px]" />
        </button>
      </div>
    );
  }

  // ───────── Detalle del producto ─────────
  return (
    <div className="min-h-[5.5rem]">
      {qty === 0 ? (
        <div className="swap-in">
          <button
            type="button"
            onClick={inc}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-navy text-[15px] font-semibold text-ivory shadow-soft transition duration-150 hover:bg-navy-deep active:scale-[0.98]"
          >
            <ShoppingBag className="size-5" /> Agregar al pedido
          </button>
          <p className="mt-2.5 text-center text-xs text-muted">No se cobra nada ahora · coordinamos contigo</p>
        </div>
      ) : (
        <div className="swap-in">
          <div className="flex h-14 items-center justify-between rounded-full bg-powder p-1.5">
            <button
              type="button"
              onClick={dec}
              aria-label={minusLabel}
              className="grid size-11 place-items-center rounded-full bg-ivory text-navy shadow-soft transition-transform duration-150 active:scale-90"
            >
              <MinusIcon className="size-5" />
            </button>
            <p aria-live="polite" className="text-[15px] font-semibold tabular-nums">
              {qty} en tu pedido
            </p>
            <button
              type="button"
              onClick={inc}
              disabled={qty >= MAX_QTY}
              aria-label={plusLabel}
              className="grid size-11 place-items-center rounded-full bg-navy text-ivory transition-transform duration-150 active:scale-90 disabled:opacity-40"
            >
              <Plus className="size-5" />
            </button>
          </div>
          <Link
            href="/carrito"
            className="mt-2.5 block text-center text-sm font-medium underline-offset-4 hover:underline"
          >
            Ver mi pedido →
          </Link>
        </div>
      )}
    </div>
  );
}
