import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChevronRight, PackageCheck, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { advanceBatch, closeBatch, updateBatch } from "./actions";

export const metadata: Metadata = { title: "Lotes" };

type Batch = {
  id: string;
  name: string;
  min_orders: number;
  status: "abierto" | "cerrado";
  deadline: string | null;
  closed_at: string | null;
  created_at: string;
};
type Line = { product_id: string | null; name_snapshot: string; qty: number; price_snapshot: number };
type LotOrder = {
  id: string;
  code: string;
  customer_name: string;
  status: OrderStatus;
  total: number;
  batch_id: string;
  items: Line[];
};

const input =
  "h-12 w-full rounded-2xl border border-border bg-ivory px-4 text-base outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";

// Etapa "común" de un lote cerrado: la más atrasada entre sus pedidos activos.
const order: OrderStatus[] = ["nuevo", "confirmado", "preparando", "en_camino", "listo", "entregado"];
const stageName: Record<string, string> = {
  preparando: "Pedido realizado",
  en_camino: "En camino",
  listo: "Listo para entrega",
  entregado: "Entregado",
};

export default async function LotsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: batches }, { data: orders }] = await Promise.all([
    supabase.from("batches").select("id, name, min_orders, status, deadline, closed_at, created_at").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, code, customer_name, status, total, batch_id, items:order_items(product_id, name_snapshot, qty, price_snapshot)")
      .not("batch_id", "is", null)
      .neq("status", "cancelado"),
  ]);

  const lots = (batches ?? []) as Batch[];
  const all = (orders ?? []) as unknown as LotOrder[];
  const open = lots.find((b) => b.status === "abierto") ?? null;
  const closed = lots.filter((b) => b.status === "cerrado").slice(0, 8);
  const byLot = (id: string) => all.filter((o) => o.batch_id === id);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Lotes</h1>
      <p className="mt-1 text-sm text-muted">
        Los pedidos se reúnen en un lote. Cuando se junta el mínimo, haces el pedido al proveedor y avisas a todos de una vez.
      </p>

      {open ? <OpenLot lot={open} orders={byLot(open.id)} /> : <p className="mt-8 rounded-3xl bg-powder/50 p-6 text-center text-muted">No hay un lote abierto. Se crea uno nuevo al cerrar el actual.</p>}

      {closed.length > 0 && (
        <section aria-labelledby="cerrados" className="mt-12">
          <h2 id="cerrados" className="font-display text-xl font-bold tracking-[-0.025em]">
            Lotes cerrados
          </h2>
          <ul className="mt-3 space-y-3">
            {closed.map((b) => (
              <ClosedLot key={b.id} lot={b} orders={byLot(b.id)} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function OpenLot({ lot, orders }: { lot: Batch; orders: LotOrder[] }) {
  const count = orders.length;
  const confirmed = orders.filter((o) => o.status !== "nuevo").length;
  const missing = Math.max(0, lot.min_orders - count);
  const ready = missing === 0;
  const pct = Math.min(100, Math.round((count / lot.min_orders) * 100));

  // Qué comprar al proveedor: todo lo de los pedidos confirmados, sumado por producto.
  const toBuy = new Map<string, { name: string; qty: number }>();
  for (const o of orders.filter((o) => o.status !== "nuevo"))
    for (const i of o.items) {
      const key = i.product_id ?? i.name_snapshot;
      const cur = toBuy.get(key) ?? { name: i.name_snapshot, qty: 0 };
      cur.qty += i.qty;
      toBuy.set(key, cur);
    }
  const buyList = [...toBuy.values()].sort((a, b) => b.qty - a.qty);
  const units = buyList.reduce((n, l) => n + l.qty, 0);
  const worth = orders.filter((o) => o.status !== "nuevo").reduce((n, o) => n + Number(o.total), 0);

  return (
    <section aria-labelledby="abierto" className="mt-6">
      <div className={`rounded-[28px] p-6 ${ready ? "bg-navy text-ivory" : "bg-surface ring-1 ring-border"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${ready ? "text-ivory/70" : "text-muted"}`}>Lote abierto</p>
            <h2 id="abierto" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
              {lot.name}
            </h2>
          </div>
          {ready && <PackageCheck className="size-8" strokeWidth={1.5} />}
        </div>

        <p className="mt-5 text-4xl font-extrabold tabular-nums tracking-[-0.04em]">
          {count} <span className={`text-xl font-semibold ${ready ? "text-ivory/70" : "text-muted"}`}>de {lot.min_orders} pedidos</span>
        </p>
        <div className={`mt-3 h-3 overflow-hidden rounded-full ${ready ? "bg-ivory/20" : "bg-powder"}`} role="progressbar" aria-valuemin={0} aria-valuemax={lot.min_orders} aria-valuenow={Math.min(count, lot.min_orders)} aria-label="Pedidos del lote">
          <div className={`h-full rounded-full transition-[width] duration-700 ${ready ? "bg-honey" : "bg-navy"}`} style={{ width: `${Math.max(pct, 3)}%` }} />
        </div>
        <p className={`mt-3 text-sm ${ready ? "text-ivory/85" : "text-muted"}`}>
          {ready ? "¡Mínimo alcanzado! Ya puedes hacer el pedido al proveedor." : `Faltan ${missing} ${missing === 1 ? "pedido" : "pedidos"} para el mínimo.`}{" "}
          {confirmed} confirmados · {count - confirmed} por confirmar
          {lot.deadline && ` · fecha límite ${new Date(lot.deadline + "T12:00:00").toLocaleDateString("es-HN", { day: "numeric", month: "long" })}`}
        </p>
      </div>

      {buyList.length > 0 && (
        <div className="mt-4 rounded-3xl bg-surface p-5 ring-1 ring-border">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-lg font-bold tracking-[-0.02em]">Qué pedir al proveedor</h3>
            <p className="text-sm text-muted">
              {units} {units === 1 ? "pieza" : "piezas"} · {formatPrice(worth)}
            </p>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {buyList.map((l) => (
              <li key={l.name} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                <span className="min-w-0 truncate">{l.name}</span>
                <span className="shrink-0 rounded-full bg-powder px-3 py-1 text-sm font-bold tabular-nums">× {l.qty}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Solo cuentan los pedidos ya confirmados.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-4 rounded-3xl bg-surface ring-1 ring-border">
          <h3 className="px-5 pt-5 font-display text-lg font-bold tracking-[-0.02em]">Pedidos del lote</h3>
          <ul className="mt-2 divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 transition active:bg-powder/40">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{o.customer_name}</p>
                    <p className="text-xs tabular-nums text-muted">
                      {o.code} · {o.status === "nuevo" ? "Por confirmar" : "Confirmado"}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold tabular-nums">{formatPrice(o.total)}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ajustes del lote */}
      <details className="group mt-4 rounded-3xl bg-surface ring-1 ring-border">
        <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          Ajustes del lote
          <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" />
        </summary>
        <form action={updateBatch} className="space-y-3 border-t border-border p-5">
          <input type="hidden" name="id" value={lot.id} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Nombre</span>
            <input name="name" defaultValue={lot.name} maxLength={60} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Pedidos necesarios para cerrar</span>
            <input name="min_orders" type="number" inputMode="numeric" min={1} max={1000} defaultValue={lot.min_orders} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Fecha límite (opcional)</span>
            <input name="deadline" type="date" defaultValue={lot.deadline ?? ""} className={input} />
          </label>
          <button className="h-12 w-full rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98]">Guardar ajustes</button>
        </form>
      </details>

      {/* Cerrar el lote */}
      <details className="group mt-4 overflow-hidden rounded-3xl ring-1 ring-border">
        <summary className={`flex h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden ${ready ? "bg-navy text-ivory" : "bg-surface"}`}>
          Cerrar lote y hacer el pedido al proveedor
          <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
        </summary>
        <form action={closeBatch} className="space-y-3 bg-surface p-5">
          <input type="hidden" name="id" value={lot.id} />
          <p className="text-sm">
            {confirmed} {confirmed === 1 ? "pedido confirmado pasa" : "pedidos confirmados pasan"} a <strong>Pedido realizado</strong>.
            {count - confirmed > 0 && ` ${count - confirmed} sin confirmar ${count - confirmed === 1 ? "pasa" : "pasan"} al siguiente lote.`}
          </p>
          {!ready && <p className="rounded-2xl bg-butter p-3 text-sm text-honey-ink">Aún no se llega al mínimo ({count} de {lot.min_orders}). Puedes cerrarlo igual.</p>}
          <button className="h-12 w-full rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98]">Sí, cerrar el lote</button>
        </form>
      </details>
    </section>
  );
}

function ClosedLot({ lot, orders }: { lot: Batch; orders: LotOrder[] }) {
  const stages = orders.map((o) => order.indexOf(o.status)).filter((i) => i >= 2);
  const slowest = stages.length ? order[Math.min(...stages)] : null;
  const done = orders.length > 0 && orders.every((o) => o.status === "entregado");
  const next = slowest === "preparando" ? { value: "en_camino", label: "Marcar en camino", icon: Truck } : slowest === "en_camino" ? { value: "listo", label: "Llegó: listo para entrega", icon: PackageCheck } : slowest === "listo" ? { value: "entregado", label: "Marcar todos entregados", icon: CheckCircle2 } : null;

  return (
    <li className="rounded-3xl bg-surface p-5 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold tracking-[-0.02em]">{lot.name}</p>
          <p className="text-sm text-muted">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
            {lot.closed_at && ` · cerrado ${new Date(lot.closed_at).toLocaleDateString("es-HN", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${done ? "bg-powder text-navy" : "bg-navy text-ivory"}`}>
          {done ? "Entregado" : slowest ? stageName[slowest] : "—"}
        </span>
      </div>
      {next && (
        <form action={advanceBatch} className="mt-4">
          <input type="hidden" name="id" value={lot.id} />
          <button
            name="status"
            value={next.value}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98]"
          >
            <next.icon className="size-[18px]" /> {next.label}
          </button>
          <p className="mt-2 text-center text-xs text-muted">Cambia a todos los pedidos de este lote de una vez.</p>
        </form>
      )}
    </li>
  );
}
