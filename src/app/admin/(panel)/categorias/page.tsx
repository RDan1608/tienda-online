import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { CategoryForm, CategoryRow } from "./category-forms";
import { TagCreate, TagRow } from "./tag-manager";
import { NoticeToast } from "./notice";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: products }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase.from("products").select("category_id, tags"),
    supabase.from("tags").select("name").order("name"),
  ]);

  const counts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
    for (const t of p.tags as string[]) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Categorías</h1>
      <p className="mt-1 text-sm text-muted">El número define el orden en que aparecen en la tienda.</p>

      <ul className="mt-6 divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
        {(categories ?? []).map((c) => (
          <CategoryRow key={c.id} category={c} productCount={counts.get(c.id) ?? 0} />
        ))}
      </ul>

      <h2 className="mb-3 mt-8 font-display text-xl font-bold tracking-[-0.025em]">Nueva categoría</h2>
      <CategoryForm />

      {/* Etiquetas: las que defines aquí se eligen al crear productos y son las que la gente usa para buscar y filtrar */}
      <section aria-labelledby="etiquetas" className="mt-14">
        <h2 id="etiquetas" className="font-display text-2xl font-semibold tracking-[-0.025em]">
          Etiquetas
        </h2>
        <p className="mt-1 text-sm text-muted">
          Palabras para describir tus productos (estilo, color, ocasión). Las eliges al crear un producto y los clientes
          las usan como filtro y al buscar.
        </p>

        <div className="mt-5">
          <TagCreate />
        </div>

        {(tags ?? []).length === 0 ? (
          <p className="mt-5 rounded-3xl bg-powder/50 px-6 py-10 text-center text-muted">
            Aún no hay etiquetas. Crea la primera arriba.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
            {(tags ?? []).map((t) => (
              <TagRow key={t.name} name={t.name} count={tagCounts.get(t.name) ?? 0} />
            ))}
          </ul>
        )}
      </section>
      <NoticeToast />
    </>
  );
}
