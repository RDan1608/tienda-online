"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites, useHydrated } from "@/lib/stores";
import type { ProductSummary } from "@/lib/types";

export function FavoriteButton({
  product,
  variant = "floating",
}: {
  product: ProductSummary;
  variant?: "floating" | "inline";
}) {
  const hydrated = useHydrated();
  const [popping, setPopping] = useState(false);
  const toggle = useFavorites((s) => s.toggle);
  const active = useFavorites((s) => s.items.some((i) => i.id === product.id)) && hydrated;

  const label = active ? "Quitar de favoritos" : "Agregar a favoritos";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (!active) setPopping(true); // el pulso solo al agregar, no al quitar
        toggle(product);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={
        variant === "floating"
          ? "grid size-9 place-items-center rounded-full bg-ivory/85 text-navy backdrop-blur transition hover:bg-ivory active:scale-90"
          : "grid size-12 shrink-0 place-items-center rounded-full border border-border text-navy transition hover:border-steel active:scale-90"
      }
    >
      <Heart
        className={`size-[18px] transition-colors duration-200 ${active ? "fill-navy" : ""} ${popping ? "pop" : ""}`}
        onAnimationEnd={() => setPopping(false)}
        strokeWidth={1.75}
      />
    </button>
  );
}
