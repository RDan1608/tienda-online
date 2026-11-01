"use client";

import { useState } from "react";
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

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/**
 * Barra inferior fija, solo en móvil.
 * El fondo navy vive en el propio ícono activo (no en una píldora aparte): fondo y color del ícono
 * cambian juntos, así nunca queda un ícono claro sobre fondo claro. Al tocar, se marca al instante,
 * sin esperar a que cargue la página.
 */
export function MobileNav() {
  const pathname = usePathname();
  const counts = useCounts();
  // Toque pendiente: solo vale mientras la ruta no haya cambiado desde el toque.
  const [tapped, setTapped] = useState<{ from: string; href: string } | null>(null);
  const current = tapped && tapped.from === pathname ? tapped.href : null;

  // El pedido es un flujo aparte: sin barra inferior, el botón de continuar es lo único que compite.
  if (pathname.startsWith("/carrito")) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-ivory/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(54_77_102/0.35)] backdrop-blur-md [transform:translateZ(0)] [touch-action:manipulation] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon, count }) => {
          const active = current ? current === href : isActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setTapped({ from: pathname, href })}
                className="group flex flex-col items-center gap-1 pb-2 pt-2 transition-transform duration-150 active:scale-95"
              >
                <span
                  className={`relative grid h-8 w-16 place-items-center rounded-full transition-[background-color,color] duration-200 ${
                    active ? "bg-navy text-ivory" : "text-muted"
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
