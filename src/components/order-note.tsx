import Link from "next/link";
import { Route } from "lucide-react";

/**
 * Aviso para quien pide: sin mencionar mínimos ni cifras internas. Explica que el pedido se compra por
 * encargo y que cada etapa se puede seguir, que es lo que a la clienta le importa.
 */
export function OrderNote({ className = "" }: { className?: string }) {
  return (
    <section aria-label="Cómo funciona tu pedido" className={`rounded-3xl bg-butter p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ivory shadow-soft">
          <Route className="size-5" strokeWidth={1.9} />
        </span>
        <div>
          <p className="font-display text-lg font-bold leading-tight tracking-[-0.02em]">Tu pedido es por encargo</p>
          <p className="mt-1 text-sm text-honey-ink">
            Primero te escribimos para confirmarlo y después lo pedimos a nuestro proveedor. Puedes ver en qué etapa va en{" "}
            <Link href="/pedido" className="font-semibold underline underline-offset-2">
              Seguir mi pedido
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
