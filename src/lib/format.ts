const hnl = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

/** 250 → "L 250.00" */
export function formatPrice(value: number | string) {
  return hnl.format(Number(value));
}

const dateTime = new Intl.DateTimeFormat("es-HN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Tegucigalpa",
});

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 5 minutos", "ayer"; pasados 7 días muestra la fecha. */
export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  // Hasta 5 min "en el futuro" es desfase de relojes entre servidores, no una fecha futura.
  if (abs < 45 || (seconds > 0 && seconds < 300)) return "hace un momento";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return relative.format(Math.round(seconds / 86400), "day");
  return formatDateTime(iso);
}
