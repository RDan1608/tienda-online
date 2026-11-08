"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { slugify } from "@/lib/slug";

const BUCKET = "products";

const schema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Escribe el nombre").max(120, "Máximo 120 caracteres"),
  description: z.string().trim().max(2000, "Máximo 2000 caracteres"),
  price: z.coerce.number("Precio inválido").min(0, "Precio inválido").max(1_000_000, "Precio demasiado alto"),
  category_id: z.union([z.uuid(), z.literal("")]),
  tags: z.string().max(300, "Demasiadas etiquetas"),
  colors: z.string().max(500, "Demasiados colores"),
  colors_out: z.string().max(500),
  images: z
    .array(
      z.object({
        path: z.string().regex(/^[0-9a-f-]{36}\/[\w.-]+$/),
        alt: z.string().trim().max(150),
      }),
    )
    .max(8, "Máximo 8 fotos"),
});

export type ProductState =
  | { status: "idle" }
  | { status: "saved"; at: number; /** Pedidos sin comprar al proveedor que piden algo ya agotado. */ affected: number; hidden: boolean }
  | { status: "error"; message: string; fields?: Partial<Record<string, string>> };

function parseTags(raw: string) {
  const tags = raw
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, " "))
    .filter((t) => t && t.length <= 30);
  return [...new Set(tags)].slice(0, 10);
}

function parseColors(raw: string) {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const c of raw.split(",").map((x) => x.trim().replace(/\s+/g, " ")).filter((x) => x && x.length <= 30)) {
    if (!seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      colors.push(c);
    }
  }
  return colors.slice(0, 12);
}

export async function saveProduct(_prev: ProductState, formData: FormData): Promise<ProductState> {
  const { supabase } = await requireAdmin();

  let images: unknown;
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { status: "error", message: "Las fotos tienen un problema. Recarga la página." };
  }

  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price") ?? "",
    category_id: formData.get("category_id") ?? "",
    tags: formData.get("tags") ?? "",
    colors: formData.get("colors") ?? "",
    colors_out: formData.get("colors_out") ?? "",
    images,
  });

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { status: "error", message: "Revisa los datos marcados.", fields };
  }

  const d = parsed.data;
  // Cada foto debe vivir en la carpeta de ESTE producto.
  if (d.images.some((i) => !i.path.startsWith(`${d.id}/`))) {
    return { status: "error", message: "Una foto no pertenece a este producto." };
  }

  const colors = parseColors(d.colors);
  const colorsOut = parseColors(d.colors_out).filter((c) => !colors.some((x) => x.toLowerCase() === c.toLowerCase()));

  const fields = {
    name: d.name,
    description: d.description,
    price: Math.round(d.price * 100) / 100,
    category_id: d.category_id || null,
    tags: parseTags(d.tags),
    colors,
    colors_out: colorsOut,
    // Si tenía colores y ya no queda ninguno disponible, el producto está agotado: se oculta solo.
    is_active: formData.get("is_active") === "on" && !(colors.length === 0 && colorsOut.length > 0),
    is_featured: formData.get("is_featured") === "on",
  };

  const { data: existing } = await supabase.from("products").select("id").eq("id", d.id).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("products").update(fields).eq("id", d.id);
    if (error) return { status: "error", message: "No se pudo guardar. Intenta de nuevo." };
  } else {
    // slug único: base, base-2, base-3… (el slug no cambia al editar, para no romper links)
    const base = slugify(d.name);
    let inserted = false;
    for (let n = 1; n <= 6 && !inserted; n++) {
      const slug = n === 1 ? base : n < 6 ? `${base}-${n}` : `${base}-${crypto.randomUUID().slice(0, 6)}`;
      const { error } = await supabase.from("products").insert({ id: d.id, slug, ...fields });
      if (!error) inserted = true;
      else if (error.code !== "23505") return { status: "error", message: "No se pudo guardar. Intenta de nuevo." };
    }
    if (!inserted) return { status: "error", message: "No se pudo generar un nombre único." };
  }

  // Sincroniza fotos: reemplaza filas y borra del bucket las que ya no se usan.
  const { data: prev } = await supabase.from("product_images").select("path").eq("product_id", d.id);
  await supabase.from("product_images").delete().eq("product_id", d.id);
  if (d.images.length) {
    const { error } = await supabase.from("product_images").insert(
      d.images.map((img, i) => ({ product_id: d.id, path: img.path, alt: img.alt, sort_order: i })),
    );
    if (error) return { status: "error", message: "Se guardó el producto pero fallaron las fotos." };
  }
  const keep = new Set(d.images.map((i) => i.path));
  const orphaned = (prev ?? []).map((p) => p.path).filter((p) => !keep.has(p));
  if (orphaned.length) await supabase.storage.from(BUCKET).remove(orphaned);

  // Etiquetas nuevas escritas en el formulario pasan a la lista administrable.
  if (fields.tags.length) {
    await supabase.from("tags").upsert(fields.tags.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
  }

  updateTag(CATALOG_TAG);

  if (!existing) redirect(`/admin/productos/${d.id}?creado=1`);
  const affected = await countAffectedOrders(supabase, d.id, fields.is_active ? colorsOut : null);
  return { status: "saved", at: Date.now(), affected, hidden: !fields.is_active };
}

/**
 * Pedidos que todavía NO se compran al proveedor (nuevo / confirmado) y piden algo que ya no se vende:
 * el producto entero (`outColors` = null) o alguno de los colores agotados. La admin los contacta.
 */
async function countAffectedOrders(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
  outColors: string[] | null,
) {
  if (outColors && outColors.length === 0) return 0;
  const { data } = await supabase
    .from("order_items")
    .select("order_id, color, order:orders!inner(status)")
    .eq("product_id", productId)
    .in("order.status", ["nuevo", "confirmado"]);
  const rows = (data ?? []).filter((r) => outColors === null || (r.color && outColors.includes(r.color)));
  return new Set(rows.map((r) => r.order_id)).size;
}

export async function toggleActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  await supabase.from("products").update({ is_active: active }).eq("id", id);
  updateTag(CATALOG_TAG);
  // Al ocultar (agotado) se avisa cuántos pedidos pendientes lo incluyen.
  const affected = active ? 0 : await countAffectedOrders(supabase, id, null);
  redirect(affected > 0 ? `/admin/productos?aviso=${affected}` : "/admin/productos");
}

export async function toggleFeatured(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const featured = formData.get("featured") === "true";
  await supabase.from("products").update({ is_featured: featured }).eq("id", id);
  updateTag(CATALOG_TAG);
  redirect("/admin/productos");
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));

  const { data: imgs } = await supabase.from("product_images").select("path").eq("product_id", id);
  if (imgs?.length) await supabase.storage.from(BUCKET).remove(imgs.map((i) => i.path));
  // Los pedidos conservan nombre y precio (snapshot); product_id pasa a null.
  await supabase.from("products").delete().eq("id", id);

  updateTag(CATALOG_TAG);
  redirect("/admin/productos");
}
