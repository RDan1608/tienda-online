import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
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
};

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

  return (
    <li className="overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
      <Link href={`/admin/pedidos/${o.id}`} className="flex items-start gap-3 p-4 pb-3 transition active:bg-powder/40">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-bold tabular-nums">{o.code}</span>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-1.5 truncate text-[15px]">{o.customer_name}</p>
          <p className="text-[13px] text-muted">
            {o.units != null && `${o.units} ${o.units === 1 ? "producto" : "productos"} · `}
            {timeAgo(o.created_at)}
          </p>
        </div>
        <p className="shrink-0 text-lg font-extrabold tabular-nums tracking-[-0.02em]">{formatPrice(o.total)}</p>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
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
          <form action={setOrderStatus} className="flex-1">
            <input type="hidden" name="id" value={o.id} />
            <button
              name="status"
              value={next.value}
              className={`inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold transition active:scale-[0.97] ${
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
