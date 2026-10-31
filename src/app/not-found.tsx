import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">Error 404</p>
      <h1 className="mt-3 font-serif text-4xl font-medium">No encontramos esta página</h1>
      <p className="mt-3 text-muted">Puede que el producto ya no esté disponible.</p>
      <Link
        href="/catalogo"
        className="mt-8 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-medium text-ivory"
      >
        Ver catálogo
      </Link>
    </main>
  );
}
