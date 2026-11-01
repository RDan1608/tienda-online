import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { site } from "@/lib/site";
import { storageUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { getCatalogItems, getCategories } from "@/lib/data/catalog";
import { CategoryArt, categoryTone } from "@/components/illustrations";
import { ProductCard, ProductGrid } from "@/components/product-card";

const steps = [
  { icon: ShoppingBag, label: "Elige", text: "Arma tu pedido con lo que te guste." },
  { icon: Send, label: "Envía tu pedido", text: "Sin pagar en línea: solo dejas tus datos." },
  { icon: MessageCircle, label: "Coordinamos", text: "Te escribimos para confirmar, y te avisamos cada etapa." },
];

const pad = "px-4 sm:px-6 lg:px-10";

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 lg:mb-6">
      <h2 className="font-display text-xl font-bold tracking-[-0.03em] sm:text-2xl lg:text-3xl">{title}</h2>
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

  // Composición de la portada (escritorio): tres productos, de preferencia con foto.
  const hero = [...items.filter((p) => p.images[0]), ...items.filter((p) => !p.images[0])].slice(0, 3);
  const heroPlace = [
    "right-0 top-0 w-64 rotate-3 [animation-delay:0s]",
    "left-0 top-20 w-52 -rotate-3 [animation-delay:-2.5s]",
    "bottom-0 left-52 w-40 rotate-[5deg] [animation-delay:-5s]",
  ];

  return (
    <>
      {/* ── Marca: un mensaje, una acción (en escritorio, con una composición de productos al lado) ── */}
      <section className="relative isolate">
        <div aria-hidden className="blob -right-16 -top-10 -z-10 size-64 bg-dusty/60 sm:size-96 lg:size-[34rem]" />
        <div aria-hidden className="blob -left-20 top-40 -z-10 size-56 bg-blush sm:size-80 [animation-delay:-5s]" />
        <div aria-hidden className="blob right-10 top-72 -z-10 size-44 bg-butter [animation-delay:-9s]" />

        <div className={`mx-auto grid max-w-7xl items-center gap-10 ${pad} pb-8 pt-8 sm:pb-12 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-16`}>
          <div>
            <h1
              className="card-in max-w-[14ch] font-display text-[2.4rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-balance sm:max-w-[18ch] sm:text-6xl lg:text-7xl"
              style={{ "--i": 0 } as React.CSSProperties}
            >
              Detalles{" "}
              <span className="bg-gradient-to-t from-honey/70 to-transparent bg-[length:100%_0.34em] bg-bottom bg-no-repeat">bonitos</span>{" "}
              para regalar y regalarte
            </h1>
            <p className="card-in mt-3 text-base text-muted lg:mt-5 lg:text-xl" style={{ "--i": 1 } as React.CSSProperties}>
              {site.blurb}
            </p>
            <div className="card-in mt-6 flex flex-col gap-3 sm:flex-row lg:mt-9" style={{ "--i": 2 } as React.CSSProperties}>
              <Link
                href="/catalogo"
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-navy-lift to-navy px-8 text-[15px] font-semibold text-ivory shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98] sm:w-auto lg:h-16 lg:px-10 lg:text-base"
              >
                Ver catálogo <ArrowRight className="size-[18px] transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#como-pedir"
                className="hidden h-16 items-center justify-center rounded-full border border-border px-8 text-base font-semibold transition duration-200 hover:border-steel hover:bg-powder/50 active:scale-[0.98] lg:inline-flex"
              >
                Cómo pedir
              </Link>
            </div>
          </div>

          {/* Escritorio: tres productos flotando, cada uno lleva a su ficha */}
          {hero.length > 0 && (
            <div className="card-in relative hidden h-[28rem] lg:block" style={{ "--i": 3 } as React.CSSProperties} aria-label="Productos destacados">
              {hero.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  className={`float group absolute block ${heroPlace[i]}`}
                >
                  <span
                    className="relative block aspect-[4/5] overflow-hidden rounded-[28px] shadow-float ring-1 ring-border transition-transform duration-500 ease-out group-hover:scale-105"
                    style={{ backgroundColor: categoryTone[p.category?.slug ?? ""] ?? "#dce7f0" }}
                  >
                    {p.images[0] ? (
                      <Image src={storageUrl(p.images[0].path)} alt="" fill sizes="280px" priority={i === 0} className="object-cover" />
                    ) : (
                      <CategoryArt fixed slug={p.category?.slug ?? null} className="absolute left-1/2 top-1/2 w-3/5 -translate-x-1/2 -translate-y-1/2" />
                    )}
                    <span className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 rounded-2xl bg-ivory/90 px-3 py-2 text-left backdrop-blur">
                      <span className="line-clamp-1 text-[13px] font-semibold">{p.name}</span>
                      <span className="shrink-0 text-[13px] font-extrabold tabular-nums">{formatPrice(p.price)}</span>
                    </span>
                  </span>
                </Link>
              ))}
              <span className="float absolute left-10 top-4 hidden size-14 place-items-center rounded-full bg-blush shadow-soft xl:grid [animation-delay:-1.5s]">
                <Heart className="size-6 fill-rose text-rose" />
              </span>
              <span className="float absolute bottom-10 left-4 hidden rounded-full bg-honey px-4 py-2 text-sm font-bold text-[#243447] shadow-soft xl:block [animation-delay:-4s]">
                Más vendidos
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Categorías ─────────────────────────────────────────────── */}
      <section aria-labelledby="categorias" className={`mx-auto max-w-7xl ${pad}`}>
        <h2 id="categorias" className="sr-only">
          Categorías
        </h2>
        <ul className="grid grid-cols-3 gap-2.5 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          {categories.map((c, i) => {
            const photo = cover(c.slug);
            return (
              <li key={c.id} className="card-in" style={{ "--i": i + 2 } as React.CSSProperties}>
                <Link
                  href={`/catalogo?cat=${c.slug}`}
                  className="group relative block aspect-square overflow-hidden rounded-[22px] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-float active:scale-[0.96] lg:rounded-[28px]"
                  style={{ backgroundColor: categoryTone[c.slug] ?? "#dce7f0" }}
                >
                  {photo ? (
                    <Image
                      src={storageUrl(photo.path)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 15vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <CategoryArt
                      fixed
                      slug={c.slug}
                      className="absolute left-1/2 top-[42%] w-[62%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3"
                    />
                  )}
                  <span
                    className={`absolute inset-x-1.5 bottom-1.5 truncate rounded-full px-2 py-1 text-center text-[12px] font-bold leading-tight text-[#364d66] lg:bottom-2.5 lg:py-1.5 lg:text-sm ${
                      photo ? "bg-[#f7f6f2]/90 backdrop-blur" : ""
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

      {/* ── Más vendidos: carrusel en móvil, cuadrícula en escritorio ── */}
      {bestSellers.length > 0 && (
        <section className="reveal mt-10 lg:mt-16" aria-label="Más vendidos">
          <div className={`mx-auto max-w-7xl ${pad}`}>
            <SectionHeader title="Más vendidos" href="/catalogo?sort=popular" />
          </div>
          <div className="mx-auto max-w-7xl">
            <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-10 xl:grid-cols-5">
              {bestSellers.map((p, i) => (
                <li
                  key={p.id}
                  className={`w-[44vw] max-w-[220px] shrink-0 snap-start lg:w-auto lg:max-w-none ${i === 4 ? "lg:max-xl:hidden" : ""} ${i >= 5 ? "xl:hidden" : ""}`}
                >
                  <ProductCard product={p} priority={i < 2} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Cómo pedir ───────────────────────────────────────────────── */}
      <section
        id="como-pedir"
        aria-label="Cómo pedir"
        className="reveal mx-4 mt-10 scroll-mt-24 rounded-[24px] bg-butter px-4 py-5 sm:mx-6 lg:mx-auto lg:mt-16 lg:max-w-7xl lg:rounded-[36px] lg:px-14 lg:py-12 xl:mx-auto"
      >
        <ol className="grid grid-cols-3 gap-2 text-center lg:gap-10 lg:text-left">
          {steps.map(({ icon: Icon, label, text }, i) => (
            <li key={label} className="flex flex-col items-center gap-2 lg:flex-row lg:items-start lg:gap-5">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-ivory shadow-soft lg:size-16 lg:rounded-3xl">
                <Icon className="size-5 lg:size-7" strokeWidth={1.9} />
                <span className="absolute -right-1.5 -top-1.5 grid size-[18px] place-items-center rounded-full bg-honey text-[10px] font-bold text-[#243447] lg:size-6 lg:text-xs">
                  {i + 1}
                </span>
              </span>
              <div>
                <span className="text-[13px] font-bold leading-tight lg:text-lg">{label}</span>
                <p className="mt-1 hidden text-[15px] leading-relaxed text-honey-ink lg:block">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-xs text-honey-ink lg:hidden">Sin pago en línea · te contactamos para coordinar</p>
      </section>

      {/* ── Novedades ──────────────────────────────────────────────── */}
      {fresh.length > 0 && (
        <section className={`reveal mx-auto mt-10 max-w-7xl lg:mt-16 ${pad}`} aria-label="Novedades">
          <SectionHeader title="Novedades" href="/catalogo?sort=nuevo" />
          <ProductGrid products={fresh} />
        </section>
      )}

      {/* ── Precio de entrada (dato real del catálogo) ──────────────── */}
      {floor !== null && (
        <section className={`reveal mx-auto mt-10 max-w-7xl lg:mt-16 ${pad}`}>
          <Link
            href="/catalogo?sort=precio-asc"
            className="group flex items-center justify-between gap-4 overflow-hidden rounded-[24px] bg-navy px-6 py-6 text-ivory transition-transform duration-200 active:scale-[0.985] lg:rounded-[36px] lg:px-14 lg:py-12"
          >
            <div>
              <p className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.04em] sm:text-4xl lg:text-6xl">
                Desde L {floor.toLocaleString("es-HN")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ivory/85 lg:mt-5 lg:text-lg">
                Ver los más económicos
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 lg:size-5" />
              </span>
            </div>
            <CategoryArt fixed slug={null} className="w-20 shrink-0 -rotate-6 transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110 sm:w-28 lg:w-44" />
          </Link>
        </section>
      )}
    </>
  );
}
