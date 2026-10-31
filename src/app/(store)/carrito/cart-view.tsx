"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, LoaderCircle, Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { cartTotal, useCart, useHydrated, type CartItem } from "@/lib/stores";
import { useFreshProducts } from "@/lib/use-fresh-products";
import { SummaryRow } from "@/components/summary-row";
import { EmptyState } from "@/components/empty-state";
import { useSubmit } from "@/lib/use-submit";
import { createOrder, type OrderState } from "./actions";

export function CartView() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const sync = useCart((s) => s.sync);
  const clear = useCart((s) => s.clear);
  const removed = useFreshProducts(
    items.map((i) => i.id),
    hydrated,
    sync,
  );
  const [state, formAction, pending] = useActionState<OrderState, FormData>(createOrder, {
    status: "idle",
  });
  const [showEmail, setShowEmail] = useState(false);

  const onSubmit = useSubmit(formAction);
  const hasItems = hydrated && items.length > 0 && state.status !== "success";

  // Pedido creado → vaciar carrito.
  useEffect(() => {
    if (state.status === "success") clear();
  }, [state, clear]);

  // Con la barra fija visible, el aviso flotante se aparta de ella.
  useEffect(() => {
    const root = document.documentElement;
    if (hasItems) root.style.setProperty("--sticky-bar-h", "4.5rem");
    return () => {
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [hasItems]);

  if (state.status === "success") return <Confirmation code={state.code} total={state.total} />;
  if (!hydrated) return <div className="mt-8 h-64 animate-pulse rounded-[28px] bg-powder/50" />;

  if (!items.length) {
    return (
      <EmptyState
        art="pedido"
        title="Tu pedido está vacío"
        text="Agrega lo que te guste desde el catálogo y aquí lo armas."
        cta="Explorar catálogo"
      />
    );
  }

  const total = cartTotal(items);
  const units = items.reduce((n, i) => n + i.qty, 0);
  const submitLabel = pending ? (
    <>
      <LoaderCircle className="size-[18px] animate-spin" /> Enviando…
    </>
  ) : (
    <>Enviar pedido</>
  );

  return (
    <div className="mt-6 grid gap-8 pb-24 lg:grid-cols-[1fr_400px] lg:gap-14 lg:pb-0">
      <section aria-label="Productos">
        {removed > 0 && (
          <p className="mb-4 rounded-2xl bg-butter p-3.5 text-sm">
            {removed === 1 ? "Un producto ya no está disponible" : `${removed} productos ya no están disponibles`} y
            se quitó de tu pedido.
          </p>
        )}
        <p className="mb-1 text-sm text-muted">
          {units} {units === 1 ? "producto" : "productos"}
        </p>
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <CartRow key={item.id} item={item} />
          ))}
        </ul>
        <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-powder/60 px-5 py-4">
          <span className="text-[15px] font-medium">Total estimado</span>
          <span className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{formatPrice(total)}</span>
        </div>
      </section>

      <section aria-labelledby="datos" className="lg:sticky lg:top-24 lg:self-start">
        <form id="pedido" onSubmit={onSubmit} className="rounded-[28px] bg-surface p-5 shadow-soft ring-1 ring-border sm:p-6" noValidate>
          <h2 id="datos" className="font-display text-xl font-bold tracking-[-0.025em]">
            ¿A quién se lo enviamos?
          </h2>
          <p className="mt-1 text-sm text-muted">{site.orderInfo}</p>

          <input
            type="hidden"
            name="items"
            value={JSON.stringify(items.map((i) => ({ product_id: i.id, qty: i.qty })))}
          />
          {/* honeypot: invisible para personas */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div className="mt-5 space-y-4">
            <Field label="Nombre" name="name" autoComplete="name" required state={state} />
            <Field
              label="Teléfono / WhatsApp"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="9999-9999"
              required
              state={state}
            />
            <Field
              label="Notas (opcional)"
              name="notes"
              textarea
              placeholder="Color preferido, para regalo, zona de entrega…"
              state={state}
            />
            {showEmail ? (
              <div className="swap-in">
                <Field label="Correo (opcional)" name="email" type="email" autoComplete="email" autoFocus state={state} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowEmail(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-navy underline-offset-4 hover:underline"
              >
                <Plus className="size-4" /> Agregar correo (opcional)
              </button>
            )}
          </div>

          {state.status === "error" && (
            <p role="alert" className="mt-4 rounded-2xl bg-blush p-3.5 text-sm font-medium text-rose-ink">
              {state.message}
            </p>
          )}

          {/* Escritorio: el botón vive en la tarjeta. En móvil lo reemplaza la barra fija de abajo. */}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 hidden h-14 w-full items-center justify-center gap-2 rounded-full bg-navy text-[15px] font-semibold text-ivory shadow-soft transition duration-150 hover:bg-navy-deep active:scale-[0.98] disabled:opacity-70 lg:inline-flex"
          >
            {submitLabel} · {formatPrice(total)}
          </button>
          <p className="mt-3 text-center text-xs text-muted">No se cobra nada ahora. El total final lo confirmamos contigo.</p>
        </form>
      </section>

      {/* Móvil: total y botón siempre a la vista, sobre la navegación */}
      <div className="fixed inset-x-0 bottom-[var(--mobile-nav-h)] z-30 border-t border-border bg-ivory/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div>
            <p className="text-xs text-muted">Total estimado</p>
            <p className="text-lg font-extrabold tabular-nums leading-tight">{formatPrice(total)}</p>
          </div>
          <button
            type="submit"
            form="pedido"
            disabled={pending}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98] disabled:opacity-70"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const add = useCart((s) => s.add);
  const dec = useCart((s) => s.dec);
  const remove = useCart((s) => s.remove);
  const [leaving, setLeaving] = useState(false);
  // Se pliega y desvanece, y recién entonces sale del pedido (con "Deshacer" en el aviso).
  const leave = () => {
    setLeaving(true);
    setTimeout(() => remove(item.id), 280);
  };
  const MinusIcon = item.qty === 1 ? Trash2 : Minus;

  return (
    <SummaryRow
      leaving={leaving}
      product={item}
      meta={<p className="shrink-0 text-[15px] font-bold tabular-nums">{formatPrice(item.price * item.qty)}</p>}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 items-center rounded-full bg-powder/70 p-0.5">
          <button
            type="button"
            onClick={() => (item.qty === 1 ? leave() : dec(item.id))}
            aria-label={item.qty === 1 ? `Quitar ${item.name} del pedido` : `Quitar uno de ${item.name}`}
            className="grid size-9 place-items-center rounded-full bg-ivory shadow-soft transition-transform duration-150 active:scale-90"
          >
            <MinusIcon className="size-4" />
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold tabular-nums">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => add(item, 1)}
            disabled={item.qty >= 99}
            aria-label={`Agregar uno más de ${item.name}`}
            className="grid size-9 place-items-center rounded-full bg-navy text-ivory transition-transform duration-150 active:scale-90 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="text-xs text-muted">{formatPrice(item.price)} c/u</p>
      </div>
    </SummaryRow>
  );
}

