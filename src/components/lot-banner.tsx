"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type OpenLot = { name: string; min_orders: number; deadline: string | null; count: number };

/** Lote abierto (solo números, sin datos de nadie). Se pide al abrir la página para que siempre esté al día. */
function useOpenLot() {
  const [lot, setLot] = useState<OpenLot | null>(null);
  useEffect(() => {
    let alive = true;
    createClient()
      .rpc("open_batch")
      .then(({ data }) => {
        if (alive) setLot((data as OpenLot | null) ?? null);
      });
    return () => {
      alive = false;
    };
  }, []);
  return lot;
}

function Progress({ lot }: { lot: OpenLot }) {
  const pct = Math.min(100, Math.round((lot.count / lot.min_orders) * 100));
  const full = lot.count >= lot.min_orders;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={lot.min_orders}
      aria-valuenow={Math.min(lot.count, lot.min_orders)}
      aria-label="Pedidos reunidos en el lote"
      className="h-2.5 overflow-hidden rounded-full bg-ivory/70"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${full ? "bg-honey" : "bg-navy"}`}
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </div>
  );
}

/**
 * Cómo va el lote: "4 de 10 pedidos". Compramos al proveedor cuando se junta el mínimo, así que
 * la clienta ve cuánto falta y por qué su pedido aún no sale.
 * `compact` = franja corta (inicio, catálogo); sin él = tarjeta (pedido).
 */
export function LotBanner({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const lot = useOpenLot();
  if (!lot) return null;

  const missing = Math.max(0, lot.min_orders - lot.count);
  const full = missing === 0;
  const headline = full ? "¡Lote completo!" : `Faltan ${missing} ${missing === 1 ? "pedido" : "pedidos"} para cerrar el lote`;

  if (compact) {
    return (
      <div className={`swap-in flex items-center gap-3 rounded-2xl bg-butter px-4 py-3 ${className}`}>
        {full ? <PackageCheck className="size-5 shrink-0 text-honey-ink" /> : <Users className="size-5 shrink-0 text-honey-ink" />}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-tight text-honey-ink">
            {lot.name}: {lot.count} de {lot.min_orders} pedidos
          </p>
          <div className="mt-1.5">
            <Progress lot={lot} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Lote abierto" className={`swap-in rounded-3xl bg-butter p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ivory shadow-soft">
          {full ? <PackageCheck className="size-5" strokeWidth={1.9} /> : <Users className="size-5" strokeWidth={1.9} />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight tracking-[-0.02em]">{headline}</p>
          <p className="mt-1 text-sm text-honey-ink">
            Hacemos el pedido al proveedor cuando juntamos {lot.min_orders} pedidos. Tu pedido entra en el {lot.name}.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Progress lot={lot} />
        <p className="mt-2 text-xs font-semibold tabular-nums text-honey-ink">
          {lot.count} de {lot.min_orders} pedidos
        </p>
      </div>
    </section>
  );
}
