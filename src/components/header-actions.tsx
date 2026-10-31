"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { cartCount, useCart, useFavorites, useHydrated } from "@/lib/stores";

export function Badge({ value }: { value: number }) {
  // Estado derivado durante el render (patrón recomendado): detecta cuando el número SUBE.
  const [prev, setPrev] = useState(value);
  const [bump, setBump] = useState(0);
  if (value !== prev) {
    setPrev(value);
    if (prev > 0 && value > prev) setBump((b) => b + 1);
  }

  if (!value) return null;
  return (
    <span
      key={bump}
      className={`${bump ? "pop" : "pill-in"} absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-navy px-1 text-[10px] font-medium leading-[18px] text-ivory`}>
      {value > 99 ? "99+" : value}
    </span>
  );
}

export function useCounts() {
  const hydrated = useHydrated();
  const cart = useCart((s) => cartCount(s.items));
  const favs = useFavorites((s) => s.items.length);
  return hydrated ? { cart, favs } : { cart: 0, favs: 0 };
}

export function HeaderActions() {
  const { cart, favs } = useCounts();
  const btn =
    "relative grid size-10 place-items-center rounded-full text-navy transition hover:bg-powder/70";

  return (
    <div className="flex items-center gap-1">
      <Link href="/catalogo#buscar" className={btn} aria-label="Buscar">
        <Search className="size-5" strokeWidth={1.75} />
      </Link>
      <Link href="/favoritos" className={`${btn} max-md:hidden`} aria-label={`Favoritos (${favs})`}>
        <Heart className="size-5" strokeWidth={1.75} />
        <Badge value={favs} />
      </Link>
      <Link href="/carrito" className={`${btn} max-md:hidden`} aria-label={`Carrito (${cart})`}>
        <ShoppingBag className="size-5" strokeWidth={1.75} />
        <Badge value={cart} />
      </Link>
    </div>
  );
}

