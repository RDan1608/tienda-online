import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { env, storageUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { toSummary } from "@/lib/types";
import { getProductBySlug, getRelated, getStaticProductSlugs } from "@/lib/data/catalog";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-card";
import { ProductBuy } from "@/components/product-buy";
import { FavoriteButton } from "@/components/favorite-button";
import { Gallery } from "./gallery";

export async function generateStaticParams() {
  return getStaticProductSlugs();
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  const image = product.images[0];
  return {
    title: product.name,
    description: product.description.slice(0, 160) || site.description,
    alternates: { canonical: `/producto/${product.slug}` },
    // Un `openGraph: undefined` aquí borraría también el del layout raíz.
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "es_HN",
      title: product.name,
      description: product.description.slice(0, 160) || site.description,
      url: `/producto/${product.slug}`,
      // Sin foto del producto, se comparte la imagen general del sitio.
      images: [image ? storageUrl(image.path) : "/opengraph-image"],
    },
  };
}

export default function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 max-md:pb-20 sm:px-6 sm:pt-10">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-navy"
      >
        <ChevronLeft className="size-4" /> Catálogo
      </Link>
      <Suspense fallback={<ProductFallback />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/producto/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const summary = toSummary(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.map((i) => storageUrl(i.path)),
    category: product.category?.name,
    url: `${env.siteUrl}/producto/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "HNL",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" escapado para que el contenido del producto no pueda cerrar la etiqueta.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Gallery
          images={product.images}
          name={product.name}
          categorySlug={product.category?.slug ?? null}
        />

        <div className="md:sticky md:top-24 md:self-start">
          {product.category && (
            <Link
              href={`/catalogo?cat=${product.category.slug}`}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-navy"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-[2rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-balance sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="font-display text-[1.75rem] font-extrabold tabular-nums tracking-[-0.03em]">
              {formatPrice(product.price)}
            </p>
            <FavoriteButton product={summary} variant="inline" />
          </div>

          <div className="mt-6">
            <ProductBuy product={summary} />
          </div>

          {product.description && (
            <section className="mt-6 rounded-3xl bg-surface p-5 shadow-soft ring-1 ring-border" aria-labelledby="detalles">
              <h2 id="detalles" className="sr-only">
                Detalles
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-navy/90">{product.description}</p>
              {product.tags.length > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-border pt-4 text-sm">
                  <span className="text-muted">Estilo:</span>
                  {product.tags.map((t, i) => (
                    <span key={t}>
                      <Link
                        href={`/catalogo?tag=${encodeURIComponent(t)}`}
                        className="font-semibold capitalize underline-offset-4 hover:underline"
                      >
                        {t}
                      </Link>
                      {i < product.tags.length - 1 && ","}
                    </span>
                  ))}
                </p>
              )}
            </section>
          )}

        </div>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <Related product={product} />
      </Suspense>
    </>
  );
}

async function Related({ product }: { product: Parameters<typeof getRelated>[0] }) {
  const related = await getRelated({ id: product.id, category: product.category });
  if (!related.length) return null;
  return (
    <section className="mt-24">
      <h2 className="mb-6 font-display text-3xl font-semibold tracking-[-0.025em]">También te puede gustar</h2>
      <ProductGrid products={related} />
    </section>
  );
}

function ProductFallback() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12" aria-hidden>
      <div className="aspect-[4/5] shimmer rounded-2xl" />
      <div className="space-y-4">
        <div className="h-3 w-24 shimmer rounded" />
        <div className="h-10 w-3/4 shimmer rounded" />
        <div className="h-7 w-28 shimmer rounded" />
        <div className="h-12 shimmer rounded-full" />
      </div>
    </div>
  );
}
