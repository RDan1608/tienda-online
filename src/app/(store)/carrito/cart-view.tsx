"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronLeft, Copy, LoaderCircle, Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { cartTotal, useCart, useHydrated, type CartItem } from "@/lib/stores";
import { useFreshProducts } from "@/lib/use-fresh-products";
import { LotBanner } from "@/components/lot-banner";
import { SummaryRow } from "@/components/summary-row";
import { EmptyState } from "@/components/empty-state";
import { useSubmit } from "@/lib/use-submit";
import { rememberOrder } from "../pedido/track-view";
import { createOrder, type OrderState } from "./actions";

// Objeto fijo: el estado inicial debe tener siempre la misma identidad (se compara más abajo).
const IDLE: OrderState = { status: "idle" };

/**
 * Pedido en dos pasos en móvil (1 · revisar, 2 · tus datos) para no mostrar todo a la vez.
 * En escritorio los dos pasos conviven en dos columnas.
 */
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
  const [state, formAction, pending] = useActionState<OrderState, FormData>(createOrder, IDLE);
  const [step, setStep] = useState<1 | 2>(1);

  // La confirmación se muestra solo mientras el pedido recién enviado sigue siendo "el último": en cuanto
  // el carrito se vacía y la persona agrega algo nuevo, vuelve el flujo normal para hacer otro pedido.
  // (Estado derivado durante el render; el resultado de la acción queda guardado y no se puede reiniciar.)
  const [seen, setSeen] = useState<OrderState | null>(null);
  const [emptied, setEmptied] = useState(false);
  if (state !== seen) {
    setSeen(state);
    setEmptied(false);
    if (state.status === "success") setStep(1);
  }
  if (state.status === "success" && items.length === 0 && !emptied) setEmptied(true);
  const confirmed = state.status === "success" && (!emptied || items.length === 0);

  const onSubmit = useSubmit(formAction);
  const hasItems = hydrated && items.length > 0 && !confirmed;

  const goStep = (n: 1 | 2) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  // Pedido creado → vaciar carrito.
  useEffect(() => {
    if (state.status === "success") {
      rememberOrder(state.code, state.phone); // para seguir el pedido sin volver a escribir nada
      clear();
    }
  }, [state, clear]);

  // Con la barra fija visible, el aviso flotante se aparta de ella.
  useEffect(() => {
    const root = document.documentElement;
    if (hasItems) root.style.setProperty("--sticky-bar-h", "5.5rem");
    return () => {
      root.style.removeProperty("--sticky-bar-h");
    };
  }, [hasItems]);

  if (confirmed && state.status === "success") return <Confirmation code={state.code} total={state.total} />;
  if (!hydrated) return <div className="mt-8 h-64 shimmer rounded-[28px]" />;

  if (!items.length) {
    return (
      <EmptyState
        art="pedido"
        title="Tu pedido está vacío"
        text="Agrega lo que te guste desde el catálogo."
        cta="Explorar catálogo"
      />
    );
  }

  const total = cartTotal(items);
  const units = items.reduce((n, i) => n + i.qty, 0);
  const unitsLabel = `${units} ${units === 1 ? "producto" : "productos"}`;
  const sending = pending ? (
    <>
      <LoaderCircle className="size-[18px] animate-spin" /> Enviando…
    </>
  ) : (
    <>Confirmar pedido</>
  );

  return (
    <div data-cart-page className="mt-5 grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-14">
      <Steps step={step} onStep={goStep} />

      {/* Paso 1 · revisar el pedido */}
      <section key={`items-${step}`} aria-label="Tu pedido" className={`step-in ${step === 2 ? "max-lg:hidden" : ""}`}>
        <LotBanner className="mb-5" />
        {removed > 0 && (
          <p className="mb-4 rounded-2xl bg-butter p-3.5 text-sm">
            {removed === 1 ? "Un producto ya no está disponible" : `${removed} productos ya no están disponibles`} y
            se quitó de tu pedido.
          </p>
        )}
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <CartRow key={item.id} item={item} />
          ))}
        </ul>
        <dl className="mt-5 space-y-2.5 rounded-[24px] bg-powder/50 p-5 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-muted">{unitsLabel}</dt>
            <dd className="tabular-nums">{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd>Se coordina contigo</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-dusty/60 pt-3">
            <dt className="font-semibold">Total estimado</dt>
            <dd className="text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{formatPrice(total)}</dd>
          </div>
        </dl>
        <Link
          href="/catalogo"
          className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-muted transition-colors hover:text-navy"
        >
          <ChevronLeft className="size-4" /> Seguir viendo productos
        </Link>
      </section>

      {/* Paso 2 · tus datos */}
      <section
        key={`form-${step}`}
        aria-labelledby="datos"
        className={`step-in lg:sticky lg:top-24 lg:self-start ${step === 1 ? "max-lg:hidden" : ""}`}
      >
        <button
          type="button"
          onClick={() => goStep(1)}
          className="mb-4 flex w-full items-center justify-between rounded-2xl bg-powder/60 px-4 py-3 text-left transition active:scale-[0.99] lg:hidden"
        >
          <span className="text-[15px]">
            <span className="font-semibold">{unitsLabel}</span> <span className="text-muted">· {formatPrice(total)}</span>
          </span>
          <span className="text-sm font-semibold underline underline-offset-4">Editar</span>
        </button>

        <form id="pedido" onSubmit={onSubmit} className="rounded-[28px] bg-surface p-5 shadow-soft ring-1 ring-border sm:p-6" noValidate>
          <h2 id="datos" className="font-display text-xl font-bold tracking-[-0.03em]">
            Tus datos
          </h2>
          <p className="mt-1 text-sm text-muted">Te contactamos para coordinar el pago y la entrega. No se cobra nada ahora.</p>

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
            <Optional linkLabel="Agregar una nota">
              <Field label="Nota (opcional)" name="notes" textarea placeholder="Color preferido, para regalo…" autoFocus state={state} />
            </Optional>
            <Optional linkLabel="Agregar correo">
              <Field label="Correo (opcional)" name="email" type="email" autoComplete="email" autoFocus state={state} />
            </Optional>
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
            {sending} · {formatPrice(total)}
          </button>
        </form>
      </section>

      {/* Móvil: un solo botón grande, pegado al borde inferior (sin segunda barra). El precio va dentro de la acción. */}
      <div className="sticky bottom-0 z-30 -mx-4 bg-gradient-to-t from-ivory from-70% to-ivory/0 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-5 sm:-mx-6 sm:px-6 lg:hidden">
        {step === 1 ? (
          // key distinta: si React reutilizara este botón como "submit", el MISMO toque enviaría el formulario.
          <button
            key="siguiente"
            type="button"
            onClick={() => goStep(2)}
            className="flex h-14 w-full items-center justify-between rounded-full bg-navy pl-7 pr-3 text-base font-semibold text-ivory shadow-float transition active:scale-[0.98]"
          >
            <span className="inline-flex items-center gap-2">
              Continuar <ArrowRight className="size-[18px]" />
            </span>
            <span className="rounded-full bg-ivory/15 px-3.5 py-2 text-[15px] font-bold tabular-nums">{formatPrice(total)}</span>
          </button>
        ) : (
          <>
            <button
              key="enviar"
              type="submit"
              form="pedido"
              disabled={pending}
              className="flex h-14 w-full items-center justify-between rounded-full bg-navy pl-7 pr-3 text-base font-semibold text-ivory shadow-float transition active:scale-[0.98] disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">{sending}</span>
              <span className="rounded-full bg-ivory/15 px-3.5 py-2 text-[15px] font-bold tabular-nums">{formatPrice(total)}</span>
            </button>
            <p className="mt-2 text-center text-xs text-muted">No se cobra nada ahora</p>
          </>
        )}
      </div>
    </div>
  );
}

