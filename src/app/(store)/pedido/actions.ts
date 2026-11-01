"use server";

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import type { OrderStatus } from "@/lib/orders";

export type Tracked = {
  code: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  customer: string;
  items: { name: string; qty: number; price: number }[];
  events: { status: OrderStatus; at: string; note: string | null }[];
};

export type TrackState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "found"; order: Tracked };

const schema = z.object({
  code: z.string().trim().min(4).max(20),
  phone: z.string().trim().min(8).max(20),
});

/** Seguimiento: el código solo no basta, hace falta el teléfono con el que se pidió. */
export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = schema.safeParse({ code: formData.get("code") ?? "", phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { status: "error", message: "Escribe tu código (P-XXXXXX) y tu teléfono." };

  const { data, error } = await createPublicClient().rpc("track_order", {
    p_code: parsed.data.code,
    p_phone: parsed.data.phone,
  });

  if (error || !data) {
    // P0003 / P0004 traen un mensaje pensado para la persona.
    const known = error?.code === "P0003" || error?.code === "P0004";
    return { status: "error", message: known ? error.message : "No pudimos consultar tu pedido. Intenta de nuevo." };
  }
  return { status: "found", order: data as unknown as Tracked };
}
