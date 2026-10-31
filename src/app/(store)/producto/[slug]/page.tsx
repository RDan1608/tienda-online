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
import { AddToCart } from "@/components/add-to-cart";
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
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
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
              className="text-xs uppercase tracking-[0.16em] text-muted hover:text-navy"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-serif text-4xl font-medium leading-tight text-balance sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl">{formatPrice(product.price)}</p>

          <div className="mt-8 flex items-start gap-3">
            <div className="flex-1">
              <AddToCart product={summary} />
            </div>
            <FavoriteButton product={summary} variant="inline" />
          </div>

          {product.description && (
            <div className="mt-6 whitespace-pre-line border-t border-border pt-6 leading-relaxed text-navy/85">
              {product.description}
            </div>
          )}

          {product.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <li key={t}>
                  <Link
                    href={`/catalogo?tag=${encodeURIComponent(t)}`}
                    className="inline-flex h-8 items-center rounded-full bg-powder px-3 text-xs capitalize hover:bg-dusty/60"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 rounded-2xl bg-powder/50 p-4 text-sm text-muted">{site.orderInfo}</p>
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
      <h2 className="mb-6 font-serif text-3xl font-medium">También te puede gustar</h2>
      <ProductGrid products={related} />
    </section>
  );
}

function ProductFallback() {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12" aria-hidden>
      <div className="aspect-[4/5] animate-pulse rounded-2xl bg-powder/70" />
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-powder/70" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-powder/70" />
        <div className="h-7 w-28 animate-pulse rounded bg-powder/70" />
        <div className="h-12 animate-pulse rounded-full bg-powder/70" />
      </div>
    </div>
  );
}
