import Link from "next/link";
import { CategoryArt } from "@/components/illustrations";

/** Estado vacío con ilustración propia (no un hueco): invita a seguir explorando. */
export function EmptyState({
  art,
  title,
  text,
  cta = "Explorar catálogo",
  href = "/catalogo",
}: {
  art: string;
  title: string;
  text: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="card-in mt-6 rounded-[28px] bg-powder/50 px-6 py-12 text-center">
      <CategoryArt slug={art} className="mx-auto w-32" />
      <p className="mt-4 font-display text-2xl font-bold tracking-[-0.03em]">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">{text}</p>
      <Link
        href={href}
        className="mt-6 inline-flex h-12 items-center rounded-full bg-navy px-7 text-[15px] font-semibold text-ivory transition active:scale-95"
      >
        {cta}
      </Link>
    </div>
  );
}
