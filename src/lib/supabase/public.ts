import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Cliente sin cookies para lecturas públicas: se puede usar dentro de "use cache".
export function createPublicClient() {
  return createSupabaseClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
