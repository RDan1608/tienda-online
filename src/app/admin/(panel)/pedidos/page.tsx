import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Search, X } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { dayLabel, isOrderStatus, orderStatuses, type OrderStatus } from "@/lib/orders";
import { coversFor } from "./covers";
import { OrderRow, type OrderRowData } from "./order-row";

export const metadata: Metadata = { title: "Pedidos" };

type Row = OrderRowData & { items: { qty: number; product_id: string | null; name_snapshot: string }[] };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const filter = isOrderStatus(sp.estado) ? sp.estado : null;
  // Se quitan los caracteres que tienen significado en el filtro de PostgREST.
  const q = (typeof sp.q === "string" ? sp.q : "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);

  let query = supabase
    .from("orders")
    .select("id, code, customer_name, phone, total, status, created_at, items:order_items(qty, product_id, name_snapshot)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter) query = query.eq("status", filter);
  if (q) query = query.or(`code.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`);

  const [{ data }, { data: all }] = await Promise.all([query, supabase.from("orders").select("status")]);
  const rows = (data ?? []) as unknown as Row[];
  const covers = await coversFor(supabase, rows.flatMap((o) => o.items.map((i) => i.product_id)));
  const orders = rows.map((o) => ({
    ...o,
    units: o.items.reduce((n, i) => n + i.qty, 0),
    thumbs: o.items.map((i) => ({ path: (i.product_id && covers.get(i.product_id)) || null, name: i.name_snapshot })),
  }));

  const counts = new Map<string, number>();
  for (const o of all ?? []) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);

  const href = (estado: OrderStatus | null) => {
    const p = new URLSearchParams();
    if (estado) p.set("estado", estado);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/admin/pedidos${s ? `?${s}` : ""}`;
  };
  const tabs = [
    { key: "todos", href: href(null), label: "Todos", count: all?.length ?? 0, active: !filter },
    ...orderStatuses.map((s) => ({
      key: s.value,
      href: href(s.value),
      label: s.plural,
      count: counts.get(s.value) ?? 0,
      active: filter === s.value,
    })),
  ];

  // Agrupados por día (Hoy, Ayer, fecha) para ubicarse sin leer cada hora.
  const groups: { label: string; rows: typeof orders }[] = [];
  for (const o of orders) {
    const label = dayLabel(o.created_at);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.rows.push(o);
    else groups.push({ label, rows: [o] });
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Pedidos</h1>

      <form role="search" action="/admin/pedidos" className="relative mt-5">
        {filter && <input type="hidden" name="estado" value={filter} />}
        <label>
          <span className="sr-only">Buscar pedidos por código, nombre o teléfono</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            key={q}
            placeholder="Buscar por código, nombre o teléfono…"
            className="h-12 w-full rounded-full border border-transparent bg-powder/70 pl-11 pr-11 text-[15px] outline-none transition placeholder:text-muted/80 focus:border-steel focus:bg-surface focus:ring-4 focus:ring-powder"
          />
        </label>
        {q && (
          <Link
            href={filter ? `/admin/pedidos?estado=${filter}` : "/admin/pedidos"}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-powder hover:text-navy"
          >
            <X className="size-4" />
          </Link>
        )}
      </form>

      {/* Estados como pestañas con subrayado, igual que las categorías de la tienda */}
      <div className="-mx-4 mt-3 border-b border-border/70 sm:-mx-6">
        <nav aria-label="Filtrar por estado" className="flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={`relative inline-flex h-12 shrink-0 items-center gap-1.5 text-[15px] transition-colors ${
                t.active ? "font-bold text-navy" : "font-medium text-muted hover:text-navy"
              }`}
            >
              {t.label}
              <span className={`text-xs tabular-nums ${t.active ? "text-navy" : "text-muted"}`}>{t.count}</span>
              <span
                aria-hidden
                className={`absolute inset-x-0 bottom-0 h-[3px] origin-left rounded-full bg-navy transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  t.active ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>
          ))}
        </nav>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-powder/50 px-6 py-14 text-center">
          <Inbox className="mx-auto size-8 text-steel" strokeWidth={1.25} />
          <p className="mt-3 text-muted">
            {q || filter
              ? "No hay pedidos con esos filtros."
              : "Aún no hay pedidos. Cuando lleguen, aparecerán aquí al instante."}
          </p>
          {(q || filter) && (
            <Link href="/admin/pedidos" className="mt-4 inline-flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-ivory">
              Ver todos
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          <p className="text-[15px] font-bold tabular-nums" aria-live="polite">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </p>
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted first-letter:uppercase">{g.label}</h2>
              <ul className="space-y-3">
                {g.rows.map((o) => (
                  <OrderRow key={o.id} o={o} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
