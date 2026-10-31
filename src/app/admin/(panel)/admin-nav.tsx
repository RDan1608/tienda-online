"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, LogOut, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useOrderAlerts } from "./use-order-alerts";

const links = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/pedidos", label: "Pedidos", badge: true },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
];

export function AdminNav({
  email,
  newOrders,
  signOutAction,
}: {
  email: string;
  newOrders: number;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const { toast, dismiss, soundOn, toggleSound } = useOrderAlerts();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <nav aria-label="Admin" className="-mx-1 flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {links.map((l) => {
              const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${
                    active ? "bg-navy text-ivory" : "text-muted hover:bg-powder/70 hover:text-navy"
                  }`}
                >
                  {l.label}
                  {l.badge && newOrders > 0 && (
                    <span
                      className={`grid min-w-5 place-items-center rounded-full px-1 text-[11px] leading-5 ${
                        active ? "bg-ivory text-navy" : "bg-navy text-ivory"
                      }`}
                      aria-label={`${newOrders} nuevos`}
                    >
                      {newOrders}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-2 hidden text-xs text-muted lg:block">{email}</span>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Silenciar aviso de pedidos" : "Activar sonido de pedidos nuevos"}
              title={soundOn ? "Sonido activado" : "Activar sonido de pedidos nuevos"}
              className={`grid size-9 place-items-center rounded-full transition hover:bg-powder/70 ${
                soundOn ? "text-navy" : "text-muted"
              }`}
            >
              {soundOn ? <Bell className="size-[18px]" /> : <BellOff className="size-[18px]" />}
            </button>
            <form action={signOutAction}>
              <button
                className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-powder/70 hover:text-navy"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="size-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm animate-[toast-in_.3s_ease-out] rounded-2xl bg-navy p-4 text-ivory shadow-xl sm:inset-x-auto sm:right-6"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.14em] text-ivory/70">Pedido nuevo</p>
              <p className="mt-1 truncate font-medium">
                {toast.code} · {toast.name}
              </p>
              <p className="text-sm text-ivory/80">{formatPrice(toast.total)}</p>
              <Link
                href={`/admin/pedidos/${toast.id}`}
                onClick={dismiss}
                className="mt-3 inline-flex h-9 items-center rounded-full bg-ivory px-4 text-sm font-medium text-navy"
              >
                Ver pedido
              </Link>
            </div>
            <button onClick={dismiss} aria-label="Cerrar aviso" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
