import Link from "next/link";

export function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="mt-8 rounded-3xl bg-powder/50 px-6 py-16 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-ivory text-steel">{icon}</div>
      <p className="mt-4 font-serif text-2xl">{title}</p>
      <p className="mt-2 text-sm text-muted">{text}</p>
      <Link
        href="/catalogo"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-medium text-ivory"
      >
        Explorar catálogo
      </Link>
    </div>
  );
}
