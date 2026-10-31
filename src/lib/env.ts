// NEXT_PUBLIC_* se inlinean en build: hay que referenciarlas literalmente.
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
};

export function storageUrl(path: string) {
  return `${env.supabaseUrl}/storage/v1/object/public/products/${path}`;
}
