"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { CircleCheck, LoaderCircle, Minus, Plus, ShoppingBag, X } from "lucide-react";
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

  const onSubmit = useSubmit(formAction);

  // Pedido creado → vaciar carrito.
  useEffect(() => {
    if (state.status === "success") clear();
  }, [state, clear]);

  if (state.status === "success") return <Confirmation code={state.code} total={state.total} />;
  if (!hydrated) return <div className="mt-8 h-64 animate-pulse rounded-3xl bg-powder/50" />;

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-7" strokeWidth={1.5} />}
        title="Tu carrito está vacío"
        text="Agrega productos desde el catálogo para hacer tu pedido."
      />
    );
  }

  const total = cartTotal(items);

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
      <section aria-label="Productos">
        {removed > 0 && (
          <p className="mb-4 rounded-xl bg-powder/60 p-3 text-sm">
            {removed === 1 ? "Un producto ya no está disponible" : `${removed} productos ya no están disponibles`} y
            se quitó del carrito.
          </p>
        )}
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <CartRow key={item.id} item={item} />
          ))}
        </ul>
        <div className="mt-6 flex items-baseline justify-between">
          <span className="text-muted">Total estimado</span>
          <span className="text-2xl font-medium">{formatPrice(total)}</span>
        </div>
      </section>

      <section aria-labelledby="datos" className="lg:sticky lg:top-24 lg:self-start">
        <form onSubmit={onSubmit} className="rounded-3xl bg-surface p-5 ring-1 ring-border sm:p-6" noValidate>
          <h2 id="datos" className="font-serif text-2xl font-medium">Tus datos</h2>
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
            <Field label="Correo (opcional)" name="email" type="email" autoComplete="email" state={state} />
            <Field
              label="Notas (opcional)"
              name="notes"
              textarea
              placeholder="Color preferido, para regalo, zona de entrega…"
              state={state}
            />
          </div>

          {state.status === "error" && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-medium text-ivory transition hover:bg-navy/90 active:scale-[0.98] disabled:opacity-70"
          >
            {pending ? (
              <>
                <LoaderCircle className="size-[18px] animate-spin" /> Enviando…
              </>
            ) : (
              <>Enviar pedido · {formatPrice(total)}</>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            No se cobra nada ahora. El total final lo confirmamos contigo.
          </p>
        </form>
      </section>
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  return (
    <SummaryRow product={item} meta={<p className="shrink-0 font-medium">{formatPrice(item.price * item.qty)}</p>}>
      <div className="flex items-center justify-between">
        <div className="flex h-9 items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQty(item.id, item.qty - 1)}
            disabled={item.qty <= 1}
            className="grid size-9 place-items-center rounded-full hover:bg-powder/70 disabled:opacity-40"
            aria-label={`Quitar uno de ${item.name}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-6 text-center text-sm tabular-nums">{item.qty}</span>
          <button
            type="button"
            onClick={() => setQty(item.id, item.qty + 1)}
            className="grid size-9 place-items-center rounded-full hover:bg-powder/70"
            aria-label={`Agregar uno de ${item.name}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => remove(item.id)}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy"
        >
          <X className="size-4" /> Quitar
        </button>
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
  const cls = `w-full rounded-xl border bg-ivory px-4 text-[15px] outline-none transition focus:border-steel focus:ring-4 focus:ring-powder ${
    error ? "border-red-400" : "border-border"
  }`;
  const describedBy = error ? `${name}-error` : undefined;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm">{label}</span>
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
        <span id={describedBy} className="mt-1 block text-sm text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

function Confirmation({ code, total }: { code: string; total: number }) {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-3xl bg-powder/50 px-6 py-14 text-center">
      <CircleCheck className="mx-auto size-12 text-steel" strokeWidth={1.25} />
      <p className="mt-4 font-serif text-3xl">¡Pedido recibido!</p>
      <p className="mt-3 text-muted">
        Tu código es <strong className="text-navy">{code}</strong> · {formatPrice(total)}
      </p>
      <p className="mt-2 text-sm text-muted">Te contactaremos pronto para coordinar el pago y la entrega.</p>
      <Link
        href="/catalogo"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-medium text-ivory"
      >
        Seguir viendo
      </Link>
    </div>
  );
}
