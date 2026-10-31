import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-border bg-powder/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-2xl font-semibold tracking-[-0.025em]">{site.name}</p>
          <p className="mt-2 text-sm text-muted">{site.description}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">¿Cómo comprar?</p>
          <p className="mt-2 text-muted">{site.orderInfo}</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-col gap-2 text-sm text-muted">
          <Link href="/catalogo" className="hover:text-navy">Catálogo</Link>
          <Link href="/favoritos" className="hover:text-navy">Favoritos</Link>
          <Link href="/carrito" className="hover:text-navy">Carrito</Link>
        </nav>
      </div>
    </footer>
  );
}
