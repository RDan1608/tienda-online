"use client";

import { useState } from "react";
import Image from "next/image";
import { storageUrl } from "@/lib/env";
import { CategoryArt, categoryTone, defaultTone } from "@/components/illustrations";

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
    <div className={`relative aspect-[4/5] overflow-hidden rounded-[20px] bg-powder ${className}`}>
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
        // Sin foto: un fondo propio de la categoría, puntos sutiles y su ilustración (nunca un hueco vacío).
        <div
          className="absolute inset-0 grid place-items-center"
          style={{
            backgroundColor: (categorySlug && categoryTone[categorySlug]) || defaultTone,
            backgroundImage: "radial-gradient(rgb(54 77 102 / 0.07) 1px, transparent 1.2px)",
            backgroundSize: "14px 14px",
          }}
        >
          <CategoryArt slug={categorySlug} className="w-3/5 drop-shadow-[0_6px_10px_rgb(54_77_102/0.12)]" />
        </div>
      )}
    </div>
  );
}
