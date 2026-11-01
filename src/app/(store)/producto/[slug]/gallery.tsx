"use client";

import { useRef, useState } from "react";
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
  const strip = useRef<HTMLDivElement>(null);

  if (images.length <= 1) {
    return (
      <ProductImage
        path={images[0]?.path ?? null}
        alt={images[0]?.alt || name}
        categorySlug={categorySlug}
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
        quality={90}
      />
    );
  }

  // Móvil: el índice sale de la posición del scroll (los puntos lo siguen sin JS de arrastre propio).
  function onScroll() {
    const el = strip.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 8 : el.clientWidth;
    const i = Math.round(el.scrollLeft / step);
    setActive((prev) => (prev === i ? prev : Math.min(Math.max(i, 0), images.length - 1)));
  }

  function goTo(i: number) {
    setActive(i);
    const el = strip.current;
    const target = el?.children[i] as HTMLElement | undefined;
    if (el && target) el.scrollTo({ left: target.offsetLeft - 16, behavior: "smooth" });
  }

  return (
    <div className="space-y-3">
      {/* móvil: carrusel con scroll-snap y puntos */}
      <div className="md:hidden">
        <div
          ref={strip}
          onScroll={onScroll}
          // enfocable: con teclado, las flechas desplazan entre fotos
          tabIndex={0}
          role="region"
          aria-label="Galería de fotos"
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none]"
        >
          {images.map((img, i) => (
            <div key={img.path} className="w-[85%] shrink-0 snap-center">
              <ProductImage
                path={img.path}
                alt={img.alt || `${name} (${i + 1})`}
                categorySlug={categorySlug}
                sizes="85vw"
                priority={i === 0}
                quality={90}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Fotos del producto">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Foto ${i + 1} de ${images.length}`}
              onClick={() => goTo(i)}
              className="grid size-6 place-items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out ${
                  i === active ? "w-5 bg-navy" : "w-1.5 bg-dusty"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* escritorio: imagen principal con fundido cruzado + miniaturas */}
      <div className="hidden md:block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-powder">
          {images.map((img, i) => (
            <Image
              key={img.path}
              src={storageUrl(img.path)}
              alt={img.alt || `${name} (${i + 1})`}
              fill
              sizes="50vw"
              quality={90}
              priority={i === 0}
              className={`object-cover transition-opacity duration-300 ease-out ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.path}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory transition-[opacity,box-shadow] duration-200 active:scale-95 ${
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
