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
  const [anchorInView, setAnchorInView] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  // La barra solo aparece cuando el botón salió de pantalla Y la persona ya bajó: al entrar al detalle no salta sola.
  const anchorVisible = anchorInView || !scrolled;

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setAnchorInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
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
