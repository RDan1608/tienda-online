"use client";

import { useRef, useState, useEffect } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/stores";
import type { ProductSummary } from "@/lib/types";
import { AddToCart } from "@/components/add-to-cart";

/**
 * Selector de cantidad + botón de compra. En móvil, cuando el botón principal sale de pantalla,
 * aparece una barra fija encima de la navegación para que "Agregar" siempre esté a un toque.
 */
export function ProductBuy({ product }: { product: ProductSummary }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [anchorVisible, setAnchorVisible] = useState(true);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setAnchorVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <>
      <div ref={anchor}>
        <AddToCart product={product} />
      </div>

      {/* Solo móvil. Se desliza desde abajo; sin animación de salida larga (la oculta al instante el scroll). */}
      <div
        aria-hidden={anchorVisible}
        inert={anchorVisible}
        className={`fixed inset-x-0 bottom-[calc(3.9rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-ivory/95 px-4 py-3 backdrop-blur-md transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden ${
          anchorVisible ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm">{product.name}</p>
            <p className="font-medium">{formatPrice(product.price)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              add(product, 1);
              setAdded(true);
            }}
            className="ml-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-ivory transition active:scale-95"
          >
            {added ? <Check className="pop size-[18px]" /> : <ShoppingBag className="size-[18px]" />}
            {added ? "Agregado" : "Agregar"}
          </button>
        </div>
      </div>
    </>
  );
}
