import Link from "next/link";
import { CheckCircle2, ChevronRight, ImageOff, Plus, TrendingUp } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { OrderRow } from "./pedidos/order-row";

const TZ = "America/Tegucigalpa";
const dayKey = (t: number | string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(t));
const currentTime = () => Date.now(); // fuera del componente: la página se genera en cada petición
const monthKey = (t: number | string) => dayKey(t).slice(0, 7);

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const [products, orders] = await Promise.all([
    supabase.from("products").select("id, is_active, images:product_images(path)"),
    supabase
      .from("orders")
      .select("id, code, customer_name, phone, total, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const all = (orders.data ?? []) as {
    id: string;
    code: string;
    customer_name: string;
    phone: string;
    total: number;
    status: OrderStatus;
    created_at: string;
  }[];
  const now = currentTime();
  const fresh = all.filter((o) => o.status === "nuevo");
  const today = all.filter((o) => dayKey(o.created_at) === dayKey(now));
  // Venta = pedidos que ya se confirmaron (no los nuevos sin atender ni los cancelados).
  const sold = all.filter((o) => ["confirmado", "preparando", "entregado"].includes(o.status));
  const monthSales = sold.filter((o) => monthKey(o.created_at) === monthKey(now)).reduce((n, o) => n + Number(o.total), 0);
  const inProgress = all.filter((o) => o.status === "confirmado" || o.status === "preparando").length;

  const list = products.data ?? [];
  const active = list.filter((p) => p.is_active).length;
  const hidden = list.length - active;
  const noPhoto = list.filter((p) => p.is_active && !(p.images as unknown[]).length).length;

  const stats = [
    { label: "Por atender", value: String(fresh.length), hint: fresh.length ? "Pedidos nuevos" : "Todo al día", href: "/admin/pedidos?estado=nuevo", accent: fresh.length > 0 },
    { label: "Ventas del mes", value: formatPrice(monthSales), hint: "Pedidos confirmados", href: "/admin/pedidos", accent: false },
    { label: "Pedidos hoy", value: String(today.length), hint: `${inProgress} en proceso`, href: "/admin/pedidos", accent: false },
    { label: "Productos activos", value: String(active), hint: hidden ? `${hidden} ocultos` : "Todos visibles", href: "/admin/productos", accent: false },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Resumen</h1>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-ivory transition active:scale-[0.97]"
        >
          <Plus className="size-4" /> Nuevo producto
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={`flex h-full flex-col rounded-3xl p-4 transition active:scale-[0.98] ${
                s.accent ? "bg-navy text-ivory" : "bg-surface ring-1 ring-border hover:ring-steel"
              }`}
            >
              <span className={`text-[13px] font-medium ${s.accent ? "text-ivory/80" : "text-muted"}`}>{s.label}</span>
              <span className="mt-2 text-[1.75rem] font-extrabold leading-none tabular-nums tracking-[-0.03em]">{s.value}</span>
              <span className={`mt-1.5 text-xs ${s.accent ? "text-ivory/75" : "text-muted"}`}>{s.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Lo que hay que hacer ahora */}
      <section aria-labelledby="atender" className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="atender" className="font-display text-xl font-bold tracking-[-0.025em]">
            Por atender
          </h2>
          {fresh.length > 0 && (
            <Link href="/admin/pedidos?estado=nuevo" className="inline-flex h-9 items-center gap-0.5 text-sm font-semibold text-muted hover:text-navy">
              Ver todos <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
        {fresh.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl bg-powder/50 p-5">
            <CheckCircle2 className="size-6 shrink-0 text-steel" strokeWidth={1.5} />
            <p className="text-[15px]">
              No hay pedidos nuevos. Cuando llegue uno, sonará aquí al instante.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {fresh.slice(0, 3).map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </ul>
        )}
      </section>

      {/* Avisos del catálogo */}
      {(noPhoto > 0 || hidden > 0) && (
        <section aria-labelledby="catalogo" className="mt-10">
          <h2 id="catalogo" className="mb-3 font-display text-xl font-bold tracking-[-0.025em]">
            Catálogo
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
            {noPhoto > 0 && (
              <li>
                <Link href="/admin/productos?ver=sinfoto" className="flex items-center gap-3 p-4 transition active:bg-powder/40">
                  <ImageOff className="size-5 shrink-0 text-steel" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px]">
                    {noPhoto} {noPhoto === 1 ? "producto activo sin foto" : "productos activos sin foto"}
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              </li>
            )}
            {hidden > 0 && (
              <li>
                <Link href="/admin/productos?ver=ocultos" className="flex items-center gap-3 p-4 transition active:bg-powder/40">
                  <TrendingUp className="size-5 shrink-0 text-steel" strokeWidth={1.5} />
                  <span className="flex-1 text-[15px]">
                    {hidden} {hidden === 1 ? "producto oculto" : "productos ocultos"} de la tienda
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      {all.some((o) => o.status !== "nuevo") && (
        <section aria-labelledby="recientes" className="mt-10">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="recientes" className="font-display text-xl font-bold tracking-[-0.025em]">
              Últimos pedidos
            </h2>
            <Link href="/admin/pedidos" className="inline-flex h-9 items-center gap-0.5 text-sm font-semibold text-muted hover:text-navy">
              Ver todos <ChevronRight className="size-4" />
            </Link>
          </div>
          <ul className="space-y-3">
            {all.filter((o) => o.status !== "nuevo").slice(0, 4).map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
