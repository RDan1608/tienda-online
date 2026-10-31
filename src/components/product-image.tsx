"use client";

import { useState } from "react";
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
  // Solo las imágenes diferidas se funden al cargar; la principal (LCP) se muestra de inmediato.
  const [loaded, setLoaded] = useState(!!priority);

  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl bg-powder ${className}`}>
      {path ? (
        <Image
          src={storageUrl(path)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          // Si ya cargó antes de hidratar, onLoad no se dispara: se detecta aquí.
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          className={`object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-powder to-dusty/60">
          <CategoryIcon slug={categorySlug} className="size-10 text-steel" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}
