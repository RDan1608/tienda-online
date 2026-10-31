"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, ShoppingBag } from "lucide-react";
import { Badge, useCounts } from "@/components/header-actions";

const items = [
  { href: "/", label: "Inicio", icon: House, count: null },
  { href: "/catalogo", label: "Catálogo", icon: LayoutGrid, count: null },
  { href: "/favoritos", label: "Favoritos", icon: Heart, count: "favs" },
  { href: "/carrito", label: "Carrito", icon: ShoppingBag, count: "cart" },
] as const;

/** Barra inferior fija, solo en móvil. */
export function MobileNav() {
  const pathname = usePathname();
  const counts = useCounts();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-ivory/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon, count }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  active ? "text-navy" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.5} />
                  {count && <Badge value={counts[count]} />}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
