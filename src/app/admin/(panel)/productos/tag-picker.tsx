"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

const clean = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, "").slice(0, 30);

/**
 * Elegir etiquetas tocando (en vez de escribirlas separadas por comas).
 * Las nuevas se agregan aquí mismo y quedan en la lista al guardar el producto.
 */
export function TagPicker({ options, selected: initial }: { options: string[]; selected: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [extra, setExtra] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  // Las que el producto ya tiene siempre se muestran, aunque ya no estén en la lista general.
  const all = [...new Set([...options, ...initial, ...extra])].sort((a, b) => a.localeCompare(b, "es"));
  const toggle = (t: string) => setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  function addDraft() {
    const t = clean(draft);
    if (!t) return;
    if (!all.includes(t)) setExtra((e) => [...e, t]);
    setSelected((s) => (s.includes(t) || s.length >= 10 ? s : [...s, t]));
    setDraft("");
  }

  return (
    <div>
      <input type="hidden" name="tags" value={selected.join(", ")} />
      <p className="mb-2 text-sm font-semibold">
        Etiquetas <span className="font-normal text-muted">· {selected.length} elegidas (máx. 10)</span>
      </p>

      {all.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Etiquetas disponibles">
          {all.map((t) => {
            const on = selected.includes(t);
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  aria-pressed={on}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${
                    on ? "border-navy bg-navy text-ivory" : "border-border bg-ivory hover:border-steel"
                  }`}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                  {t}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Aún no hay etiquetas. Escribe la primera aquí abajo.</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Enter agrega la etiqueta, no envía el producto
              addDraft();
            }
          }}
          placeholder="Nueva etiqueta…"
          aria-label="Nueva etiqueta"
          maxLength={30}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-ivory px-4 text-base outline-none transition focus:border-steel focus:ring-4 focus:ring-powder"
        />
        <button
          type="button"
          onClick={addDraft}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold transition hover:border-steel active:scale-95"
        >
          <Plus className="size-4" /> Agregar
        </button>
      </div>
    </div>
  );
}
