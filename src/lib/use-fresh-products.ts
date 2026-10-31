"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProductSummary } from "@/lib/types";

/**
 * Al abrir carrito/favoritos, trae datos actuales de la BD (precio, nombre, imagen)
 * y le pasa el resultado a `onSync`. RLS solo devuelve productos activos,
 * así que los desactivados desaparecen solos. Devuelve cuántos se quitaron.
 */
export function useFreshProducts(
  ids: string[],
  hydrated: boolean,
  onSync: (fresh: ProductSummary[]) => void,
) {
  const [removed, setRemoved] = useState(0);
  const done = useRef(false);
  const key = ids.join(",");

  useEffect(() => {
    if (!hydrated || done.current || !key) return;
    done.current = true;
    const list = key.split(",");

    createClient()
      .from("products")
      .select("id, name, slug, price, category:categories(slug), images:product_images(path, sort_order)")
      .in("id", list)
      .then(({ data, error }) => {
        if (error || !data) return;
        const fresh: ProductSummary[] = data.map((p) => {
          const images = [...((p.images as { path: string; sort_order: number }[]) ?? [])].sort(
            (a, b) => a.sort_order - b.sort_order,
          );
          const category = p.category as unknown as { slug: string } | null;
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            imagePath: images[0]?.path ?? null,
            categorySlug: category?.slug ?? null,
          };
        });
        setRemoved(list.length - fresh.length);
        onSync(fresh);
      });
  }, [hydrated, key, onSync]);

  return removed;
}
