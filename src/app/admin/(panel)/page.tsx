import Link from "next/link";
import { Box, ClipboardList, Plus, Tags } from "lucide-react";
import { requireAdmin } from "@/lib/admin";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [products, categories, orders] = await Promise.all([
    supabase.from("products").select("is_active"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("status"),
  ]);

  const active = products.data?.filter((p) => p.is_active).length ?? 0;
  const hidden = (products.data?.length ?? 0) - active;
  const newOrders = orders.data?.filter((o) => o.status === "nuevo").length ?? 0;

  const cards = [
    { label: "Pedidos nuevos", value: newOrders, icon: ClipboardList, hint: `${orders.data?.length ?? 0} en total` },
    { label: "Productos activos", value: active, icon: Box, hint: hidden ? `${hidden} ocultos` : "Todos visibles", href: "/admin/productos" },
    { label: "Categorías", value: categories.count ?? 0, icon: Tags, hint: "Organizan el catálogo", href: "/admin/categorias" },
  ];

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-medium">Resumen</h1>
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
    </>
  );
}
