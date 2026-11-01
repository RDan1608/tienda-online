import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MessageCircle } from "lucide-react";
import { storageUrl } from "@/lib/env";
import { formatPrice, timeAgo } from "@/lib/format";
import { nextStatus, whatsappUrl, type OrderStatus } from "@/lib/orders";
import { setOrderStatus } from "./actions";
import { StatusBadge } from "./status-badge";

export type OrderRowData = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  units?: number;
  /** Fotos de los productos del pedido (hasta 3 se muestran). */
  thumbs?: { path: string | null; name: string }[];
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Tarjeta de pedido: toda el área abre el detalle; abajo, dos acciones de un toque
 * (escribir por WhatsApp y pasar al siguiente estado) para no tener que entrar a cada pedido.
 */
export function OrderRow({ o }: { o: OrderRowData }) {
  const next = nextStatus(o.status);
  const wa = whatsappUrl(
    o.phone,
    `Hola ${o.customer_name.split(" ")[0]}, te escribimos de la tienda sobre tu pedido ${o.code} por ${formatPrice(o.total)}.`,
  );
  const fresh = o.status === "nuevo";
  const thumbs = o.thumbs ?? [];
  const extra = Math.max(0, thumbs.length - 3);

  return (
    <li className={`overflow-hidden rounded-3xl bg-surface ring-1 ${fresh ? "ring-navy/30" : "ring-border"}`}>
      <Link href={`/admin/pedidos/${o.id}`} className="block p-4 pb-3 transition active:bg-powder/40">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-powder text-sm font-bold text-navy"
          >
            {initials(o.customer_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-bold">{o.customer_name}</span>
              <p className="shrink-0 text-lg font-extrabold tabular-nums tracking-[-0.02em]">{formatPrice(o.total)}</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold tabular-nums text-muted">{o.code}</span>
              <StatusBadge status={o.status} />
            </div>
          </div>
          <ChevronRight className="mt-3 size-4 shrink-0 text-muted" aria-hidden />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          {thumbs.length > 0 ? (
            <div className="flex -space-x-2.5" aria-hidden>
              {thumbs.slice(0, 3).map((t, i) => (
                <span key={i} className="relative size-9 overflow-hidden rounded-xl bg-powder ring-2 ring-surface">
                  {t.path && <Image src={storageUrl(t.path)} alt="" fill sizes="36px" className="object-cover" />}
                </span>
              ))}
              {extra > 0 && (
                <span className="grid size-9 place-items-center rounded-xl bg-powder text-xs font-bold text-navy ring-2 ring-surface">
                  +{extra}
                </span>
              )}
            </div>
          ) : (
            <span />
          )}
          <p className="text-[13px] text-muted">
            {o.units != null && `${o.units} ${o.units === 1 ? "producto" : "productos"} · `}
            {timeAgo(o.created_at)}
          </p>
        </div>
      </Link>

      <div className="flex gap-2 px-4 pb-4">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold transition active:scale-[0.97]"
        >
          <MessageCircle className="size-[17px]" /> WhatsApp
        </a>
        {next && (
          <form action={setOrderStatus} className="flex-[1.4]">
            <input type="hidden" name="id" value={o.id} />
            <button
              name="status"
              value={next.value}
              className={`inline-flex h-11 w-full items-center justify-center truncate rounded-full px-3 text-sm font-semibold transition active:scale-[0.97] ${
                fresh ? "bg-navy text-ivory" : "bg-powder text-navy"
              }`}
            >
              {next.action}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
