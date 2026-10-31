import { formatPrice } from "@/lib/format";

const swatches = [
  { name: "Powder blue", className: "bg-powder" },
  { name: "Dusty blue", className: "bg-dusty" },
  { name: "Steel blue", className: "bg-steel" },
  { name: "Navy", className: "bg-navy" },
  { name: "Ivory", className: "bg-ivory border border-border" },
];

// Placeholder de fase 0: verifica tema, fuentes y formato de moneda.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">En construcción</p>
      <h1 className="mt-3 font-serif text-5xl font-medium sm:text-6xl">Tienda</h1>
      <p className="mt-4 max-w-prose text-muted">
        Joyería, peluches, pines, llaveros, phone charms y legos. Desde {formatPrice(150)}.
      </p>

      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {swatches.map((s) => (
          <li key={s.name}>
            <div className={`aspect-square rounded-2xl ${s.className}`} />
            <p className="mt-2 text-sm text-muted">{s.name}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
