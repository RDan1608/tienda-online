"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import { Check } from "lucide-react";
import { CartButton } from "@/components/cart-button";

/**
 * Botón principal de compra del detalle. En móvil, cuando sale de pantalla aparece una barra
 * fija sobre la navegación que usa el MISMO contador: nunca duplica el producto en el carrito.
 */
export function ProductBuy({ product }: { product: ProductSummary }) {
  const anchor = useRef<HTMLDivElement>(null);
  // Un solo color disponible: ya viene elegido.
  const [color, setColor] = useState<string | null>(product.colors.length === 1 ? product.colors[0] : null);
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
      {product.colors.length > 0 && (
        <fieldset id="colores" className="mb-5 scroll-mt-28">
          <legend className="mb-2.5 text-sm font-semibold">
            Color {color ? <span className="font-normal text-muted">· {color}</span> : <span className="font-normal text-rose-ink">· elige uno</span>}
          </legend>
          <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const on = c === color;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setColor(c)}
                  className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${
                    on ? "border-navy bg-navy text-ivory" : "border-border bg-ivory hover:border-steel"
                  }`}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div ref={anchor}>
        <CartButton product={product} variant="lg" color={color} />
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
            <p className="truncate text-sm">{product.name}{color ? ` · ${color}` : ""}</p>
            <p className="font-semibold tabular-nums">{formatPrice(product.price)}</p>
          </div>
          <CartButton product={product} variant="md" color={color} />
        </div>
      </div>
    </>
  );
}
