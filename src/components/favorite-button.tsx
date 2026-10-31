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
        if (!active) setPopping(true); // el pulso y los destellos solo al agregar, no al quitar
        toggle(product);
      }}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`relative grid place-items-center rounded-full transition-[transform,background-color,border-color] duration-150 ease-out before:absolute before:-inset-1 active:scale-90 ${
        variant === "floating"
          ? `size-9 shadow-soft backdrop-blur ${active ? "bg-blush" : "bg-ivory/90 hover:bg-ivory"}`
          : `size-12 shrink-0 border ${active ? "border-rose/40 bg-blush" : "border-border hover:border-steel"}`
      }`}
    >
      <Heart
        className={`transition-colors duration-200 ${variant === "inline" ? "size-[22px]" : "size-[18px]"} ${
          active ? "fill-rose text-rose" : "text-navy"
        } ${popping ? "pop" : ""}`}
        onAnimationEnd={() => setPopping(false)}
        strokeWidth={1.9}
      />
      {popping && (
        <span aria-hidden className="burst">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <i key={a} style={{ "--a": `${a}deg` } as React.CSSProperties} />
          ))}
        </span>
      )}
    </button>
  );
}
