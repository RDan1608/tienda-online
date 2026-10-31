import Link from "next/link";
import { ArrowRight, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { site } from "@/lib/site";
import { getCatalogItems, getCategories } from "@/lib/data/catalog";
import { CategoryArt, categoryTone } from "@/components/illustrations";
import { ProductCard, ProductGrid } from "@/components/product-card";

// Composición de la portada: cada tarjeta lleva la ilustración de una categoría.
const heroCards = [
  { slug: "peluches", cls: "right-[2%] top-0 w-[46%] rotate-[5deg]" },
  { slug: "joyeria", cls: "left-[1%] top-[9%] w-[38%] -rotate-[6deg]" },
  { slug: "pines", cls: "left-[35%] bottom-0 w-[30%] rotate-[3deg]" },
  { slug: "legos", cls: "right-[3%] bottom-[2%] w-[30%] -rotate-[4deg]" },
  { slug: "phone-charms", cls: "left-0 bottom-[3%] w-[26%] rotate-[8deg]" },
] as const;

const steps = [
  { icon: ShoppingBag, title: "Elige", text: "Agrega a tu pedido lo que más te guste." },
  { icon: Send, title: "Envía tu pedido", text: "Déjanos tu nombre y teléfono. No se cobra nada ahora." },
  { icon: MessageCircle, title: "Coordinamos", text: "Te contactamos para acordar el pago y la entrega." },
];

function SectionHeader({ title, href, label = "Ver todo" }: { title: string; href: string; label?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-[1.65rem] font-bold leading-tight tracking-[-0.03em]">{title}</h2>
      <Link
        href={href}
        className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted transition-colors hover:text-navy active:bg-powder/60"
      >
        {label}
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

  return (
    <>
      {/* ── 1. Marca: lo primero que se ve ───────────────────────────── */}
      <section className="relative isolate overflow-hidden px-4 pb-12 pt-7 sm:px-6 sm:pt-16">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-powder via-powder/55 to-ivory" />
        <div aria-hidden className="pointer-events-none absolute -right-20 top-24 -z-10 size-72 rounded-full bg-blush/80 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 top-[26rem] -z-10 size-72 rounded-full bg-butter/90 blur-3xl" />

        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="md:py-10">
            <p className="card-in text-[11px] font-semibold uppercase tracking-[0.14em] text-muted" style={{ "--i": 0 } as React.CSSProperties}>
              {site.description}
            </p>
            <h1
              className="card-in mt-3 font-display text-[clamp(3.4rem,17vw,6.75rem)] font-extrabold leading-[0.92] tracking-[-0.05em]"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {site.name}
            </h1>
            <p
              className="card-in mt-4 max-w-[19rem] text-[1.0625rem] leading-relaxed text-muted sm:max-w-sm sm:text-lg"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              {site.tagline}
            </p>
            <div className="card-in mt-7 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ "--i": 3 } as React.CSSProperties}>
              <Link
                href="/catalogo"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-navy px-8 text-[15px] font-semibold text-ivory shadow-soft transition duration-150 hover:bg-navy-deep active:scale-[0.98]"
              >
                Ver catálogo <ArrowRight className="size-[18px]" />
              </Link>
              <Link
                href="#como-pedir"
                className="inline-flex h-12 items-center justify-center rounded-full px-5 text-[15px] font-semibold underline-offset-4 transition-colors hover:underline active:bg-powder/60"
              >
                Cómo pedir
              </Link>
            </div>
          </div>

          {/* Composición de ilustraciones (sin fotos todavía): da carácter sin recargar */}
          <div className="relative mx-auto aspect-[6/5] w-full max-w-md md:max-w-none" aria-hidden>
            {heroCards.map((c, i) => (
              <div
                key={c.slug}
                className={`card-in absolute grid aspect-square place-items-center rounded-[28%] shadow-soft ${c.cls}`}
                style={{ backgroundColor: categoryTone[c.slug], "--i": i + 3 } as React.CSSProperties}
              >
                <CategoryArt slug={c.slug} className="w-[74%]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Categorías ────────────────────────────────────────────── */}
      <section aria-labelledby="categorias" className="mx-auto mt-2 max-w-6xl px-4 sm:px-6">
        <h2 id="categorias" className="mb-5 font-display text-[1.65rem] font-bold leading-tight tracking-[-0.03em]">
          Elige por categoría
        </h2>
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-6">
          {categories.map((c, i) => (
            <li key={c.id} className="card-in" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/catalogo?cat=${c.slug}`}
                className="group relative block aspect-square overflow-hidden rounded-[22px] transition-transform duration-200 ease-out active:scale-[0.96]"
                style={{ backgroundColor: categoryTone[c.slug] ?? "#dce7f0" }}
              >
                <CategoryArt
                  slug={c.slug}
                  className="absolute left-1/2 top-[44%] w-[66%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out group-hover:scale-110"
                />
                <span className="absolute inset-x-1 bottom-2 text-center text-[12.5px] font-bold leading-tight sm:text-sm">
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 3. Más vendidos: carrusel horizontal ─────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="mt-12" aria-label="Más vendidos">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader title="Más vendidos" href="/catalogo?sort=popular" />
          </div>
          <div className="mx-auto max-w-6xl">
            <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:px-6">
              {bestSellers.map((p, i) => (
                <li key={p.id} className="w-[46vw] max-w-[230px] shrink-0 snap-start">
                  <ProductCard product={p} priority={i < 2} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 4. Cómo pedir ────────────────────────────────────────────── */}
      <section
        id="como-pedir"
        aria-labelledby="como"
        className="mx-2 mt-12 scroll-mt-20 rounded-[28px] bg-butter px-5 py-9 sm:mx-auto sm:max-w-6xl sm:px-10 sm:py-12"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-honey-ink">Cómo pedir</p>
        <h2 id="como" className="mt-2 font-display text-[1.65rem] font-bold leading-tight tracking-[-0.03em]">
          Tres pasos, sin complicaciones
        </h2>
        <ol className="mt-7 grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex items-start gap-4 sm:flex-col">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-ivory shadow-soft">
                <Icon className="size-5" strokeWidth={1.9} />
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-honey text-[11px] font-bold">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-navy/80">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 5. Novedades ─────────────────────────────────────────────── */}
      {fresh.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6" aria-label="Novedades">
          <SectionHeader title="Novedades" href="/catalogo?sort=nuevo" />
          <ProductGrid products={fresh} />
        </section>
      )}

      {/* ── 6. Regalos desde L X (precio real más bajo del catálogo) ──── */}
      {floor !== null && (
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
          <Link
            href="/catalogo?sort=precio-asc"
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-[28px] bg-navy px-6 py-8 text-ivory transition-transform duration-200 active:scale-[0.985] sm:px-10"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ivory/70">Detalles para regalar</p>
              <p className="mt-2 font-display text-[2.1rem] font-extrabold leading-none tracking-[-0.04em] sm:text-5xl">
                Desde L {floor.toLocaleString("es-HN")}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                Ver los más económicos
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </div>
            <CategoryArt slug={null} className="w-24 shrink-0 -rotate-6 sm:w-36" />
          </Link>
        </section>
      )}
    </>
  );
}
