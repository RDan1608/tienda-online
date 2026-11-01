import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Check, ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { storageUrl } from "@/lib/env";
import { formatDateTime, formatPrice } from "@/lib/format";
import { nextStatus, orderStatuses, orderSteps, whatsappUrl, type OrderStatus } from "@/lib/orders";
import { setOrderStatus } from "../actions";
import { coversFor } from "../covers";
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
  events: { id: string; status: OrderStatus; created_at: string }[];
};

export default async function OrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, code, customer_name, phone, email, notes, status, total, created_at, items:order_items(id, name_snapshot, price_snapshot, qty, product_id), events:order_events(id, status, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as unknown as Order;
  const covers = await coversFor(supabase, o.items.map((i) => i.product_id));

  const wa = whatsappUrl(
    o.phone,
    `Hola ${o.customer_name.split(" ")[0]}, te escribimos de la tienda sobre tu pedido ${o.code} por ${formatPrice(o.total)}.`,
  );
  const next = nextStatus(o.status);
  const cancelled = o.status === "cancelado";
  const current = orderSteps.findIndex((s) => s.value === o.status);
  const units = o.items.reduce((n, i) => n + i.qty, 0);
  // Cuándo se llegó a cada etapa (la última vez que el pedido entró en ella).
  const reached = new Map<string, string>();
  for (const e of [...o.events].sort((a, b) => a.created_at.localeCompare(b.created_at))) reached.set(e.status, e.created_at);
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
      <p className="mt-1 text-sm text-muted">
        {formatDateTime(o.created_at)} · {units} {units === 1 ? "producto" : "productos"} · {formatPrice(o.total)}
      </p>

      {/* Seguimiento: lo mismo que verá el cliente en su pantalla de seguimiento */}
      <section aria-labelledby="seguimiento" className="mt-6 rounded-3xl bg-surface p-5 ring-1 ring-border">
        <h2 id="seguimiento" className="font-display text-xl font-bold tracking-[-0.025em]">
          Seguimiento
        </h2>
        <p className="mt-1 text-sm text-muted">
          {cancelled ? "Este pedido está cancelado." : orderStatuses.find((s) => s.value === o.status)?.hint}
        </p>
        <ol className="mt-5">
          {orderSteps.map((s, i) => {
            const done = !cancelled && i < current;
            const here = !cancelled && i === current;
            const at = reached.get(s.value);
            const last = i === orderSteps.length - 1;
            return (
              <li key={s.value} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!last && (
                  <span
                    aria-hidden
                    className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 rounded-full ${done ? "bg-navy" : "bg-powder"}`}
                  />
                )}
                <span
                  className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done ? "bg-navy text-ivory" : here ? "bg-navy text-ivory ring-4 ring-powder" : "bg-powder text-muted"
                  }`}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={`text-[15px] ${here ? "font-bold" : done ? "font-semibold" : "text-muted"}`}>{s.label}</p>
                  {at && (done || here) && <p className="text-xs text-muted">{formatDateTime(at)}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

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
          {o.items.map((i) => {
            const cover = i.product_id ? covers.get(i.product_id) : null;
            return (
              <li key={i.id} className="flex items-center gap-3.5 p-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-powder">
                  {cover && <Image src={storageUrl(cover)} alt="" fill sizes="56px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  {i.product_id ? (
                    <Link href={`/admin/productos/${i.product_id}`} className="line-clamp-2 text-[15px] font-medium hover:underline">
                      {i.name_snapshot}
                    </Link>
                  ) : (
                    <span className="line-clamp-2 text-[15px] font-medium">{i.name_snapshot}</span>
                  )}
                  <p className="text-sm text-muted">
                    {i.qty} × {formatPrice(i.price_snapshot)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatPrice(i.price_snapshot * i.qty)}</p>
              </li>
            );
          })}
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
              const isCurrent = s.value === o.status;
              return (
                <form key={s.value} action={setOrderStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <button
                    name="status"
                    value={s.value}
                    disabled={isCurrent}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`h-11 rounded-full border px-5 text-sm font-medium transition active:scale-95 ${
                      isCurrent
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
