"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Check, Trash2 } from "lucide-react";

/**
 * Aviso de lo que acaba de pasar al crear, renombrar o eliminar. Las acciones se aplican sin recargar la
 * página, así que sin esto el admin (sobre todo en el celular, donde la lista queda fuera de pantalla)
 * no se entera de que funcionó. Tienda mínima compartida por las listas de etiquetas y categorías.
 */
type Notice = { id: number; message: string; tone: "ok" | "removed"; highlight?: string };

let current: Notice | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function notify(message: string, tone: Notice["tone"] = "ok", highlight?: string) {
  current = { id: ++seq, message, tone, highlight };
  emit();
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    emit();
  }, 3800);
}

const useNotice = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );

/** Nombre del elemento que acaba de crearse o cambiarse, para resaltarlo y llevarlo a la vista. */
export function useHighlight(name: string) {
  const notice = useNotice();
  return notice?.highlight === name ? notice.id : null;
}

export function NoticeToast() {
  const notice = useNotice();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-8"
    >
      {notice && (
        <p
          key={notice.id}
          className="notice-in pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full bg-navy py-2.5 pl-3 pr-5 text-sm font-semibold text-ivory shadow-float"
        >
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-full ${
              notice.tone === "ok" ? "bg-emerald-500 text-white" : "bg-rose-badge text-white"
            }`}
          >
            {notice.tone === "ok" ? <Check className="size-3.5" strokeWidth={3} /> : <Trash2 className="size-3.5" />}
          </span>
          {notice.message}
        </p>
      )}
    </div>
  );
}

/** Lleva a la vista el elemento resaltado (una vez por aviso). */
export function useScrollToHighlight(ref: React.RefObject<HTMLElement | null>, active: number | null) {
  useEffect(() => {
    if (active != null) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active, ref]);
}
