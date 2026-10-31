import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { CatalogFilters } from "@/lib/catalog-params";
import type { Category, Product } from "@/lib/types";

// Todo lo del catálogo comparte el tag "catalog": el admin lo invalida al editar.
export const CATALOG_TAG = "catalog";
export const PAGE_SIZE = 12;

const PRODUCT_FIELDS =
  "id, name, slug, description, price, tags, is_featured, sold_count, created_at, images:product_images(path, alt, sort_order)";
const SELECT = `${PRODUCT_FIELDS}, category:categories(name, slug)`;
// !inner: permite filtrar por slug de categoría desde la relación.
const SELECT_INNER = `${PRODUCT_FIELDS}, category:categories!inner(name, slug)`;

function normalize(rows: unknown[] | null): Product[] {
  return ((rows ?? []) as Product[]).map((p) => ({
    ...p,
    price: Number(p.price),
    images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

// Quita caracteres con significado en la sintaxis de filtros de PostgREST.
function sanitizeSearch(q: string) {
  return q.replace(/[,()%*\\:"']/g, " ").trim().slice(0, 60);
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getProducts(f: CatalogFilters) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  let query = createPublicClient()
    .from("products")
    .select(f.cat.length ? SELECT_INNER : SELECT, { count: "exact" })
    .eq("is_active", true);

  if (f.cat.length) query = query.in("category.slug", f.cat);
  if (f.tag.length) query = query.overlaps("tags", f.tag);
  if (f.min != null) query = query.gte("price", f.min);
  if (f.max != null) query = query.lte("price", f.max);

  const q = sanitizeSearch(f.q);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  switch (f.sort) {
    case "popular":
      query = query
        .order("sold_count", { ascending: false })
        .order("is_featured", { ascending: false });
      break;
    case "precio-asc":
      query = query.order("price", { ascending: true });
      break;
    case "precio-desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  // "Ver más" acumulativo: la página N muestra los primeros N * PAGE_SIZE.
  const page = Math.min(Math.max(f.page, 1), 20);
  const { data, count, error } = await query
    .order("id")
    .range(0, page * PAGE_SIZE - 1);
  if (error) throw error;

  return { products: normalize(data), total: count ?? 0, page };
}

/** Tags disponibles con su conteo, para los filtros. */
export async function getTagFacets() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select("tags")
    .eq("is_active", true);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data) {
    for (const t of row.tags as string[]) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([tag, count]) => ({ tag, count }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize([data])[0] : null;
}

/** Más vendidos; sin ventas aún, cae a destacados y luego a recientes. */
export async function getBestSellers(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("sold_count", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return normalize(data);
}

export async function getNewArrivals(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return normalize(data);
}

export async function getRelated(product: Pick<Product, "id" | "category">, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  if (!product.category) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT_INNER)
    .eq("is_active", true)
    .eq("category.slug", product.category.slug)
    .neq("id", product.id)
    .order("sold_count", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return normalize(data);
}

/** Slugs a prerenderizar en build (mínimo 1 por requisito de cacheComponents). */
export async function getStaticProductSlugs() {
  const { data } = await createPublicClient()
    .from("products")
    .select("slug")
    .eq("is_active", true)
    .order("sold_count", { ascending: false })
    .limit(24);
  return data?.length ? data.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export async function getSitemapData() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const supabase = createPublicClient();
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("slug").order("sort_order"),
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
  ]);
  if (categories.error) throw categories.error;
  if (products.error) throw products.error;
  return { categories: categories.data, products: products.data };
}
