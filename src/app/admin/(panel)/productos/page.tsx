import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { ProductList, type ProductRow } from "./product-list";

export const metadata: Metadata = { title: "Productos" };

type Row = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  is_featured: boolean;
  sold_count: number;
  category: { name: string; slug: string } | null;
  images: { path: string; sort_order: number }[];
};

const views = ["todos", "activos", "ocultos", "sinfoto"] as const;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  const { supabase } = await requireAdmin();
  const ver = (await searchParams).ver;
  const [{ data }, { data: cats }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, price, is_active, is_featured, sold_count, category:categories(name, slug), images:product_images(path, sort_order)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("slug, name").order("sort_order"),
  ]);

  const products: ProductRow[] = ((data ?? []) as unknown as Row[]).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    is_active: p.is_active,
    is_featured: p.is_featured,
    sold_count: p.sold_count,
    category: p.category,
    cover: [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0]?.path ?? null,
  }));
  const initialView = views.find((v) => v === ver) ?? "todos";

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-ivory transition active:scale-[0.97]"
        >
          <Plus className="size-4" /> Nuevo
        </Link>
      </div>
      <ProductList products={products} categories={(cats ?? []) as { slug: string; name: string }[]} initialView={initialView} />
    </>
  );
}
