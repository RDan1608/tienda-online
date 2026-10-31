import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";

type NewOrder = {
  id: string;
  code: string;
  total: number;
  customer: { name: string; phone: string; email: string; notes: string };
  items: { product_id: string; qty: number }[];
};

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Notifica al admin de un pedido nuevo. Sin RESEND_API_KEY no hace nada. */
export async function sendNewOrderEmail(order: NewOrder) {
  const apiKey = process.env.RESEND_API_KEY;
  // ORDER_NOTIFY_EMAIL admite varios correos separados por coma.
  const recipients = (process.env.ORDER_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (!apiKey || !recipients.length) return;

  // Nombres y precios desde la BD (datos públicos), no desde el cliente.
  const { data: products } = await createPublicClient()
    .from("products")
    .select("id, name, price")
    .in("id", order.items.map((i) => i.product_id));
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const rows = order.items
    .map((i) => {
      const p = byId.get(i.product_id);
      return `<tr><td style="padding:6px 0">${escape(p?.name ?? "Producto")} × ${i.qty}</td><td style="padding:6px 0;text-align:right">${formatPrice(Number(p?.price ?? 0) * i.qty)}</td></tr>`;
    })
    .join("");

  const c = order.customer;
  const html = `
<div style="font-family:system-ui,sans-serif;color:#364d66;max-width:520px">
  <h2 style="margin:0 0 4px">Pedido nuevo ${order.code}</h2>
  <p style="margin:0 0 16px;color:#5d7186">Total: <strong>${formatPrice(order.total)}</strong></p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #dce7f0;border-bottom:1px solid #dce7f0">${rows}</table>
  <p style="margin:16px 0 4px"><strong>${escape(c.name)}</strong></p>
  <p style="margin:0">Tel: <a href="tel:${escape(c.phone)}">${escape(c.phone)}</a></p>
  ${c.email ? `<p style="margin:0">Email: ${escape(c.email)}</p>` : ""}
  ${c.notes ? `<p style="margin:12px 0 0;white-space:pre-line">Notas: ${escape(c.notes)}</p>` : ""}
  <p style="margin:24px 0 0"><a href="${env.siteUrl}/admin/pedidos/${order.id}" style="background:#364d66;color:#f7f6f2;padding:10px 18px;border-radius:999px;text-decoration:none">Ver en el panel</a></p>
</div>`;

  const resend = new Resend(apiKey);
  const from = process.env.ORDER_FROM_EMAIL || `${site.name} <onboarding@resend.dev>`;
  const subject = `Pedido nuevo ${order.code} · ${formatPrice(order.total)}`;

  // Un envío por destinatario: si uno es rechazado, los demás igual reciben el aviso.
  // El pedido ya quedó guardado; el email es solo aviso.
  const results = await Promise.allSettled(
    recipients.map(async (to) => {
      const { error } = await resend.emails.send({ from, to, subject, html });
      if (error) throw new Error(`${to}: ${error.message}`);
    }),
  );
  for (const r of results) {
    if (r.status === "rejected") console.error("[email] fallo al notificar pedido", order.code, r.reason);
  }
}
