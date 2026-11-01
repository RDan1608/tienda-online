import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import type { Category } from "@/lib/types";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const newId = crypto.randomUUID();
  const [{ data }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase.from("tags").select("name").order("name"),
  ]);

  return (
    <>
      <Link href="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-navy">
        <ChevronLeft className="size-4" /> Productos
      </Link>
      <h1 className="mb-8 font-display text-4xl font-semibold tracking-[-0.025em]">Nuevo producto</h1>
      {/* id nuevo por visita: Next conserva ocultas las páginas anteriores y su estado */}
      <ProductForm key={newId} newId={newId} product={null}
        categories={(data ?? []) as Category[]}
        tagOptions={(tags ?? []).map((t) => t.name)}
      />
    </>
  );
}
