export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type ProductImage = {
  path: string;
  alt: string;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  tags: string[];
  is_featured: boolean;
  sold_count: number;
  created_at: string;
  category: { name: string; slug: string } | null;
  images: ProductImage[];
};

/** Lo mínimo para pintar una tarjeta / guardar en carrito o favoritos. */
export type ProductSummary = Pick<Product, "id" | "name" | "slug" | "price"> & {
  imagePath: string | null;
  categorySlug: string | null;
};

export function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    imagePath: p.images[0]?.path ?? null,
    categorySlug: p.category?.slug ?? null,
  };
}
