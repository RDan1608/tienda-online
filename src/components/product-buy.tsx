"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Palette, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import { useCart, useCartLine, useHydrated } from "@/lib/stores";
import { CartButton } from "@/components/cart-button";

const MAX_QTY = 99;

/**
 * Compra del detalle. Sin colores: un solo contador (CartButton). Con colores: una fila por color,
 * cada una con su propia cantidad, así se pide por ejemplo 2 rosas + 3 celestes en la misma visita.
 * En móvil, cuando la compra sale de pantalla aparece una barra fija sobre la navegación.
 */
export function ProductBuy({ product }: { product: ProductSummary }) {
  const anchor = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const hasColors = product.colors.length > 0;
  // Unidades de ESTE producto en el carrito, sumando todos sus colores.
  const total = useCart((s) => s.items.reduce((n, i) => (i.id === product.id ? n + i.qty : n), 0));
  const units = hydrated ? total : 0;
  const [anchorVisible, setAnchorVisible] = useState(true);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setAnchorVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // El aviso flotante se aparta de la barra mientras esta es visible.
  useEffect(() => {
    const root = document.documentElement;
    if (anchorVisible) root.style.removeProperty("--sticky-bar-h");
    else root.style.setProperty("--sticky-bar-h", "4.5rem");
    return () => {
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [anchorVisible]);

  return (
    <>
      <div ref={anchor}>
        {hasColors ? (
          <fieldset id="colores" className="scroll-mt-28">
            <legend className="mb-2.5 text-sm font-semibold">
              Colores <span className="font-normal text-muted">· elige cuántos de cada uno</span>
            </legend>
            <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
              {product.colors.map((c) => (
                <ColorRow key={c} product={product} color={c} />
              ))}
            </ul>
            <div className="mt-3 flex min-h-11 items-center justify-between gap-3 text-sm">
              <p aria-live="polite" className="text-muted">
                {units > 0 ? (
                  <>
                    <span className="font-semibold text-navy">{units}</span> en tu pedido ·{" "}
                    <span className="tabular-nums">{formatPrice(product.price * units)}</span>
                  </>
                ) : (
                  "Sin pago en línea"
                )}
              </p>
              {units > 0 && (
                <Link href="/carrito" className="font-medium underline-offset-4 hover:underline">
                  Ver mi pedido →
                </Link>
              )}
            </div>
          </fieldset>
        ) : (
          <CartButton product={product} variant="lg" />
        )}
      </div>

      <div
        aria-hidden={anchorVisible}
        inert={anchorVisible}
        className={`fixed inset-x-0 bottom-[var(--mobile-nav-h)] z-30 border-t border-border bg-ivory px-4 py-2.5 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden ${
          anchorVisible ? "pointer-events-none translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{product.name}</p>
            <p className="font-semibold tabular-nums">
              {hasColors && units > 0 ? `${units} · ${formatPrice(product.price * units)}` : formatPrice(product.price)}
            </p>
          </div>
          {hasColors ? (
            units > 0 ? (
              <Link
                href="/carrito"
                className="inline-flex h-12 shrink-0 items-center rounded-full bg-navy px-6 text-sm font-semibold text-ivory transition duration-150 active:scale-95"
              >
                Ver pedido
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById("colores")?.scrollIntoView({ block: "center", behavior: "smooth" })}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-navy px-6 text-sm font-semibold text-ivory transition duration-150 active:scale-95"
              >
                <Palette className="size-[18px]" /> Elige colores
              </button>
            )
          ) : (
            <CartButton product={product} variant="md" />
          )}
        </div>
      </div>
    </>
  );
}

/** Un color con su propio contador: "+" lo agrega, "−" resta (en 1 lo quita, con Deshacer). */
function ColorRow({ product, color }: { product: ProductSummary; color: string }) {
  const { qty, inc, dec } = useCartLine(product, color);
  const MinusIcon = qty === 1 ? Trash2 : Minus;
  const buzz = (fn: () => void) => () => {
    navigator.vibrate?.(8);
    fn();
  };

  return (
    <li className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5">
      <span className={`min-w-0 truncate text-[15px] ${qty > 0 ? "font-semibold" : "font-medium"}`}>{color}</span>
      {qty === 0 ? (
        <button
          type="button"
          onClick={buzz(inc)}
          aria-label={`Agregar ${product.name} en ${color}`}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-ivory px-4 text-sm font-semibold transition hover:border-steel active:scale-95"
        >
          <Plus className="size-4" /> Agregar
        </button>
      ) : (
        <div className="swap-in flex h-12 shrink-0 items-center rounded-full bg-powder p-1">
          <button
            type="button"
            onClick={buzz(dec)}
            aria-label={qty === 1 ? `Quitar ${color} del pedido` : `Quitar uno de ${color}`}
            className="grid size-10 place-items-center rounded-full bg-ivory text-navy shadow-soft transition-transform duration-150 active:scale-90"
          >
            <MinusIcon className="size-[18px]" />
          </button>
          <span aria-live="polite" className="min-w-9 text-center text-[15px] font-semibold tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            onClick={buzz(inc)}
            disabled={qty >= MAX_QTY}
            aria-label={`Agregar uno más en ${color}`}
            className="grid size-10 place-items-center rounded-full bg-navy text-ivory transition-transform duration-150 active:scale-90 disabled:opacity-40"
          >
            <Plus className="size-[18px]" />
          </button>
        </div>
      )}
    </li>
  );
}
