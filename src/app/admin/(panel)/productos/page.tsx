import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Plus, Star } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { storageUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";
import { toggleActive } from "./actions";

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

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, price, is_active, is_featured, sold_count, category:categories(name, slug), images:product_images(path, sort_order)",
    )
    .order("created_at", { ascending: false });
  const products = (data ?? []) as unknown as Row[];

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-medium">Productos</h1>
          <p className="mt-1 text-sm text-muted">{products.length} en total</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-navy px-5 text-sm font-medium text-ivory transition active:scale-[0.98]"
        >
          <Plus className="size-4" /> <span className="max-sm:sr-only">Nuevo producto</span>
          <span className="sm:hidden" aria-hidden>Nuevo</span>
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 rounded-3xl bg-powder/50 px-6 py-14 text-center text-muted">
          Aún no hay productos. Crea el primero.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-3xl bg-surface ring-1 ring-border">
          {products.map((p) => {
            const cover = [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0];
            return (
              <li key={p.id} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                <Link href={`/admin/productos/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-powder">
                    {cover ? (
                      <Image src={storageUrl(cover.path)} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="grid size-full place-items-center">
                        <CategoryIcon slug={p.category?.slug ?? null} className="size-6 text-steel" strokeWidth={1.25} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate ${p.is_active ? "" : "text-muted line-through"}`}>{p.name}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(p.price)}
                      {p.category && ` · ${p.category.name}`}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      {!p.is_active && <span className="rounded-full bg-powder px-2 py-0.5">Oculto</span>}
                      {p.is_featured && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3 fill-current" /> Destacado
                        </span>
                      )}
                      {p.sold_count > 0 && <span>{p.sold_count} vendidos</span>}
                    </p>
                  </div>
                </Link>
                <form action={toggleActive}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="active" value={String(!p.is_active)} />
                  <button
                    className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-powder/70 hover:text-navy"
                    aria-label={p.is_active ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                    title={p.is_active ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                  >
                    {p.is_active ? <Eye className="size-[18px]" /> : <EyeOff className="size-[18px]" />}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
