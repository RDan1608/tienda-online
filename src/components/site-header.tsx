import Link from "next/link";
import { site } from "@/lib/site";
import { HeaderActions } from "@/components/header-actions";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catalogo?sort=popular", label: "Más vendidos" },
  { href: "/catalogo?sort=nuevo", label: "Novedades" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Secciones" className="hidden items-center gap-7 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted transition-colors hover:text-navy">
              {l.label}
            </Link>
          ))}
        </nav>
        <HeaderActions />
      </div>
    </header>
  );
}
