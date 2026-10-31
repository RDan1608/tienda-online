"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, ShoppingBag } from "lucide-react";
import { Badge, useCounts } from "@/components/header-actions";

const items = [
  { href: "/", label: "Inicio", icon: House, count: null },
  { href: "/catalogo", label: "Catálogo", icon: LayoutGrid, count: null },
  { href: "/favoritos", label: "Favoritos", icon: Heart, count: "favs" },
  { href: "/carrito", label: "Pedido", icon: ShoppingBag, count: "cart" },
] as const;

/** Barra inferior fija, solo en móvil. La opción activa lleva una píldora navy que se desliza. */
export function MobileNav() {
  const pathname = usePathname();
  const counts = useCounts();
  const activeIndex = items.findIndex(({ href }) => (href === "/" ? pathname === "/" : pathname.startsWith(href)));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-ivory/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(54_77_102/0.35)] backdrop-blur-md md:hidden"
    >
      <ul className="relative grid grid-cols-4">
        {/* Píldora activa: una sola, se desliza (transform) hacia la pestaña elegida */}
        <li
          aria-hidden
          className="pointer-events-none absolute left-0 top-2 w-1/4 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`, opacity: activeIndex < 0 ? 0 : 1 }}
        >
          <span key={activeIndex} className="pill-land mx-auto block h-8 w-16 rounded-full bg-navy" />
        </li>

        {items.map(({ href, label, icon: Icon, count }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-1 pb-2 pt-2 transition-transform duration-150 active:scale-95"
              >
                <span
                  className={`relative grid h-8 w-16 place-items-center transition-colors duration-200 ${
                    active ? "text-ivory" : "text-muted"
                  }`}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.6} />
                  {count && <Badge value={counts[count]} tone={count === "cart" ? "rose" : "navy"} ring />}
                </span>
                <span
                  className={`text-[11px] leading-none transition-colors duration-200 ${
                    active ? "font-bold text-navy" : "font-medium text-muted"
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
