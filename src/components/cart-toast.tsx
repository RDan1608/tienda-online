"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Heart, Undo2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart, useFavorites } from "@/lib/stores";

/**
 * Aviso flotante tras agregar o quitar algo (pedido o favoritos). Siempre con "Deshacer": así un toque
 * accidental al hacer scroll se corrige en un segundo, sin buscar nada. Se anuncia a lectores de pantalla
 * y se aparta de la barra inferior y de la barra fija de compra.
 */
export function CartToast() {
  const cartEvent = useCart((s) => s.lastEvent);
  const favEvent = useFavorites((s) => s.lastEvent);
  const dismissCart = useCart((s) => s.dismissEvent);
  const dismissFav = useFavorites((s) => s.dismissEvent);
  const restore = useCart((s) => s.restore);
  const undoAdd = useCart((s) => s.undoAdd);
  const undoFav = useFavorites((s) => s.undo);
  const pathname = usePathname();

  // Gana el aviso más reciente de los dos.
  const source = cartEvent && (!favEvent || cartEvent.at >= favEvent.at) ? "cart" : favEvent ? "fav" : null;
  const event = source === "cart" ? cartEvent : source === "fav" ? favEvent : null;

  const dismiss = () => {
    dismissCart();
    dismissFav();
  };

  useEffect(() => {
    if (!event) return;
    const t = setTimeout(dismiss, event.kind === "removed" ? 5500 : 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  if (!event || !source) return null;
  const removed = event.kind === "removed";
  // En el detalle del producto el contador "1 en tu pedido" ya confirma; en el pedido, la lista misma.
  if (source === "cart" && !removed && (pathname.startsWith("/producto/") || pathname.startsWith("/carrito"))) return null;

  const onUndo = () => {
    if (source === "fav") undoFav();
    else if (removed) restore();
    else undoAdd();
  };

  const message =
    source === "fav"
      ? removed
        ? "Quitado de favoritos"
        : "Guardado en favoritos"
      : removed
        ? "Quitado del pedido"
        : `Agregado · ${formatPrice(event.item.price)}`;
  const Icon = source === "fav" ? Heart : removed ? Undo2 : Check;

  return (
    <div
      key={`${source}-${event.at}`}
      role="status"
      className="fixed inset-x-3 bottom-[calc(var(--mobile-nav-h)+var(--sticky-bar-h,0px)+0.625rem)] z-[60] mx-auto flex max-w-md animate-[toast-in_.3s_var(--ease-out)] items-center gap-3 rounded-2xl bg-navy py-2.5 pl-3.5 pr-2.5 text-ivory shadow-float md:inset-x-auto md:bottom-6 md:right-6 md:mx-0 md:w-96"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ivory/15">
        <Icon className="size-4" strokeWidth={source === "fav" ? 2 : 2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.item.name}
          {"color" in event.item && event.item.color ? ` · ${event.item.color}` : ""}
        </p>
        <p className="text-xs text-ivory/70">{message}</p>
      </div>
      {source === "cart" && !removed && (
        <Link
          href="/carrito"
          onClick={dismiss}
          className="inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-ivory/90 transition active:scale-95"
        >
          Ver
        </Link>
      )}
      <button
        type="button"
        onClick={onUndo}
        className="h-9 shrink-0 rounded-full bg-ivory px-4 text-sm font-semibold text-navy transition active:scale-95"
      >
        Deshacer
      </button>
    </div>
  );
}
