import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { CategoryForm, CategoryRow } from "./category-forms";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);

  const counts = new Map<string, number>();
  for (const p of products ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  return (
    <>
      <h1 className="font-serif text-4xl font-medium">Categorías</h1>
      <p className="mt-1 text-sm text-muted">El número define el orden en que aparecen en la tienda.</p>

      <ul className="mt-8 divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
        {(categories ?? []).map((c) => (
          <CategoryRow key={c.id} category={c} productCount={counts.get(c.id) ?? 0} />
        ))}
      </ul>

      <h2 className="mb-3 mt-10 font-serif text-2xl font-medium">Nueva categoría</h2>
      <CategoryForm />
    </>
  );
}
