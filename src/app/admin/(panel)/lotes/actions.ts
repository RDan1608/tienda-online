"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";

const settings = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(60),
  min_orders: z.coerce.number().int().min(1).max(1000),
  deadline: z.union([z.literal(""), z.iso.date()]),
});

/** Cambia el nombre, el mínimo de pedidos o la fecha límite del lote abierto. */
export async function updateBatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const d = settings.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    min_orders: formData.get("min_orders"),
    deadline: formData.get("deadline") ?? "",
  });
  await supabase
    .from("batches")
    .update({ name: d.name, min_orders: d.min_orders, deadline: d.deadline || null })
    .eq("id", d.id)
    .eq("status", "abierto");
  revalidatePath("/admin/lotes");
}

/** Cierra el lote: pedidos confirmados pasan a "Pedido realizado"; los sin confirmar pasan al lote nuevo. */
export async function closeBatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  await supabase.rpc("close_batch", { p_id: id });
  updateTag(CATALOG_TAG); // "más vendidos" cambia al confirmarse pedidos
  revalidatePath("/admin/lotes");
  revalidatePath("/admin/pedidos");
}

const stage = z.enum(["en_camino", "listo", "entregado"]);

/** Mueve todos los pedidos del lote a la siguiente etapa de una vez. */
export async function advanceBatch(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const status = stage.parse(formData.get("status"));
  await supabase.rpc("advance_batch", { p_id: id, p_status: status });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/lotes");
  revalidatePath("/admin/pedidos");
}
