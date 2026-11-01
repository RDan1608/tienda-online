import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Check, ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime, formatPrice } from "@/lib/format";
import { nextStatus, orderStatuses, whatsappUrl, type OrderStatus } from "@/lib/orders";
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

const steps = orderStatuses.filter((s) => s.value !== "cancelado");

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
  const next = nextStatus(o.status);
  const cancelled = o.status === "cancelado";
  const stepIndex = steps.findIndex((s) => s.value === o.status);
  const units = o.items.reduce((n, i) => n + i.qty, 0);
  const contactBtn =
    "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold transition active:scale-[0.97]";

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex h-10 items-center gap-1 text-sm font-medium text-muted hover:text-navy">
        <ChevronLeft className="size-4" /> Pedidos
      </Link>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] tabular-nums sm:text-4xl">{o.code}</h1>
        <StatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatDateTime(o.created_at)}</p>

      {/* Progreso: dónde va el pedido */}
      <ol aria-label="Progreso del pedido" className="mt-6 grid grid-cols-4 gap-1.5">
        {steps.map((s, i) => {
          const done = !cancelled && i <= stepIndex;
          return (
            <li key={s.value} className="min-w-0">
              <div className={`h-1.5 rounded-full transition-colors ${done ? "bg-navy" : "bg-powder"}`} />
              <p className={`mt-1.5 flex items-center gap-1 truncate text-xs ${done ? "font-bold text-navy" : "text-muted"}`}>
                {done && i < stepIndex && <Check className="size-3 shrink-0" strokeWidth={3} />}
                {s.label}
              </p>
            </li>
          );
        })}
      </ol>
      {cancelled && <p className="mt-3 rounded-2xl bg-blush p-3 text-sm font-medium text-rose-ink">Este pedido está cancelado.</p>}

      {/* Cliente primero: es lo que se necesita para coordinar */}
      <section aria-labelledby="cliente" className="mt-8">
        <h2 id="cliente" className="mb-3 font-display text-xl font-bold tracking-[-0.025em]">
          Cliente
        </h2>
        <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">
          <p className="text-lg font-bold">{o.customer_name}</p>
          <p className="mt-1 text-[15px] text-muted">{o.phone}</p>
          {o.email && <p className="text-[15px] text-muted">{o.email}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={wa} target="_blank" rel="noopener noreferrer" className={contactBtn}>
              <MessageCircle className="size-[18px]" /> WhatsApp
            </a>
            <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className={contactBtn}>
              <Phone className="size-[18px]" /> Llamar
            </a>
            {o.email && (
              <a href={`mailto:${o.email}`} className={contactBtn}>
                <Mail className="size-[18px]" /> Correo
              </a>
            )}
          </div>
        </div>
        {o.notes && (
          <div className="mt-3 rounded-3xl bg-butter p-5">
            <p className="text-xs font-semibold text-honey-ink">Nota del cliente</p>
            <p className="mt-1.5 whitespace-pre-line text-[15px]">{o.notes}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="productos" className="mt-8">
        <h2 id="productos" className="mb-3 font-display text-xl font-bold tracking-[-0.025em]">
          Productos <span className="text-base font-medium text-muted">· {units}</span>
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                {i.product_id ? (
                  <Link href={`/admin/productos/${i.product_id}`} className="text-[15px] font-medium hover:underline">
                    {i.name_snapshot}
                  </Link>
                ) : (
                  <span className="text-[15px] font-medium">{i.name_snapshot}</span>
                )}
                <p className="text-sm text-muted">
                  {i.qty} × {formatPrice(i.price_snapshot)}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{formatPrice(i.price_snapshot * i.qty)}</p>
            </li>
          ))}
          <li className="flex items-center justify-between bg-powder/40 p-4">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{formatPrice(o.total)}</span>
          </li>
        </ul>
      </section>

      {/* Otras acciones: cualquier estado, incluida la cancelación */}
      <details className="group mt-8 rounded-3xl bg-surface ring-1 ring-border">
        <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
          Cambiar estado manualmente
          <ChevronLeft className="size-4 -rotate-90 text-muted transition-transform group-open:rotate-90" />
        </summary>
        <div className="border-t border-border p-4">
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
                    className={`h-11 rounded-full border px-5 text-sm font-medium transition active:scale-95 ${
                      current
                        ? "border-navy bg-navy text-ivory"
                        : s.value === "cancelado"
                          ? "border-border bg-surface text-rose-ink hover:border-rose-ink/50"
                          : "border-border bg-surface hover:border-steel"
                    }`}
                  >
                    {s.label}
                  </button>
                </form>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Al confirmar, los productos suman a “Más vendidos”. Si cancelas, se restan.
          </p>
        </div>
      </details>

      {/* Acción principal siempre a la mano */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 bg-gradient-to-t from-ivory from-70% to-ivory/0 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-5 sm:-mx-6 sm:px-6">
        <div className="flex gap-2.5">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp"
            className="grid size-14 shrink-0 place-items-center rounded-full border border-border bg-surface shadow-soft transition active:scale-95"
          >
            <MessageCircle className="size-6" />
          </a>
          {next ? (
            <form action={setOrderStatus} className="flex-1">
              <input type="hidden" name="id" value={o.id} />
              <button
                name="status"
                value={next.value}
                className="flex h-14 w-full items-center justify-center rounded-full bg-navy text-base font-semibold text-ivory shadow-float transition active:scale-[0.98]"
              >
                {next.action}
              </button>
            </form>
          ) : (
            <p className="grid h-14 flex-1 place-items-center rounded-full bg-powder text-[15px] font-semibold text-navy">
              {cancelled ? "Pedido cancelado" : "Pedido entregado"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
