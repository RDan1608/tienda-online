"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Undo2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/stores";

/**
 * Aviso flotante tras agregar ("Ver pedido") o quitar ("Deshacer"). No bloquea la pantalla,
 * se anuncia a lectores de pantalla y se aparta de la barra inferior y de la barra fija de compra.
 */
export function CartToast() {
  const event = useCart((s) => s.lastEvent);
  const dismiss = useCart((s) => s.dismissEvent);
  const restore = useCart((s) => s.restore);
  const pathname = usePathname();

  useEffect(() => {
    if (!event) return;
    const t = setTimeout(dismiss, event.kind === "removed" ? 5500 : 3500);
    return () => clearTimeout(t);
  }, [event, dismiss]);

  if (!event) return null;
  const removed = event.kind === "removed";
  // En el detalle del producto el contador "1 en tu pedido" ya confirma; solo se avisa para "Deshacer".
  if (!removed && (pathname.startsWith("/producto/") || pathname.startsWith("/carrito"))) return null;

  return (
    <div
      key={event.at}
      role="status"
      className="fixed inset-x-3 bottom-[calc(var(--mobile-nav-h)+var(--sticky-bar-h,0px)+0.625rem)] z-[60] mx-auto flex max-w-md animate-[toast-in_.3s_var(--ease-out)] items-center gap-3 rounded-2xl bg-navy py-2.5 pl-3.5 pr-2.5 text-ivory shadow-float md:inset-x-auto md:bottom-6 md:right-6 md:mx-0 md:w-96"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ivory/15">
        {removed ? <Undo2 className="size-4" /> : <Check className="size-4" strokeWidth={2.5} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.item.name}</p>
        <p className="text-xs text-ivory/70">
          {removed ? "Quitado del pedido" : `Agregado · ${formatPrice(event.item.price)}`}
        </p>
      </div>
      {removed ? (
        <button
          type="button"
          onClick={restore}
          className="h-9 shrink-0 rounded-full bg-ivory px-4 text-sm font-semibold text-navy transition active:scale-95"
        >
          Deshacer
        </button>
      ) : (
        <Link
          href="/carrito"
          onClick={dismiss}
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-ivory px-4 text-sm font-semibold text-navy transition active:scale-95"
        >
          Ver pedido
        </Link>
      )}
    </div>
  );
}
