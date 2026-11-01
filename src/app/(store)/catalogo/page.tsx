import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { getCatalogItems, getCategories } from "@/lib/data/catalog";
import { ProductGridSkeleton } from "@/components/product-card";
import { CatalogClient } from "./catalog-client";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora joyería, peluches, pines, llaveros, phone charms y legos.",
  alternates: { canonical: "/catalogo" },
};

export default function CatalogPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
      <h1 className="mb-6 font-display text-4xl font-semibold tracking-[-0.025em] sm:text-5xl">Catálogo</h1>
      <Suspense fallback={<CatalogFallback />}>
        <Catalog />
      </Suspense>
    </div>
  );
}

// Los datos son los mismos para todos y están en caché: el servidor solo los entrega una vez;
// después filtrar, ordenar y buscar ocurre en el navegador, sin esperas.
async function Catalog() {
  // Se genera en cada petición para que el HTML ya llegue con los filtros de la URL aplicados
  // (productos visibles para buscadores, sin esqueleto ni salto al abrir un link filtrado).
  await connection();
  const [items, categories] = await Promise.all([getCatalogItems(), getCategories()]);

  return (
    // El adaptador de nuqs solo se necesita aquí: el resto de páginas no descarga esa librería.
    <NuqsAdapter>
      <CatalogClient items={items} categories={categories} />
    </NuqsAdapter>
  );
}

function CatalogFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 shimmer rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 w-24 shimmer rounded-full" />
        ))}
      </div>
      <div className="pt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
