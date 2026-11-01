import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { normalizeText } from "@/lib/search";
import type { CatalogItem, Category, Product } from "@/lib/types";

// Todo lo del catálogo comparte el tag "catalog": el admin lo invalida al editar.
export const CATALOG_TAG = "catalog";

const PRODUCT_FIELDS =
  "id, name, slug, description, price, colors, tags, is_featured, sold_count, created_at, images:product_images(path, alt, sort_order)";
const SELECT = `${PRODUCT_FIELDS}, category:categories(name, slug)`;
// !inner: permite filtrar por slug de categoría desde la relación.
const SELECT_INNER = `${PRODUCT_FIELDS}, category:categories!inner(name, slug)`;

function normalize(rows: unknown[] | null): Product[] {
  return ((rows ?? []) as Product[]).map((p) => ({
    ...p,
    price: Number(p.price),
    colors: p.colors ?? [],
    images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));
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

/**
 * Todos los productos activos, livianos, para filtrar/ordenar/buscar en el navegador sin
 * ir al servidor en cada clic. Para una tienda de cientos de productos pesa pocos KB.
 */
export async function getCatalogItems(): Promise<CatalogItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;

  return normalize(data).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    colors: p.colors ?? [],
    tags: p.tags,
    is_featured: p.is_featured,
    sold_count: p.sold_count,
    created_at: p.created_at,
    category: p.category,
    images: p.images.slice(0, 1),
    // Texto ya normalizado (sin tildes ni mayúsculas) para buscar rápido.
    search: normalizeText(`${p.name} ${p.category?.name ?? ""} ${p.tags.join(" ")} ${p.description.slice(0, 300)}`),
  }));
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
