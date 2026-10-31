import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  crons: [
    // Una consulta diaria evita que el plan gratis de Supabase pause la base por inactividad.
    { path: "/api/keepalive", schedule: "0 12 * * *" },
  ],
};
