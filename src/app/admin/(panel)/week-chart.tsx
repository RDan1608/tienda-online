import { formatPrice } from "@/lib/format";

export type Day = { label: string; total: number; orders: number; today: boolean };

/**
 * Ventas de los últimos 7 días: barras simples (CSS, sin librerías). Hoy va en navy; el resto, en dusty.
 * Cada barra crece desde la base al cargar. El resumen en texto es para lectores de pantalla.
 */
export function WeekChart({ days }: { days: Day[] }) {
  const max = Math.max(...days.map((d) => d.total), 1);
  const sum = days.reduce((n, d) => n + d.total, 0);
  const orders = days.reduce((n, d) => n + d.orders, 0);

  return (
    <section aria-labelledby="semana" className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="semana" className="font-display text-xl font-bold tracking-[-0.025em]">
          Últimos 7 días
        </h2>
        <p className="text-sm text-muted">
          <span className="font-bold tabular-nums text-navy">{formatPrice(sum)}</span> · {orders}{" "}
          {orders === 1 ? "pedido" : "pedidos"}
        </p>
      </div>
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-border">
        <p className="sr-only">
          {days.map((d) => `${d.label}: ${formatPrice(d.total)} en ${d.orders} pedidos`).join(". ")}
        </p>
        <ul aria-hidden className="flex h-36 items-end gap-2">
          {days.map((d, i) => (
            <li key={d.label + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`bar-grow w-full rounded-t-xl ${d.today ? "bg-navy" : "bg-dusty"} ${d.total === 0 ? "!h-1 opacity-40" : ""}`}
                  style={{ height: `${Math.max((d.total / max) * 100, 0)}%`, "--i": i } as React.CSSProperties}
                />
              </div>
              <span className={`text-[11px] ${d.today ? "font-bold text-navy" : "text-muted"}`}>{d.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
