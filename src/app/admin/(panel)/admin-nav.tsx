"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, Boxes, ClipboardList, ExternalLink, LayoutDashboard, LogOut, Package, ShieldCheck, Tags, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ThemeButton } from "@/components/theme-toggle";
import { useOrderAlerts } from "./use-order-alerts";

const links = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true, badge: false },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, exact: false, badge: true },
  { href: "/admin/lotes", label: "Lotes", icon: Boxes, exact: false, badge: false },
  { href: "/admin/productos", label: "Productos", icon: Package, exact: false, badge: false },
  { href: "/admin/categorias", label: "Categorías", icon: Tags, exact: false, badge: false },
];

const isActive = (l: (typeof links)[number], pathname: string) =>
  l.exact ? pathname === l.href : pathname.startsWith(l.href);

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
  // Toque pendiente: la pestaña se marca al instante, sin esperar a que cargue la página.
  const [tapped, setTapped] = useState<{ from: string; href: string } | null>(null);
  const pending = tapped && tapped.from === pathname ? tapped.href : null;
  const { toast, dismiss, soundOn, toggleSound } = useOrderAlerts();
  // En el detalle de un pedido o al editar un producto manda la barra de acciones de esa pantalla.
  const focusMode = /^\/admin\/(productos|pedidos)\/[^/]+/.test(pathname);

  const iconBtn =
    "grid size-10 place-items-center rounded-full text-muted transition hover:bg-powder/70 hover:text-navy active:scale-90";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="font-display text-lg font-bold tracking-[-0.025em]">
            Panel
          </Link>

          {/* Escritorio: navegación arriba. En móvil vive en la barra inferior. */}
          <nav aria-label="Admin" className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = isActive(l, pathname);
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

          <div className="flex shrink-0 items-center gap-0.5">
            <span className="mr-2 hidden text-xs text-muted lg:block">{email}</span>
            <Link href="/" target="_blank" className={iconBtn} aria-label="Ver la tienda" title="Ver la tienda">
              <ExternalLink className="size-[18px]" />
            </Link>
            <Link href="/admin/seguridad" className={iconBtn} aria-label="Seguridad" title="Seguridad">
              <ShieldCheck className="size-5" />
            </Link>
            <ThemeButton className={iconBtn} />
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Silenciar aviso de pedidos" : "Activar sonido de pedidos nuevos"}
              title={soundOn ? "Sonido activado" : "Activar sonido de pedidos nuevos"}
              className={`${iconBtn} ${soundOn ? "text-navy" : ""}`}
            >
              {soundOn ? <Bell className="size-[18px]" /> : <BellOff className="size-[18px]" />}
            </button>
            <form action={signOutAction}>
              <button className={iconBtn} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut className="size-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Móvil: barra inferior, igual que la tienda */}
      {!focusMode && (
        <nav
          aria-label="Admin"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-ivory/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(54_77_102/0.35)] backdrop-blur-md [touch-action:manipulation] md:hidden"
        >
          <ul className="grid grid-cols-5">
            {links.map((l) => {
              const active = pending ? pending === l.href : isActive(l, pathname);
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setTapped({ from: pathname, href: l.href })}
                    className="flex flex-col items-center gap-1 pb-2 pt-2 transition-transform duration-150 active:scale-95"
                  >
                    <span
                      className={`relative grid h-8 w-14 place-items-center rounded-full transition-[background-color,color] duration-200 ${
                        active ? "bg-navy text-ivory" : "text-muted"
                      }`}
                    >
                      <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.6} />
                      {l.badge && newOrders > 0 && (
                        <span
                          className="absolute -right-0.5 -top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-badge px-1 text-[10px] font-bold leading-[18px] tabular-nums text-white ring-2 ring-ivory"
                          aria-label={`${newOrders} nuevos`}
                        >
                          {newOrders > 99 ? "99+" : newOrders}
                        </span>
                      )}
                    </span>
                    <span className={`text-[11px] leading-none ${active ? "font-bold text-navy" : "font-medium text-muted"}`}>
                      {l.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed inset-x-4 z-50 mx-auto max-w-sm animate-[toast-in_.3s_ease-out] rounded-2xl bg-navy p-4 text-ivory shadow-xl sm:inset-x-auto sm:right-6 md:bottom-6 ${
            focusMode ? "bottom-24" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]"
          }`}
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
                className="mt-3 inline-flex h-10 items-center rounded-full bg-ivory px-4 text-sm font-medium text-navy"
              >
                Ver pedido
              </Link>
            </div>
            <button onClick={dismiss} aria-label="Cerrar aviso" className="grid size-9 place-items-center rounded-full hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
