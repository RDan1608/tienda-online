import Link from "next/link";
import { site } from "@/lib/site";
import { ThemeSwitch } from "@/components/theme-toggle";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-powder/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div>
          <p className="font-display text-xl font-extrabold tracking-[-0.04em]">{site.name}</p>
          <p className="mt-1.5 max-w-xs text-sm text-muted">{site.blurb}</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-2.5 text-sm font-medium text-muted">
          <Link href="/" className="transition-colors hover:text-navy">Inicio</Link>
          <Link href="/catalogo" className="transition-colors hover:text-navy">Catálogo</Link>
          <Link href="/favoritos" className="transition-colors hover:text-navy">Favoritos</Link>
          <Link href="/carrito" className="transition-colors hover:text-navy">Mi pedido</Link>
          <Link href="/pedido" className="transition-colors hover:text-navy">Seguir mi pedido</Link>
        </nav>
        <div>
          <p className="mb-2.5 text-sm font-semibold">Apariencia</p>
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}
