import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { site } from "@/lib/site";
import { storageUrl } from "@/lib/env";
import { getCatalogItems, getCategories } from "@/lib/data/catalog";
import { CategoryArt, categoryTone } from "@/components/illustrations";
import { ProductCard, ProductGrid } from "@/components/product-card";

const steps = [
  { icon: ShoppingBag, label: "Elige" },
  { icon: Send, label: "Envía tu pedido" },
  { icon: MessageCircle, label: "Coordinamos" },
];

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="font-display text-xl font-bold tracking-[-0.03em] sm:text-2xl">{title}</h2>
      <Link
        href={href}
        className="group inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-semibold text-muted transition-colors hover:text-navy active:bg-powder/60"
      >
        Ver todo
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export default async function Home() {
  const [items, categories] = await Promise.all([getCatalogItems(), getCategories()]);

  const bestSellers = [...items]
    .sort((a, b) => b.sold_count - a.sold_count || Number(b.is_featured) - Number(a.is_featured))
    .slice(0, 8);
  const fresh = items.slice(0, 4); // ya vienen de más nuevo a más viejo
  const floor = items.length ? Math.floor(Math.min(...items.map((p) => p.price)) / 10) * 10 : null;

  // Cada categoría muestra la foto real de su producto más pedido; sin foto, su ilustración.
  const cover = (slug: string) => bestSellers.concat(items).find((p) => p.category?.slug === slug && p.images[0])?.images[0];

  return (
    <>
      {/* ── Marca: un mensaje, una acción ─────────────────────────── */}
      <section className="px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <h1
            className="card-in max-w-[14ch] font-display text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-balance sm:max-w-[18ch] sm:text-6xl"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            Detalles{" "}
            <span className="bg-gradient-to-t from-honey/70 to-transparent bg-[length:100%_0.34em] bg-bottom bg-no-repeat">bonitos</span>{" "}
            para regalar y regalarte
          </h1>
          <p className="card-in mt-3 text-base text-muted" style={{ "--i": 1 } as React.CSSProperties}>
            {site.blurb}
          </p>
          <div className="card-in mt-6" style={{ "--i": 2 } as React.CSSProperties}>
            <Link
              href="/catalogo"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-navy px-8 text-[15px] font-semibold text-ivory shadow-soft transition duration-150 hover:bg-navy-deep active:scale-[0.98] sm:w-auto"
            >
              Ver catálogo <ArrowRight className="size-[18px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categorías ─────────────────────────────────────────────── */}
      <section aria-labelledby="categorias" className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="categorias" className="sr-only">
          Categorías
        </h2>
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-6">
          {categories.map((c, i) => {
            const photo = cover(c.slug);
            return (
              <li key={c.id} className="card-in" style={{ "--i": i + 2 } as React.CSSProperties}>
                <Link
                  href={`/catalogo?cat=${c.slug}`}
                  className="group relative block aspect-square overflow-hidden rounded-[22px] transition-transform duration-200 ease-out active:scale-[0.96]"
                  style={{ backgroundColor: categoryTone[c.slug] ?? "#dce7f0" }}
                >
                  {photo ? (
                    <Image
                      src={storageUrl(photo.path)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 15vw, 33vw"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <CategoryArt
                      slug={c.slug}
                      className="absolute left-1/2 top-[42%] w-[62%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out group-hover:scale-110"
                    />
                  )}
                  <span
                    className={`absolute inset-x-1.5 bottom-1.5 truncate rounded-full px-2 py-1 text-center text-[12px] font-bold leading-tight ${
                      photo ? "bg-ivory/90 backdrop-blur" : ""
                    }`}
                  >
                    {c.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Más vendidos ───────────────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="mt-10" aria-label="Más vendidos">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader title="Más vendidos" href="/catalogo?sort=popular" />
          </div>
          <div className="mx-auto max-w-6xl">
            <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:px-6">
              {bestSellers.map((p, i) => (
                <li key={p.id} className="w-[44vw] max-w-[220px] shrink-0 snap-start">
                  <ProductCard product={p} priority={i < 2} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Cómo pedir: tres íconos, sin párrafos ───────────────────── */}
      <section id="como-pedir" aria-label="Cómo pedir" className="mx-4 mt-10 scroll-mt-20 rounded-[24px] bg-butter px-4 py-5 sm:mx-auto sm:max-w-6xl">
        <ol className="grid grid-cols-3 gap-2 text-center">
          {steps.map(({ icon: Icon, label }, i) => (
            <li key={label} className="flex flex-col items-center gap-2">
              <span className="relative grid size-11 place-items-center rounded-2xl bg-ivory shadow-soft">
                <Icon className="size-5" strokeWidth={1.9} />
                <span className="absolute -right-1.5 -top-1.5 grid size-[18px] place-items-center rounded-full bg-honey text-[10px] font-bold">
                  {i + 1}
                </span>
              </span>
              <span className="text-[13px] font-bold leading-tight">{label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-honey-ink">Sin pago en línea · te contactamos para coordinar</p>
      </section>

      {/* ── Novedades ──────────────────────────────────────────────── */}
      {fresh.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6" aria-label="Novedades">
          <SectionHeader title="Novedades" href="/catalogo?sort=nuevo" />
          <ProductGrid products={fresh} />
        </section>
      )}

      {/* ── Precio de entrada (dato real del catálogo) ──────────────── */}
      {floor !== null && (
        <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
          <Link
            href="/catalogo?sort=precio-asc"
            className="group flex items-center justify-between gap-4 overflow-hidden rounded-[24px] bg-navy px-6 py-6 text-ivory transition-transform duration-200 active:scale-[0.985]"
          >
            <div>
              <p className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.04em] sm:text-4xl">
                Desde L {floor.toLocaleString("es-HN")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ivory/85">
                Ver los más económicos
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
            <CategoryArt slug={null} className="w-20 shrink-0 -rotate-6 sm:w-28" />
          </Link>
        </section>
      )}
    </>
  );
}
