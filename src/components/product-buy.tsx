"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import { CartButton } from "@/components/cart-button";

/**
 * Botón principal de compra del detalle. En móvil, cuando sale de pantalla aparece una barra
 * fija sobre la navegación que usa el MISMO contador: nunca duplica el producto en el carrito.
 */
export function ProductBuy({ product }: { product: ProductSummary }) {
  const anchor = useRef<HTMLDivElement>(null);
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
        <CartButton product={product} variant="lg" />
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
            <p className="font-semibold tabular-nums">{formatPrice(product.price)}</p>
          </div>
          <CartButton product={product} variant="md" />
        </div>
      </div>
    </>
  );
}
