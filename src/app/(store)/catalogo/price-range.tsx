"use client";

import { useId } from "react";

const lempiras = (n: number) => `L ${n.toLocaleString("es-HN")}`;

/**
 * Slider de dos puntas con dos <input type="range"> nativos: accesible con teclado,
 * lector de pantalla y táctil sin librerías. Los extremos se guardan como "sin límite".
 */
export function PriceRange({
  lo,
  hi,
  step,
  min,
  max,
  onChange,
}: {
  lo: number;
  hi: number;
  step: number;
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const id = useId();
  const a = Math.min(Math.max(min ?? lo, lo), hi - step);
  const b = Math.max(Math.min(max ?? hi, hi), a + step);
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const commit = (x: number, y: number) => onChange(x <= lo ? null : x, y >= hi ? null : y);

  // Si ambos puntos están pegados al final, el mínimo debe quedar encima para poder moverlo.
  const minOnTop = a > hi - (hi - lo) * 0.15;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm tabular-nums">
        <span id={`${id}-min`}>{lempiras(a)}</span>
        <span className="text-muted" aria-hidden>
          –
        </span>
        <span id={`${id}-max`}>{b >= hi ? `${lempiras(b)}+` : lempiras(b)}</span>
      </div>

      <div className="relative mt-2 h-10">
        {/* pista y tramo activo: inset de medio pulgar para alinear con el recorrido real */}
        <div className="absolute inset-x-[13px] top-1/2 h-1 -translate-y-1/2 rounded-full bg-powder" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-navy"
          style={{ left: `calc(13px + (100% - 26px) * ${pct(a) / 100})`, right: `calc(13px + (100% - 26px) * ${1 - pct(b) / 100})` }}
        />
        <input
          type="range"
          className="range"
          style={{ zIndex: minOnTop ? 3 : 2 }}
          min={lo}
          max={hi}
          step={step}
          value={a}
          aria-labelledby={`${id}-min`}
          aria-label="Precio mínimo"
          onChange={(e) => commit(Math.min(Number(e.target.value), b - step), b)}
        />
        <input
          type="range"
          className="range"
          style={{ zIndex: 2 }}
          min={lo}
          max={hi}
          step={step}
          value={b}
          aria-label="Precio máximo"
          onChange={(e) => commit(a, Math.max(Number(e.target.value), a + step))}
        />
      </div>
    </div>
  );
}
