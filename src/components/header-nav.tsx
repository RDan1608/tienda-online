"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio", match: (p: string) => p === "/" },
  { href: "/catalogo", label: "Catálogo", match: (p: string) => p.startsWith("/catalogo") },
  { href: "/pedido", label: "Seguir mi pedido", match: (p: string) => p.startsWith("/pedido") },
];

/** Navegación del escritorio: la sección actual queda marcada y cada enlace subraya al pasar el cursor. */
export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones" className="hidden items-center gap-1 text-[15px] md:flex">
      {links.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`group relative rounded-full px-4 py-2 font-medium transition-colors duration-200 ${
              active ? "text-navy" : "text-muted hover:text-navy"
            }`}
          >
            {l.label}
            <span
              aria-hidden
              className={`absolute inset-x-4 -bottom-0.5 h-0.5 origin-left rounded-full bg-navy transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
