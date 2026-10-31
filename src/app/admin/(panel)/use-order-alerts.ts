"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type NewOrderToast = { id: string; code: string; name: string; total: number };

// Preferencia de sonido en localStorage, expuesta como store para evitar desajustes de hidratación.
const KEY = "admin-sound";
const listeners = new Set<() => void>();
const readSound = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeSound = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

function chime(ctx: AudioContext) {
  const t = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = t + i * 0.16;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

/**
 * Escucha pedidos nuevos en tiempo real (Supabase Realtime respeta RLS:
 * solo llegan eventos si la sesión es de admin) y refresca la pantalla.
 */
export function useOrderAlerts() {
  const router = useRouter();
  const [toast, setToast] = useState<NewOrderToast | null>(null);
  const soundOn = useSyncExternalStore(subscribeSound, readSound, () => false);
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    if (!readSound()) return;
    try {
      ctxRef.current ??= new AudioContext();
      void ctxRef.current.resume();
      chime(ctxRef.current);
    } catch {
      // Sin audio disponible: la alerta visual sigue funcionando.
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // La sesión vive en cookies: hay que pasarle el token al websocket ANTES de suscribirse.
      // Si no, el canal entra como anónimo y RLS no entrega ningún pedido (sin error visible).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;
      await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      channel = supabase
        .channel("admin-new-orders")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
          const o = payload.new as { id: string; code: string; customer_name: string; total: number };
          setToast({ id: o.id, code: o.code, name: o.customer_name, total: Number(o.total) });
          play();
          router.refresh();
        })
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, play]);

  // El toast se cierra solo.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 12000);
    return () => clearTimeout(t);
  }, [toast]);

  // El navegador solo permite audio tras un gesto del usuario: el clic en el botón lo habilita.
  const toggleSound = useCallback(() => {
    const next = !readSound();
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
    listeners.forEach((l) => l());
    if (next) {
      try {
        ctxRef.current ??= new AudioContext();
        void ctxRef.current.resume();
        chime(ctxRef.current);
      } catch {}
    }
  }, []);

  return { toast, dismiss: () => setToast(null), soundOn, toggleSound };
}
