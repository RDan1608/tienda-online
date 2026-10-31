import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatPrice, timeAgo } from "@/lib/format";
import { isOrderStatus, orderStatuses, type OrderStatus } from "@/lib/orders";
import { StatusBadge } from "./status-badge";

export const metadata: Metadata = { title: "Pedidos" };

type Row = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  items: { qty: number }[];
};

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const { supabase } = await requireAdmin();
  const raw = (await searchParams).estado;
  const filter = isOrderStatus(raw) ? raw : null;

  let query = supabase
    .from("orders")
    .select("id, code, customer_name, phone, total, status, created_at, items:order_items(qty)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter) query = query.eq("status", filter);

  const [{ data }, { data: all }] = await Promise.all([query, supabase.from("orders").select("status")]);
  const orders = (data ?? []) as unknown as Row[];

  const counts = new Map<string, number>();
  for (const o of all ?? []) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);

  const tabs = [
    { href: "/admin/pedidos", label: "Todos", count: all?.length ?? 0, active: !filter },
    ...orderStatuses.map((s) => ({
      href: `/admin/pedidos?estado=${s.value}`,
      label: s.plural,
      count: counts.get(s.value) ?? 0,
      active: filter === s.value,
    })),
  ];

  return (
    <>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.025em]">Pedidos</h1>

      <nav aria-label="Filtrar por estado" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition ${
              t.active ? "border-navy bg-navy text-ivory" : "border-border bg-surface hover:border-steel"
            }`}
          >
            {t.label}
            <span className={t.active ? "text-ivory/70" : "text-muted"}>{t.count}</span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-powder/50 px-6 py-16 text-center">
          <Inbox className="mx-auto size-8 text-steel" strokeWidth={1.25} />
          <p className="mt-3 text-muted">
            {filter ? "No hay pedidos con este estado." : "Aún no hay pedidos. Cuando lleguen, aparecerán aquí al instante."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
          {orders.map((o) => {
            const units = o.items.reduce((n, i) => n + i.qty, 0);
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/pedidos/${o.id}`}
                  className="flex items-center gap-3 p-4 transition first:rounded-t-3xl last:rounded-b-3xl hover:bg-powder/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium tabular-nums">{o.code}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 truncate text-sm">{o.customer_name}</p>
                    <p className="text-xs text-muted">
                      {units} {units === 1 ? "producto" : "productos"} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatPrice(o.total)}</p>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
