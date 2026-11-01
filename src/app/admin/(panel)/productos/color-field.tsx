"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const MAX_COLORS = 12;
const clean = (v: string) => v.trim().replace(/\s+/g, " ").replace(/,/g, "").slice(0, 30);

/**
 * Colores en los que existe el producto. Quien pide elige uno en la página del producto.
 * Vacío = el producto no tiene variantes de color y se pide directo.
 */
export function ColorField({ colors: initial }: { colors: string[] }) {
  const [colors, setColors] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  function add() {
    const c = clean(draft);
    if (!c) return;
    const exists = colors.some((x) => x.toLowerCase() === c.toLowerCase());
    if (!exists && colors.length < MAX_COLORS) setColors((l) => [...l, c]);
    setDraft("");
  }

  return (
    <div>
      <input type="hidden" name="colors" value={colors.join(", ")} />
      <p className="mb-1 text-sm font-semibold">
        Colores <span className="font-normal text-muted">· {colors.length ? `${colors.length} (máx. ${MAX_COLORS})` : "opcional"}</span>
      </p>
      <p className="mb-2.5 text-sm text-muted">
        Si el producto viene en varios colores, agrégalos y quien pida tendrá que elegir uno. Si no, déjalo vacío.
      </p>

      {colors.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2" aria-label="Colores del producto">
          {colors.map((c) => (
            <li key={c} className="inline-flex h-10 items-center gap-1 rounded-full bg-navy pl-4 pr-1.5 text-sm font-medium text-ivory">
              {c}
              <button
                type="button"
                onClick={() => setColors((l) => l.filter((x) => x !== c))}
                aria-label={`Quitar color ${c}`}
                className="grid size-7 place-items-center rounded-full transition hover:bg-ivory/20 active:scale-90"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Enter agrega el color, no envía el producto
              add();
            }
          }}
          placeholder="Ej. Rosa, Celeste, Negro…"
          aria-label="Nuevo color"
          maxLength={30}
          disabled={colors.length >= MAX_COLORS}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-ivory px-4 text-base outline-none transition focus:border-steel focus:ring-4 focus:ring-powder disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={colors.length >= MAX_COLORS}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold transition hover:border-steel active:scale-95 disabled:opacity-50"
        >
          <Plus className="size-4" /> Agregar
        </button>
      </div>
    </div>
  );
}
