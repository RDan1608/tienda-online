import Link from "next/link";
import { site } from "@/lib/site";

const link = "transition-colors hover:text-navy";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-powder/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <p className="font-display text-xl font-extrabold tracking-[-0.04em]">{site.name}</p>
            <p className="mt-1.5 max-w-xs text-sm text-muted">{site.blurb}</p>
          </div>
          <nav aria-labelledby="footer-tienda">
            <p id="footer-tienda" className="mb-3 text-sm font-semibold">
              Tienda
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted">
              <li><Link href="/" className={link}>Inicio</Link></li>
              <li><Link href="/catalogo" className={link}>Catálogo</Link></li>
              <li><Link href="/favoritos" className={link}>Favoritos</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-pedido">
            <p id="footer-pedido" className="mb-3 text-sm font-semibold">
              Tu pedido
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted">
              <li><Link href="/carrito" className={link}>Mi pedido</Link></li>
              <li><Link href="/pedido" className={link}>Seguir mi pedido</Link></li>
            </ul>
          </nav>
        </div>
        <p className="mt-8 border-t border-border pt-5 text-xs text-muted">
          © {site.name}
        </p>
      </div>
    </footer>
  );
}
