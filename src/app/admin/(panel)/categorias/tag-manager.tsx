"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useSubmit } from "@/lib/use-submit";
import { createTag, deleteTag, renameTag, type TagState } from "./tag-actions";
import { notify, useHighlight, useScrollToHighlight } from "./notice";

const input =
  "h-11 min-w-0 flex-1 rounded-xl border border-border bg-ivory px-3 text-base outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";

const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

export function TagCreate() {
  const [state, action, pending] = useActionState<TagState, FormData>(createTag, { status: "idle" });
  const onSubmit = useSubmit(action);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "ok") return;
    const field = form.current?.elements.namedItem("name") as HTMLInputElement | null;
    const name = normalize(field?.value ?? "");
    notify(`Etiqueta «${name}» creada`, "ok", name);
    form.current?.reset();
    field?.focus({ preventScroll: true });
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
  const [leaving, setLeaving] = useState(false);
  const [removing, startRemoving] = useTransition();
  const [state, action, pending] = useActionState<TagState, FormData>(renameTag, { status: "idle" });
  const submit = useSubmit(action);
  const newName = useRef("");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    newName.current = normalize(String(new FormData(e.currentTarget).get("name") ?? ""));
    submit(e);
  };
  const row = useRef<HTMLLIElement>(null);
  const highlight = useHighlight(name);
  useScrollToHighlight(row, highlight);

  // Al guardarse con éxito, se cierra la edición (estado derivado durante el render).
  const [seenAt, setSeenAt] = useState(0);
  if (state.status === "ok" && state.at !== seenAt) {
    setSeenAt(state.at);
    setEditing(false);
  }

  // El aviso se da en un efecto: tocar un almacén externo no se hace durante el render.
  const renamed = useRef(0);
  useEffect(() => {
    if (state.status !== "ok" || renamed.current === state.at) return;
    renamed.current = state.at;
    notify(`Etiqueta renombrada a «${newName.current}»`, "ok", newName.current);
  }, [state]);

  function remove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setLeaving(true);
    startRemoving(async () => {
      const result = await deleteTag(data);
      if (result.ok) {
        notify(`Etiqueta «${name}» eliminada`, "removed");
      } else {
        setLeaving(false);
        notify("No se pudo eliminar. Intenta otra vez.", "removed");
      }
    });
  }

  return (
    <li ref={row} className={`p-3.5 ${leaving ? "row-out" : highlight ? "row-flash" : ""}`}>
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
            <form onSubmit={remove} className="flex items-center gap-1.5">
              <input type="hidden" name="name" value={name} />
              <span className="mr-1 hidden text-xs text-muted sm:inline">{count > 0 ? "Se quita de sus productos" : "¿Eliminar?"}</span>
              <button disabled={removing} className="h-10 rounded-full bg-rose-badge px-4 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60">
                {removing ? "Eliminando…" : "Eliminar"}
              </button>
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
