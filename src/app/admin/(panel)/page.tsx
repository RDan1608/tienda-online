import Link from "next/link";
import { Box, ClipboardList, Plus, Tags } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatPrice, timeAgo } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { StatusBadge } from "./pedidos/status-badge";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [products, categories, orders, recent] = await Promise.all([
    supabase.from("products").select("is_active"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("status"),
    supabase
      .from("orders")
      .select("id, code, customer_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const active = products.data?.filter((p) => p.is_active).length ?? 0;
  const hidden = (products.data?.length ?? 0) - active;
  const newOrders = orders.data?.filter((o) => o.status === "nuevo").length ?? 0;

  const cards = [
    { label: "Pedidos nuevos", value: newOrders, icon: ClipboardList, hint: `${orders.data?.length ?? 0} en total`, href: "/admin/pedidos" },
    { label: "Productos activos", value: active, icon: Box, hint: hidden ? `${hidden} ocultos` : "Todos visibles", href: "/admin/productos" },
    { label: "Categorías", value: categories.count ?? 0, icon: Tags, hint: "Organizan el catálogo", href: "/admin/categorias" },
  ];

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-[-0.025em]">Resumen</h1>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-ivory transition active:scale-[0.98]"
        >
          <Plus className="size-4" /> Nuevo producto
        </Link>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, hint, href }) => {
          const body = (
            <>
              <Icon className="size-5 text-steel" strokeWidth={1.5} />
              <p className="mt-4 text-4xl font-medium tabular-nums">{value}</p>
              <p className="mt-1 text-sm">{label}</p>
              <p className="text-xs text-muted">{hint}</p>
            </>
          );
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className="block rounded-3xl bg-surface p-5 ring-1 ring-border transition hover:ring-steel">
                  {body}
                </Link>
              ) : (
                <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {recent.data && recent.data.length > 0 && (
        <section className="mt-12">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.025em]">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm text-muted hover:text-navy">
              Ver todos
            </Link>
          </div>
          <ul className="divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
            {recent.data.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/pedidos/${o.id}`}
                  className="flex items-center gap-3 p-4 transition first:rounded-t-3xl last:rounded-b-3xl hover:bg-powder/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium tabular-nums">{o.code}</span>
                      <StatusBadge status={o.status as OrderStatus} />
                    </p>
                    <p className="mt-1 truncate text-sm text-muted">
                      {o.customer_name} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">{formatPrice(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
