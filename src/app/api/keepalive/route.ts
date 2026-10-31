import { createPublicClient } from "@/lib/supabase/public";

// Lo invoca el cron de Vercel (vercel.ts). Vercel envía `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error } = await createPublicClient()
    .from("categories")
    .select("id", { count: "exact", head: true });

  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, at: new Date().toISOString() });
}
