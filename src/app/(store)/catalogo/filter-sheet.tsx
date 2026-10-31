"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

const SheetClose = createContext<() => void>(() => {});

/** Cierra la hoja actual CON animación (para botones dentro de la hoja). */
export function useSheetClose() {
  return useContext(SheetClose);
}

/**
 * Hoja inferior para móvil sobre <dialog> nativo (foco atrapado, Esc, inert gratis).
 * - Sale con animación (el cierre nativo es instantáneo).
 * - Se cierra arrastrando hacia abajo: con distancia o con un "flick" rápido (velocidad).
 * - Dentro de la hoja, `useSheetClose()` cierra con animación.
 */
export function FilterSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const drag = useRef<{ y0: number; t0: number; dy: number } | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      closing.current = false;
      if (panel.current) panel.current.style.transform = "";
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);

    const el = panel.current;
    const finish = () => {
      setLeaving(false);
      onClose();
    };
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();

    const from = getComputedStyle(el).transform;
    el.style.transform = "";
    const anim = el.animate(
      [{ transform: from === "none" ? "translateY(0)" : from }, { transform: "translateY(100%)" }],
      { duration: 240, easing: EASE_DRAWER, fill: "forwards" },
    );
    anim.onfinish = finish;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (closing.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { y0: e.clientY, t0: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (panel.current) panel.current.style.transition = "none";
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || !panel.current) return;
    d.dy = e.clientY - d.y0;
    // Hacia arriba hay fricción (no un tope seco).
    panel.current.style.transform = `translateY(${d.dy > 0 ? d.dy : d.dy * 0.12}px)`;
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || !panel.current) return;
    const velocity = d.dy / Math.max(performance.now() - d.t0, 1); // px/ms
    if (d.dy > 120 || (d.dy > 40 && velocity > 0.3)) return requestClose();
    panel.current.style.transition = `transform 280ms ${EASE_DRAWER}`;
    panel.current.style.transform = "";
  }

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-label={title}
      {...(leaving ? { "data-closing": "" } : {})}
      onCancel={(e) => {
        e.preventDefault(); // Esc: cerrar con animación
        requestClose();
      }}
      onClick={(e) => e.target === dialog.current && requestClose()}
    >
      <div ref={panel} className="sheet-panel flex max-h-[88dvh] flex-col rounded-t-[28px] bg-ivory text-navy shadow-float">
        <div
          className="cursor-grab touch-none select-none px-5 pb-2 pt-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-dusty" aria-hidden />
          <div className="flex items-center justify-between">
            <p className="font-display text-xl font-bold tracking-[-0.025em]">{title}</p>
            <button
              type="button"
              onClick={requestClose}
              onPointerDown={(e) => e.stopPropagation()}
              className="grid size-10 place-items-center rounded-full transition hover:bg-powder active:scale-90"
              aria-label={`Cerrar ${title.toLowerCase()}`}
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <SheetClose.Provider value={requestClose}>
          <div className="overflow-y-auto overscroll-contain px-5 pb-3">{children}</div>

          {footer && (
            <div className="border-t border-border bg-ivory p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </SheetClose.Provider>
      </div>
    </dialog>
  );
}
