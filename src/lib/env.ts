// NEXT_PUBLIC_* se inlinean en build: hay que referenciarlas literalmente.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  // Prioridad: override manual → dominio de producción que asigna Vercel → local.
  // Así cambiar el dominio en Vercel no requiere tocar código ni variables.
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    ((process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL)
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};

export function storageUrl(path: string) {
  return `${env.supabaseUrl}/storage/v1/object/public/products/${path}`;
}
