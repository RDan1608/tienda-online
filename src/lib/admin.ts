import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Sesión actual + si está en public.admins (RLS deja leer solo la fila propia). */
// cache(): el diseño y la página piden lo mismo en la misma petición; se consulta una sola vez.
export const getAdmin = cache(async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, user, isAdmin: !!data };
});

/** Para Server Actions y páginas: corta si no es admin. RLS sigue siendo la barrera real. */
export async function requireAdmin(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const { supabase, user, isAdmin } = await getAdmin();
  if (!user) redirect("/admin/login");
  if (!isAdmin) throw new Error("No autorizado");
  return { supabase, user };
}