function Field({
  label,
  name,
  textarea,
  state,
  ...props
}: {
  label: string;
  name: string;
  textarea?: boolean;
  state: OrderState;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const error = state.status === "error" ? state.fields?.[name] : undefined;
  const cls = `w-full rounded-2xl border bg-ivory px-4 text-[15px] outline-none transition focus:border-steel focus:bg-surface focus:ring-4 focus:ring-powder ${
    error ? "border-rose-ink/60" : "border-border"
  }`;
  const describedBy = error ? `${name}-error` : undefined;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          rows={3}
          maxLength={1000}
          placeholder={props.placeholder}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${cls} resize-none py-3`}
        />
      ) : (
        <input name={name} aria-invalid={!!error} aria-describedby={describedBy} className={`${cls} h-12`} {...props} />
      )}
      {error && (
        <span id={describedBy} className="mt-1 block text-sm font-medium text-rose-ink">
          {error}
        </span>
      )}
    </label>
  );
}

function Confirmation({ code, total }: { code: string; total: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el código sigue visible para copiarlo a mano.
    }
  }

  const wa = site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hola, hice el pedido ${code}.`)}`
    : null;

  return (
    <div className="card-in mx-auto mt-6 max-w-lg text-center">
      <div className="pop mx-auto grid size-20 place-items-center rounded-full bg-powder">
        <Check className="size-9 text-navy" strokeWidth={2.5} />
      </div>
      <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.035em]">¡Pedido recibido!</h2>
      <p className="mt-2 text-muted">Guarda tu código por si quieres consultarnos algo.</p>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-butter py-3 pl-5 pr-3">
        <div className="text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-honey-ink">Tu código</p>
          <p className="font-display text-2xl font-extrabold tracking-[0.04em] tabular-nums">{code}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ivory px-4 text-sm font-semibold shadow-soft transition active:scale-95"
        >
          {copied ? <Check className="pop size-4" strokeWidth={2.5} /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        Total estimado <strong className="text-navy">{formatPrice(total)}</strong>
      </p>

      <ol className="mt-8 space-y-3 text-left">
        {["Recibimos tu pedido y lo revisamos.", "Te contactamos para coordinar el pago y la entrega."].map((t, i) => (
          <li key={t} className="flex items-start gap-3 rounded-2xl bg-powder/50 p-4">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-ivory">{i + 1}</span>
            <span className="text-[15px]">{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-3">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98]"
          >
            Escribirnos por WhatsApp
          </a>
        )}
        <Link
          href="/catalogo"
          className={`inline-flex h-14 items-center justify-center rounded-full text-[15px] font-semibold transition active:scale-[0.98] ${
            wa ? "bg-powder" : "bg-navy text-ivory"
          }`}
        >
          Seguir viendo
        </Link>
      </div>
    </div>
  );
}
