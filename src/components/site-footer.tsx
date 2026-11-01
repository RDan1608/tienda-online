import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-bold tracking-[-0.03em]">{site.name}</p>
          <p className="mt-0.5 text-sm text-muted">{site.blurb}</p>
        </div>
        <nav aria-label="Pie de página" className="flex gap-5 text-sm font-medium text-muted">
          <Link href="/catalogo" className="transition-colors hover:text-navy">Catálogo</Link>
          <Link href="/favoritos" className="transition-colors hover:text-navy">Favoritos</Link>
          <Link href="/carrito" className="transition-colors hover:text-navy">Mi pedido</Link>
        </nav>
      </div>
    </footer>
  );
}
