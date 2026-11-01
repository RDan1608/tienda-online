/**
 * Etapas del pedido. El negocio compra por lote: se reúnen pedidos, se hace el pedido al proveedor,
 * llega, y se coordina la entrega. `preparando` se muestra como "Pedido realizado" (al proveedor).
 * `hint` es lo que lee el CLIENTE en su seguimiento.
 */
export const orderStatuses = [
  { value: "nuevo", label: "Recibido", plural: "Nuevos", hint: "Recibimos tu pedido. Te escribiremos para confirmarlo." },
  { value: "confirmado", label: "Confirmado", plural: "Confirmados", hint: "Tu pedido está confirmado y en lista para el siguiente pedido." },
  { value: "preparando", label: "Pedido realizado", plural: "Pedido realizado", hint: "Ya hicimos el pedido al proveedor." },
  { value: "en_camino", label: "En camino", plural: "En camino", hint: "Tu pedido viene en camino hacia nosotros." },
  { value: "listo", label: "Listo para entrega", plural: "Listos", hint: "Ya llegó. Coordinamos la entrega contigo." },
  { value: "entregado", label: "Entregado", plural: "Entregados", hint: "Entregado. ¡Gracias por tu compra!" },
  { value: "cancelado", label: "Cancelado", plural: "Cancelados", hint: "Este pedido fue cancelado." },
] as const;

export type OrderStatus = (typeof orderStatuses)[number]["value"];

/** Etapas del camino normal (sin cancelado), en orden. */
export const orderSteps = orderStatuses.filter((s) => s.value !== "cancelado");

export const statusLabel = (s: string) => orderStatuses.find((o) => o.value === s)?.label ?? s;

export function isOrderStatus(v: unknown): v is OrderStatus {
  return orderStatuses.some((o) => o.value === v);
}

/** Estilos del badge, solo con la paleta de la tienda. */
export const statusStyle: Record<OrderStatus, string> = {
  nuevo: "bg-navy text-ivory",
  confirmado: "bg-steel text-white",
  preparando: "bg-dusty text-navy",
  en_camino: "bg-butter text-honey-ink",
  listo: "bg-blush text-rose-ink",
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
      return { value: "preparando", action: "Pedido hecho al proveedor" };
    case "preparando":
      return { value: "en_camino", action: "Marcar en camino" };
    case "en_camino":
      return { value: "listo", action: "Llegó: listo para entrega" };
    case "listo":
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
