import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Primera foto (portada) de cada producto, en una sola consulta. */
export async function coversFor(supabase: Supabase, productIds: (string | null)[]) {
  const ids = [...new Set(productIds.filter((x): x is string => !!x))];
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data } = await supabase
    .from("product_images")
    .select("product_id, path, sort_order")
    .in("product_id", ids)
    .order("sort_order");
  for (const r of data ?? []) if (!map.has(r.product_id)) map.set(r.product_id, r.path);
  return map;
}
