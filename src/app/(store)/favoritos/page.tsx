import type { Metadata } from "next";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-display text-[2.25rem] font-extrabold leading-none tracking-[-0.04em] sm:text-5xl">Favoritos</h1>
      <p className="mt-2 text-sm text-muted">Se guardan en este dispositivo.</p>
      <FavoritesList />
    </div>
  );
}
