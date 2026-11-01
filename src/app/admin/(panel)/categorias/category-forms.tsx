"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";
import { useSubmit } from "@/lib/use-submit";
import { deleteCategory, saveCategory, type CategoryState } from "./actions";

const input =
  "h-11 rounded-xl border border-border bg-ivory px-3 text-[15px] outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";

function Status({ state }: { state: CategoryState }) {
  return (
    <span role="status" className="text-sm">
      {state.status === "ok" && <Check className="size-4 text-steel" aria-label="Guardado" />}
      {state.status === "error" && <span className="text-rose-ink">{state.message}</span>}
    </span>
  );
}

export function CategoryRow({ category, productCount }: { category: Category; productCount: number }) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(saveCategory, { status: "idle" });
  const [confirm, setConfirm] = useState(false);
  const onSubmit = useSubmit(action);

  return (
    <li className="p-3 sm:p-4">
      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2 sm:gap-3">
        <input type="hidden" name="id" value={category.id} />
        <input
          name="sort_order"
          type="number"
          min={0}
          defaultValue={category.sort_order}
          aria-label={`Orden de ${category.name}`}
          className={`${input} w-20`}
        />
        <input name="name" defaultValue={category.name} aria-label="Nombre" maxLength={60} className={`${input} min-w-0 flex-1`} />
        <button
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm transition hover:border-steel disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : "Guardar"}
        </button>
        <Status state={state} />
      </form>

      <form action={deleteCategory} className="mt-2 flex items-center gap-3 pl-1 text-xs text-muted">
        <input type="hidden" name="id" value={category.id} />
        <span>
          /{category.slug} · {productCount} {productCount === 1 ? "producto" : "productos"}
        </span>
        {confirm ? (
          <>
            <span className="text-navy">
              {productCount > 0 ? "Sus productos quedarán sin categoría." : "¿Eliminar?"}
            </span>
            <button className="font-medium text-rose-ink">Sí, eliminar</button>
            <button type="button" onClick={() => setConfirm(false)} className="hover:text-navy">
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex items-center gap-1 transition hover:text-rose-ink"
          >
            <Trash2 className="size-3.5" /> Eliminar
          </button>
        )}
      </form>
    </li>
  );
}

export function CategoryForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(saveCategory, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit(action);

  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-wrap items-center gap-2 sm:gap-3">
      <input name="sort_order" type="number" min={0} placeholder="Orden" aria-label="Orden" className={`${input} w-20`} />
      <input name="name" placeholder="Nombre" aria-label="Nombre" maxLength={60} required className={`${input} min-w-0 flex-1`} />
      <button
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-ivory transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : "Agregar"}
      </button>
      <Status state={state} />
    </form>
  );
}
