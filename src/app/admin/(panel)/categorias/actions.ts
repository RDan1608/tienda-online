"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";
import { slugify } from "@/lib/slug";

export type CategoryState = { status: "idle" } | { status: "ok"; at: number } | { status: "error"; message: string };

const schema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre").max(60, "Máximo 60 caracteres"),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export async function saveCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse({
    name: formData.get("name") ?? "",
    sort_order: formData.get("sort_order") || 0,
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const id = formData.get("id");
  if (id) {
    // Editar: el slug no cambia para no romper links como /catalogo?cat=joyeria.
    const { error } = await supabase
      .from("categories")
      .update(parsed.data)
      .eq("id", z.uuid().parse(id));
    if (error) return { status: "error", message: "No se pudo guardar." };
  } else {
    const slug = slugify(parsed.data.name);
    const { error } = await supabase.from("categories").insert({ ...parsed.data, slug });
    if (error) {
      return {
        status: "error",
        message: error.code === "23505" ? "Ya existe una categoría con ese nombre." : "No se pudo crear.",
      };
    }
  }

  updateTag(CATALOG_TAG);
  return { status: "ok", at: Date.now() };
}

export async function deleteCategory(formData: FormData): Promise<{ ok: boolean }> {
  const { supabase } = await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  // Los productos de esta categoría quedan "sin categoría" (on delete set null).
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false };
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/categorias");
  return { ok: true };
}
