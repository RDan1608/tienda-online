import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import { ProductImage } from "@/components/product-image";

/** Fila compacta de producto para carrito, favoritos y resumen del pedido. */
export function SummaryRow({
  product,
  children,
  meta,
  leaving = false,
}: {
  product: ProductSummary;
  children?: React.ReactNode;
  meta?: React.ReactNode;
  /** true mientras se anima su salida (se pliega y se desvanece) */
  leaving?: boolean;
}) {
  return (
    <li
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex gap-4 py-5">
      <Link href={`/producto/${product.slug}`} className="w-20 shrink-0 sm:w-24">
        <ProductImage
          path={product.imagePath}
          alt={product.name}
          categorySlug={product.categorySlug}
          sizes="96px"
          className="rounded-xl"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/producto/${product.slug}`} className="line-clamp-2 leading-snug hover:underline">
            {product.name}
          </Link>
          {meta ?? <p className="shrink-0 font-medium">{formatPrice(product.price)}</p>}
        </div>
        <div className="mt-auto pt-3">{children}</div>
      </div>
        </div>
      </div>
    </li>
  );
}
