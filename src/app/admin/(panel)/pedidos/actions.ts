"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { orderStatuses } from "@/lib/orders";

const schema = z.object({
  id: z.uuid(),
  status: z.enum(orderStatuses.map((s) => s.value) as [string, ...string[]]),
});

export async function setOrderStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { id, status } = schema.parse({ id: formData.get("id"), status: formData.get("status") });

  await supabase.from("orders").update({ status }).eq("id", id);

  // El trigger sync_sold_count mueve "más vendidos" al confirmar/cancelar.
  updateTag(CATALOG_TAG);
}
