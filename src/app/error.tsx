"use client";

export default function ErrorPage({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-1 flex-col items-center justify-center bg-ivory px-4 py-24 text-center text-navy">
      <h1 className="font-display text-4xl font-semibold tracking-[-0.025em]">Algo salió mal</h1>
      <p className="mt-3 text-muted">No pudimos cargar esta página. Intenta de nuevo en un momento.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-medium text-ivory"
      >
        Reintentar
      </button>
    </main>
  );
}
