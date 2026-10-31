import Image from "next/image";
import { storageUrl } from "@/lib/env";
import { CategoryIcon } from "@/components/category-icon";

type Props = {
  path: string | null;
  alt: string;
  categorySlug: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Imagen 4:5 del producto, o un placeholder suave con el ícono de su categoría. */
export function ProductImage({ path, alt, categorySlug, sizes, priority, className = "" }: Props) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-powder ${className}`}>
      {path ? (
        <Image
          src={storageUrl(path)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-powder to-dusty/60">
          <CategoryIcon slug={categorySlug} className="size-10 text-steel" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
