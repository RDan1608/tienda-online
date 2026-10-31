import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatuses, whatsappUrl, type OrderStatus } from "@/lib/orders";
import { setOrderStatus } from "../actions";
import { StatusBadge } from "../status-badge";

export const metadata: Metadata = { title: "Pedido" };

type Order = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  items: { id: string; name_snapshot: string; price_snapshot: number; qty: number; product_id: string | null }[];
};

export default async function OrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, code, customer_name, phone, email, notes, status, total, created_at, items:order_items(id, name_snapshot, price_snapshot, qty, product_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as unknown as Order;

  const wa = whatsappUrl(
    o.phone,
    `Hola ${o.customer_name.split(" ")[0]}, te escribimos de la tienda sobre tu pedido ${o.code} por ${formatPrice(o.total)}.`,
  );
  const contactBtn =
    "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm transition hover:border-steel";

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-navy">
        <ChevronLeft className="size-4" /> Pedidos
      </Link>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-serif text-4xl font-medium tabular-nums">{o.code}</h1>
        <StatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatDateTime(o.created_at)}</p>

      <section aria-labelledby="estado" className="mt-8">
        <h2 id="estado" className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Estado
        </h2>
        <div className="flex flex-wrap gap-2">
          {orderStatuses.map((s) => {
            const current = s.value === o.status;
            return (
              <form key={s.value} action={setOrderStatus}>
                <input type="hidden" name="id" value={o.id} />
                <button
                  name="status"
                  value={s.value}
                  disabled={current}
                  aria-current={current ? "true" : undefined}
                  className={`h-11 rounded-full border px-5 text-sm transition active:scale-95 ${
                    current
                      ? "border-navy bg-navy text-ivory"
                      : "border-border bg-surface hover:border-steel"
                  }`}
                >
                  {s.label}
                </button>
              </form>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          Al confirmar, los productos suman a “Más vendidos”. Si cancelas, se restan.
        </p>
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_320px]">
        <section aria-labelledby="productos">
          <h2 id="productos" className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Productos
          </h2>
          <ul className="divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  {i.product_id ? (
                    <Link href={`/admin/productos/${i.product_id}`} className="hover:underline">
                      {i.name_snapshot}
                    </Link>
                  ) : (
                    <span>{i.name_snapshot}</span>
                  )}
                  <p className="text-sm text-muted">
                    {i.qty} × {formatPrice(i.price_snapshot)}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums">{formatPrice(i.price_snapshot * i.qty)}</p>
              </li>
            ))}
            <li className="flex items-center justify-between rounded-b-3xl bg-powder/40 p-4">
              <span>Total</span>
              <span className="text-xl font-medium tabular-nums">{formatPrice(o.total)}</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="cliente" className="space-y-4">
          <h2 id="cliente" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Cliente
          </h2>
          <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">
            <p className="font-medium">{o.customer_name}</p>
            <p className="mt-1 text-sm text-muted">{o.phone}</p>
            {o.email && <p className="text-sm text-muted">{o.email}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={wa} target="_blank" rel="noopener noreferrer" className={contactBtn}>
                <MessageCircle className="size-4" /> WhatsApp
              </a>
              <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className={contactBtn}>
                <Phone className="size-4" /> Llamar
              </a>
              {o.email && (
                <a href={`mailto:${o.email}`} className={contactBtn}>
                  <Mail className="size-4" /> Correo
                </a>
              )}
            </div>
          </div>
          {o.notes && (
            <div className="rounded-3xl bg-powder/50 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Notas</p>
              <p className="mt-2 whitespace-pre-line text-sm">{o.notes}</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
