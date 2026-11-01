"use server";

import { after } from "next/server";
import { checkBotId } from "botid/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { sendNewOrderEmail } from "@/lib/email";

const itemsSchema = z
  .array(z.object({ product_id: z.uuid(), qty: z.int().min(1).max(99), color: z.string().trim().max(40).nullable().optional() }))
  .min(1, "Tu carrito está vacío")
  .max(50);

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return /^[+\d\s()-]+$/.test(v) && digits >= 8 && digits <= 15;
    }, "Escribe un teléfono válido (8 dígitos)"),
  email: z.union([z.literal(""), z.email("Correo inválido").max(254)]),
  notes: z.string().trim().max(1000, "Máximo 1000 caracteres"),
  website: z.string().max(0), // honeypot: los bots lo llenan
});

export type OrderState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Partial<Record<string, string>> }
  | { status: "success"; code: string; total: number; phone: string };

export async function createOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  // Captcha invisible. Si el servicio de verificación falla, se deja pasar (no perder pedidos reales);
  // solo se bloquea cuando BotID confirma que es automatizado.
  const isBot = await checkBotId().then((v) => v.isBot, () => false);
  if (isBot) return { status: "error", message: "No pudimos verificar tu pedido. Intenta de nuevo." };

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    notes: formData.get("notes") ?? "",
    website: formData.get("website") ?? "",
  });

  let items: z.infer<typeof itemsSchema>;
  try {
    items = itemsSchema.parse(JSON.parse(String(formData.get("items") ?? "[]")));
  } catch {
    return { status: "error", message: "Tu carrito tiene un problema. Recarga la página e intenta de nuevo." };
  }

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (key === "website") return { status: "error", message: "No se pudo enviar el pedido." };
      fields[key] ??= issue.message;
    }
    return { status: "error", message: "Revisa los datos marcados.", fields };
  }

  const { name, phone, email, notes } = parsed.data;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: name,
    p_phone: phone,
    p_email: email,
    p_notes: notes,
    p_items: items,
  });

  if (error || !data?.[0]) {
    // Mensajes de create_order pensados para el usuario (P0001/P0002).
    const known = error?.code === "P0001" || error?.code === "P0002";
    return {
      status: "error",
      message: known ? error.message : "No pudimos registrar tu pedido. Intenta de nuevo.",
    };
  }

  const order = data[0] as { order_id: string; order_code: string; order_total: number };

  // El email al admin sale después de responder al cliente.
  after(() =>
    sendNewOrderEmail({
      id: order.order_id,
      code: order.order_code,
      total: Number(order.order_total),
      customer: { name, phone, email, notes },
      items,
    }),
  );

  return { status: "success", code: order.order_code, total: Number(order.order_total), phone };
}
