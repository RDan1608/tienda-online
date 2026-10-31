import { statusLabel, statusStyle, type OrderStatus } from "@/lib/orders";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs ${statusStyle[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
