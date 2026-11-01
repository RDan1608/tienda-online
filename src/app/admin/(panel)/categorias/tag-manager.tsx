"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useSubmit } from "@/lib/use-submit";
import { createTag, deleteTag, renameTag, type TagState } from "./tag-actions";

const input =
  "h-11 min-w-0 flex-1 rounded-xl border border-border bg-ivory px-3 text-base outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";

export function TagCreate() {
  const [state, action, pending] = useActionState<TagState, FormData>(createTag, { status: "idle" });
  const onSubmit = useSubmit(action);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") form.current?.reset();
  }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} className="flex items-center gap-2">
      <input name="name" placeholder="Nueva etiqueta (ej. kawaii, dorado)" aria-label="Nueva etiqueta" maxLength={30} required className={input} />
      <button
        disabled={pending}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-navy px-5 text-sm font-semibold text-ivory transition active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Agregar
      </button>
      {state.status === "error" && (
        <span role="alert" className="text-sm font-medium text-rose-ink">
          {state.message}
        </span>
      )}
    </form>
  );
}

export function TagRow({ name, count }: { name: string; count: number }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState<TagState, FormData>(renameTag, { status: "idle" });
  const onSubmit = useSubmit(action);

  // Al guardarse con éxito, se cierra la edición (estado derivado durante el render).
  const [seenAt, setSeenAt] = useState(0);
  if (state.status === "ok" && state.at !== seenAt) {
    setSeenAt(state.at);
    setEditing(false);
  }

  return (
    <li className="p-3.5">
      {editing ? (
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input type="hidden" name="old" value={name} />
          <input name="name" defaultValue={name} aria-label={`Renombrar ${name}`} maxLength={30} autoFocus className={input} />
          <button disabled={pending} aria-label="Guardar" className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-ivory transition active:scale-90 disabled:opacity-60">
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-5" />}
          </button>
          <button type="button" onClick={() => setEditing(false)} aria-label="Cancelar" className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition hover:bg-powder active:scale-90">
            <X className="size-5" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{name}</p>
            <p className="text-xs text-muted">
              {count} {count === 1 ? "producto" : "productos"}
            </p>
          </div>
          {confirm ? (
            <form action={deleteTag} className="flex items-center gap-1.5">
              <input type="hidden" name="name" value={name} />
              <span className="mr-1 hidden text-xs text-muted sm:inline">{count > 0 ? "Se quita de sus productos" : "¿Eliminar?"}</span>
              <button className="h-10 rounded-full bg-rose-badge px-4 text-sm font-semibold text-white transition active:scale-95">Eliminar</button>
              <button type="button" onClick={() => setConfirm(false)} className="h-10 px-3 text-sm font-medium text-muted hover:text-navy">
                No
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={`Renombrar ${name}`}
                className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-powder hover:text-navy active:scale-90"
              >
                <Pencil className="size-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => setConfirm(true)}
                aria-label={`Eliminar ${name}`}
                className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-blush hover:text-rose-ink active:scale-90"
              >
                <Trash2 className="size-[18px]" />
              </button>
            </>
          )}
        </div>
      )}
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm font-medium text-rose-ink">
          {state.message}
        </p>
      )}
    </li>
  );
}
