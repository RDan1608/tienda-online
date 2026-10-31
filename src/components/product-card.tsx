import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { toSummary, type Product } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { FavoriteButton } from "@/components/favorite-button";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const image = product.images[0];

  return (
    <article className="group relative">
      <Link href={`/producto/${product.slug}`} className="block focus-visible:outline-none">
        <ProductImage
          path={image?.path ?? null}
          alt={image?.alt || product.name}
          categorySlug={product.category?.slug ?? null}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="group-focus-visible:ring-2 group-focus-visible:ring-steel"
        />
        <div className="mt-3 space-y-0.5 px-0.5">
          {product.category && (
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              {product.category.name}
            </p>
          )}
          <h3 className="line-clamp-2 text-[15px] leading-snug">{product.name}</h3>
          <p className="text-[15px] font-medium">{formatPrice(product.price)}</p>
        </div>
      </Link>
      <div className="absolute right-2.5 top-2.5">
        <FavoriteButton product={toSummary(product)} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-powder/70" />
          <div className="mt-3 h-3 w-1/3 rounded bg-powder/70" />
          <div className="mt-2 h-4 w-3/4 rounded bg-powder/70" />
          <div className="mt-2 h-4 w-1/4 rounded bg-powder/70" />
        </div>
      ))}
    </div>
  );
}
