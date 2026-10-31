"use client";

import { useState } from "react";
import Image from "next/image";
import { storageUrl } from "@/lib/env";
import type { ProductImage as Img } from "@/lib/types";
import { ProductImage } from "@/components/product-image";

export function Gallery({
  images,
  name,
  categorySlug,
}: {
  images: Img[];
  name: string;
  categorySlug: string | null;
}) {
  const [active, setActive] = useState(0);

  if (images.length <= 1) {
    return (
      <ProductImage
        path={images[0]?.path ?? null}
        alt={images[0]?.alt || name}
        categorySlug={categorySlug}
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* móvil: carrusel con scroll-snap; desktop: imagen principal + miniaturas */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden">
        {images.map((img, i) => (
          <div key={img.path} className="w-[85%] shrink-0 snap-center">
            <ProductImage
              path={img.path}
              alt={img.alt || `${name} (${i + 1})`}
              categorySlug={categorySlug}
              sizes="85vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <ProductImage
          path={images[active].path}
          alt={images[active].alt || name}
          categorySlug={categorySlug}
          sizes="50vw"
          priority
        />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition ${
                i === active ? "ring-2 ring-navy" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={storageUrl(img.path)} alt="" fill sizes="10vw" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
