import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { site } from "@/lib/site";
import { getBestSellers, getCategories, getNewArrivals } from "@/lib/data/catalog";
import { CategoryIcon } from "@/components/category-icon";
import { ProductGrid } from "@/components/product-card";

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-serif text-3xl font-medium sm:text-4xl">{title}</h2>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1.5 text-sm text-muted hover:text-navy"
      >
        Ver todo
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export default async function Home() {
  const [categories, bestSellers, newArrivals] = await Promise.all([
    getCategories(),
    getBestSellers(8),
    getNewArrivals(4),
  ]);

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-20">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">{site.description}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-5xl font-medium leading-[1.05] text-balance sm:text-7xl">
          {site.tagline}
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/catalogo"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-navy px-6 text-sm font-medium text-ivory transition hover:bg-navy/90 active:scale-[0.98]"
          >
            Ver catálogo <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/catalogo?sort=popular"
            className="inline-flex h-12 items-center rounded-full border border-border px-6 text-sm font-medium transition hover:border-steel"
          >
            Más vendidos
          </Link>
        </div>
      </section>

      <section aria-labelledby="categorias" className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="categorias" className="sr-only">Categorías</h2>
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {categories.map((c) => (
            <li key={c.id} className="snap-start">
              <Link
                href={`/catalogo?cat=${c.slug}`}
                className="flex w-32 flex-col items-center gap-3 rounded-2xl bg-powder/60 px-3 py-6 text-center text-sm transition hover:bg-powder sm:w-auto"
              >
                <CategoryIcon slug={c.slug} className="size-7 text-steel" strokeWidth={1.25} />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {bestSellers.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <SectionHeader title="Más vendidos" href="/catalogo?sort=popular" />
          <ProductGrid products={bestSellers} priorityCount={4} />
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
          <SectionHeader title="Novedades" href="/catalogo?sort=nuevo" />
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {bestSellers.length === 0 && (
        <p className="mx-auto mt-20 max-w-6xl px-4 text-muted sm:px-6">
          Pronto agregaremos productos. ¡Vuelve pronto!
        </p>
      )}
    </>
  );
}
