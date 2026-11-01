export const orderStatuses = [
  { value: "nuevo", label: "Nuevo", plural: "Nuevos" },
  { value: "confirmado", label: "Confirmado", plural: "Confirmados" },
  { value: "preparando", label: "Preparando", plural: "Preparando" },
  { value: "entregado", label: "Entregado", plural: "Entregados" },
  { value: "cancelado", label: "Cancelado", plural: "Cancelados" },
] as const;

export type OrderStatus = (typeof orderStatuses)[number]["value"];

export const statusLabel = (s: string) => orderStatuses.find((o) => o.value === s)?.label ?? s;

export function isOrderStatus(v: unknown): v is OrderStatus {
  return orderStatuses.some((o) => o.value === v);
}

/** Estilos del badge, solo con la paleta de la tienda. */
export const statusStyle: Record<OrderStatus, string> = {
  nuevo: "bg-navy text-ivory",
  confirmado: "bg-steel text-white",
  preparando: "bg-dusty text-navy",
  entregado: "bg-powder text-navy",
  cancelado: "bg-transparent text-muted ring-1 ring-border line-through",
};

/** wa.me exige código de país: un número de 8 dígitos se asume de Honduras (+504). */
export function whatsappUrl(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8) digits = `504${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Siguiente paso natural de un pedido (botón rápido). Entregado y cancelado no avanzan. */
export function nextStatus(s: OrderStatus): { value: OrderStatus; action: string } | null {
  switch (s) {
    case "nuevo":
      return { value: "confirmado", action: "Confirmar" };
    case "confirmado":
      return { value: "preparando", action: "Preparar" };
    case "preparando":
      return { value: "entregado", action: "Marcar entregado" };
    default:
      return null;
  }
}

/** Etiqueta del día para agrupar: Hoy, Ayer o la fecha (hora de Honduras). */
export function dayLabel(iso: string, now = Date.now()) {
  const tz = "America/Tegucigalpa";
  const key = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(t);
  const d = new Date(iso).getTime();
  if (key(d) === key(now)) return "Hoy";
  if (key(d) === key(now - 86400000)) return "Ayer";
  return new Intl.DateTimeFormat("es-HN", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(d);
}
