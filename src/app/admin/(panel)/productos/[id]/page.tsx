import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import type { Category } from "@/lib/types";
import { ProductForm, type FormProduct } from "../product-form";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const [{ data: p }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, description, price, category_id, tags, is_active, is_featured, images:product_images(path, alt, sort_order)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
  ]);
  if (!p) notFound();

  const product: FormProduct = {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    category_id: p.category_id,
    tags: p.tags,
    is_active: p.is_active,
    is_featured: p.is_featured,
    images: [...(p.images as { path: string; alt: string; sort_order: number }[])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ path, alt }) => ({ path, alt })),
  };

  return (
    <>
      <Link href="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-navy">
        <ChevronLeft className="size-4" /> Productos
      </Link>
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="font-serif text-4xl font-medium text-balance">{p.name}</h1>
        {p.is_active && (
          <Link
            href={`/producto/${p.slug}`}
            target="_blank"
            className="inline-flex shrink-0 items-center gap-1.5 pt-2 text-sm text-muted hover:text-navy"
          >
            Ver en tienda <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
      <ProductForm
        key={p.id}
        product={product}
        categories={(categories ?? []) as Category[]}
        justCreated={(await searchParams).creado === "1"}
      />
    </>
  );
}
