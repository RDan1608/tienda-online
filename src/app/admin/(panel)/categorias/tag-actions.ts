"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/data/catalog";

export type TagState = { status: "idle" } | { status: "ok"; at: number } | { status: "error"; message: string };

const nameSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase().replace(/\s+/g, " "))
  .pipe(z.string().min(1, "Escribe la etiqueta").max(30, "Máximo 30 caracteres").regex(/^[^,]+$/, "Sin comas"));

/** Crea una etiqueta nueva (la lista que el admin ofrece al armar productos y que ven los clientes como filtro). */
export async function createTag(_prev: TagState, formData: FormData): Promise<TagState> {
  const { supabase } = await requireAdmin();
  const parsed = nameSchema.safeParse(formData.get("name") ?? "");
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const { error } = await supabase.from("tags").insert({ name: parsed.data });
  if (error) {
    return { status: "error", message: error.code === "23505" ? "Esa etiqueta ya existe." : "No se pudo crear." };
  }
  return { status: "ok", at: Date.now() };
}

/** Renombra la etiqueta en la lista y en todos los productos que la usan. */
export async function renameTag(_prev: TagState, formData: FormData): Promise<TagState> {
  const { supabase } = await requireAdmin();
  const oldName = nameSchema.safeParse(formData.get("old") ?? "");
  const newName = nameSchema.safeParse(formData.get("name") ?? "");
  if (!oldName.success || !newName.success) {
    return { status: "error", message: newName.success ? "Etiqueta inválida." : newName.error.issues[0].message };
  }
  if (oldName.data === newName.data) return { status: "ok", at: Date.now() };

  const { error } = await supabase.rpc("rename_tag", { p_old: oldName.data, p_new: newName.data });
  if (error) {
    return { status: "error", message: error.code === "23505" ? "Ya existe una etiqueta con ese nombre." : "No se pudo renombrar." };
  }
  updateTag(CATALOG_TAG);
  return { status: "ok", at: Date.now() };
}

/** Borra la etiqueta de la lista y de todos los productos. */
export async function deleteTag(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = nameSchema.safeParse(formData.get("name") ?? "");
  if (!name.success) return;
  await supabase.rpc("delete_tag", { p_name: name.data });
  updateTag(CATALOG_TAG);
}
