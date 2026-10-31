import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { toSummary, type CardProduct } from "@/lib/types";
import { ProductImage } from "@/components/product-image";
import { FavoriteButton } from "@/components/favorite-button";
import { CartButton } from "@/components/cart-button";

export function ProductCard({ product, priority }: { product: CardProduct; priority?: boolean }) {
  const image = product.images[0];
  const summary = toSummary(product);
  const href = `/producto/${product.slug}`;

  return (
    <article className="group relative">
      <div className="relative">
        {/* La imagen es un atajo táctil; el enlace accesible es el del nombre (evita duplicados al tabular). */}
        <Link href={href} tabIndex={-1} aria-hidden className="block">
          <ProductImage
            path={image?.path ?? null}
            alt=""
            categorySlug={product.category?.slug ?? null}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            priority={priority}
          />
        </Link>
        <div className="absolute right-2.5 top-2.5">
          <FavoriteButton product={summary} />
        </div>
        <div className="absolute bottom-2.5 right-2.5">
          <CartButton product={summary} variant="sm" />
        </div>
      </div>

      <Link href={href} className="mt-3 block space-y-0.5 rounded-md px-0.5">
        {product.category && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{product.category.name}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <p className="text-[15px] font-bold tabular-nums">{formatPrice(product.price)}</p>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: CardProduct[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <div key={p.id} className="card-in" style={{ "--i": i } as React.CSSProperties}>
          <ProductCard product={p} priority={i < priorityCount} />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-[20px] bg-powder/70" />
          <div className="mt-3 h-3 w-1/3 rounded bg-powder/70" />
          <div className="mt-2 h-4 w-3/4 rounded bg-powder/70" />
          <div className="mt-2 h-4 w-1/4 rounded bg-powder/70" />
        </div>
      ))}
    </div>
  );
}
