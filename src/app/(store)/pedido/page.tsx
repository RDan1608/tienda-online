import type { Metadata } from "next";
import { TrackView } from "./track-view";

export const metadata: Metadata = { title: "Seguir mi pedido", robots: { index: false } };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-display text-[2rem] font-extrabold leading-none tracking-[-0.04em] sm:text-5xl">Seguir mi pedido</h1>
      <p className="mt-3 text-[15px] text-muted">Escribe el código que te dimos y el teléfono con el que pediste.</p>
      <TrackView />
    </div>
  );
}
