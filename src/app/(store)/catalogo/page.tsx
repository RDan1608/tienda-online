import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { createSerializer } from "nuqs/server";
import { catalogParsers, loadCatalogParams } from "@/lib/catalog-params";
import { getCategories, getProducts, getTagFacets } from "@/lib/data/catalog";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import { CatalogShell } from "./catalog-filters";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora joyería, peluches, pines, llaveros, phone charms y legos.",
  alternates: { canonical: "/catalogo" },
};

const serialize = createSerializer(catalogParsers);

export default function CatalogPage({ searchParams }: PageProps<"/catalogo">) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
      <h1 className="mb-6 font-serif text-4xl font-medium sm:text-5xl">Catálogo</h1>
      <Suspense fallback={<CatalogFallback />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/catalogo">, "searchParams">) {
  const filters = loadCatalogParams(await searchParams);
  const [categories, tags, { products, total, page }] = await Promise.all([
    getCategories(),
    getTagFacets(),
    getProducts(filters),
  ]);

  return (
    // El adaptador de nuqs solo se necesita aquí: así el resto de páginas no descarga esa librería.
    <NuqsAdapter>
    <CatalogShell categories={categories} tags={tags} total={total}>
      {products.length ? (
        <>
          <h2 className="sr-only">Productos</h2>
          <ProductGrid products={products} priorityCount={4} />
          {products.length < total && (
            <div className="mt-12 flex justify-center">
              <Link
                href={serialize("/catalogo", { ...filters, page: page + 1 })}
                scroll={false}
                className="inline-flex h-12 items-center rounded-full border border-border px-8 text-sm font-medium transition hover:border-steel"
              >
                Ver más ({total - products.length})
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl bg-powder/50 px-6 py-16 text-center">
          <p className="font-serif text-2xl">No encontramos productos</p>
          <p className="mt-2 text-sm text-muted">Prueba con otra búsqueda o quita algunos filtros.</p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-medium text-ivory"
          >
            Ver todo el catálogo
          </Link>
        </div>
      )}
    </CatalogShell>
    </NuqsAdapter>
  );
}

function CatalogFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 animate-pulse rounded-full bg-powder/70" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-powder/70" />
        ))}
      </div>
      <div className="pt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
