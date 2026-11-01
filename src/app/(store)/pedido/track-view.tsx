"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, MessageCircle, PackageSearch } from "lucide-react";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatuses, orderSteps } from "@/lib/orders";
import { site } from "@/lib/site";
import { useSubmit } from "@/lib/use-submit";
import { trackOrder, type TrackState, type Tracked } from "./actions";

const KEY = "tienda-last-order";
const input =
  "h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";

/** Último pedido hecho en este dispositivo (solo se guarda en el navegador de la persona). */
export function rememberOrder(code: string, phone: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, phone }));
  } catch {
    // Sin almacenamiento (modo privado): igual puede escribir sus datos.
  }
}

function readSaved(): { code: string; phone: string } | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function TrackView() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, { status: "idle" });
  const onSubmit = useSubmit(action);
  const form = useRef<HTMLFormElement>(null);
  // Se lee en el navegador tras montar (en el servidor no hay localStorage).
  const [prefill, setPrefill] = useState<{ code: string; phone: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSaved();
    const fromUrl = new URLSearchParams(window.location.search).get("codigo");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefill({ code: fromUrl ?? saved?.code ?? "", phone: saved && (!fromUrl || fromUrl === saved.code) ? saved.phone : "" });
    setReady(true);
  }, []);

  // Si este dispositivo ya tiene el código y el teléfono, se consulta solo (un toque menos).
  useEffect(() => {
    if (ready && prefill?.code && prefill.phone) form.current?.requestSubmit();
  }, [ready, prefill]);

  return (
    <div className="mt-6">
      {ready && (
        <form
          key={`${prefill?.code}-${prefill?.phone}`}
          ref={form}
          onSubmit={onSubmit}
          noValidate
          className={`space-y-3 rounded-[28px] bg-surface p-5 shadow-soft ring-1 ring-border ${state.status === "found" ? "hidden" : ""}`}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Código del pedido</span>
            <input
              name="code"
              defaultValue={prefill?.code}
              placeholder="P-1A2B3C"
              autoCapitalize="characters"
              autoComplete="off"
              className={`${input} uppercase tracking-wider`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Teléfono</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={prefill?.phone}
              placeholder="9999-9999"
              autoComplete="tel"
              className={input}
            />
          </label>
          {state.status === "error" && (
            <p role="alert" className="swap-in rounded-2xl bg-blush p-3.5 text-sm font-medium text-rose-ink">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-navy-lift to-navy text-base font-semibold text-ivory shadow-soft transition active:scale-[0.98] disabled:opacity-70"
          >
            {pending ? <LoaderCircle className="size-5 animate-spin" /> : <PackageSearch className="size-5" />}
            {pending ? "Buscando…" : "Ver mi pedido"}
          </button>
        </form>
      )}

      {state.status === "found" && <Result order={state.order} />}
    </div>
  );
}

function Result({ order }: { order: Tracked }) {
  const cancelled = order.status === "cancelado";
  const current = orderSteps.findIndex((s) => s.value === order.status);
  const meta = orderStatuses.find((s) => s.value === order.status);
  const reached = new Map<string, string>();
  for (const e of [...order.events].sort((a, b) => a.at.localeCompare(b.at))) reached.set(e.status, e.at);
  const wa = site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hola, quiero consultar mi pedido ${order.code}.`)}`
    : null;

  return (
    <div className="card-in space-y-6">
      <div className="rounded-[28px] bg-navy p-6 text-ivory">
        <p className="text-sm text-ivory/75">Hola, {order.customer}</p>
        <p className="mt-1 font-display text-3xl font-extrabold tracking-[-0.035em]">{meta?.label}</p>
        <p className="mt-2 text-[15px] text-ivory/85">{meta?.hint}</p>
        <p className="mt-4 text-xs tabular-nums text-ivory/70">
          Pedido {order.code} · {formatDateTime(order.created_at)}
        </p>
      </div>

      {!cancelled && (
        <section aria-labelledby="camino" className="rounded-[28px] bg-surface p-6 ring-1 ring-border">
          <h2 id="camino" className="font-display text-xl font-bold tracking-[-0.025em]">
            Cómo va tu pedido
          </h2>
          <ol className="mt-5">
            {orderSteps.map((s, i) => {
              const done = i < current;
              const here = i === current;
              const at = reached.get(s.value);
              const last = i === orderSteps.length - 1;
              return (
                <li key={s.value} className="relative flex gap-4 pb-6 last:pb-0">
                  {!last && (
                    <span
                      aria-hidden
                      className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 rounded-full ${done ? "bg-navy" : "bg-powder"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      done ? "bg-navy text-ivory" : here ? "bg-navy text-ivory ring-4 ring-powder" : "bg-powder text-muted"
                    }`}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className={`text-[15px] ${here ? "font-bold" : done ? "font-semibold" : "text-muted"}`}>{s.label}</p>
                    {(done || here) && <p className="text-sm text-muted">{here ? s.hint : at ? formatDateTime(at) : ""}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section aria-labelledby="tu-pedido" className="rounded-[28px] bg-surface p-6 ring-1 ring-border">
        <h2 id="tu-pedido" className="font-display text-xl font-bold tracking-[-0.025em]">
          Tu pedido
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {order.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-4 py-3 text-[15px]">
              <span>
                {i.name} <span className="text-muted">× {i.qty}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
          <span className="font-semibold">Total estimado</span>
          <span className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{formatPrice(order.total)}</span>
        </p>
      </section>

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface text-[15px] font-semibold transition active:scale-[0.98]"
        >
          <MessageCircle className="size-5" /> Escribirnos por WhatsApp
        </a>
      )}
    </div>
  );
}