/** Indicador de progreso (solo móvil): 1 Pedido → 2 Datos. El paso 1 se puede volver a tocar. */
function Steps({ step, onStep }: { step: 1 | 2; onStep: (n: 1 | 2) => void }) {
  const dot = (active: boolean, done: boolean) =>
    `grid size-6 place-items-center rounded-full text-xs font-bold transition-colors duration-200 ${
      active || done ? "bg-navy text-ivory" : "bg-powder text-muted"
    }`;
  return (
    <ol aria-label="Progreso del pedido" className="flex items-center gap-3 lg:hidden lg:col-span-2">
      <li className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={step === 1}
          aria-current={step === 1 ? "step" : undefined}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <span className={dot(step === 1, step === 2)}>{step === 2 ? <Check className="size-3.5" strokeWidth={3} /> : 1}</span>
          Pedido
        </button>
      </li>
      <li aria-hidden className="h-px w-8 bg-border" />
      <li aria-current={step === 2 ? "step" : undefined} className={`flex items-center gap-2 text-sm font-semibold ${step === 2 ? "" : "text-muted"}`}>
        <span className={dot(step === 2, false)}>2</span>
        Datos
      </li>
    </ol>
  );
}

function Optional({ linkLabel, children }: { linkLabel: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open) return <div className="swap-in">{children}</div>;
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-10 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
    >
      <Plus className="size-4" /> {linkLabel}
    </button>
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
        {item.qty > 1 && <p className="text-xs text-muted">{formatPrice(item.price)} c/u</p>}
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
          autoFocus={props.autoFocus}
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
          <p className="text-xs font-semibold text-honey-ink">Tu código</p>
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
      <LotBanner compact className="mt-5 text-left" />
      <p className="mt-6 text-[15px]">Te contactaremos para coordinar el pago y la entrega.</p>

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
          href={`/pedido?codigo=${code}`}
          className="inline-flex h-14 items-center justify-center rounded-full bg-navy text-[15px] font-semibold text-ivory transition active:scale-[0.98]"
        >
          Seguir mi pedido
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex h-14 items-center justify-center rounded-full bg-powder text-[15px] font-semibold transition active:scale-[0.98]"
        >
          Seguir viendo
        </Link>
      </div>
    </div>
  );
}
