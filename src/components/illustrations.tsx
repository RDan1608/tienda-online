import type { SVGProps } from "react";

/**
 * Ilustraciones lineales por categoría, con la paleta de la marca. Sustituyen al degradado
 * vacío mientras un producto no tiene foto, y luego conviven con las fotos reales.
 * Son SVG en línea (<2 KB cada una): no son imágenes externas y no afectan al LCP.
 */

const N = "var(--navy)";
const stroke = { fill: "none", stroke: N, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function star(cx: number, cy: number, ro: number, ri: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? ro : ri;
    const a = (-90 + i * 36) * (Math.PI / 180);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/** Fondo suave propio de cada categoría (la base también sirve de fondo para las fotos). */
export const categoryTone: Record<string, string> = {
  joyeria: "#dce7f0",
  peluches: "#fbe4e8",
  pines: "#e6edf5",
  llaveros: "#fcefd6",
  "phone-charms": "#e9e5f3",
  legos: "#e3eee7",
};
export const defaultTone = "#dce7f0";

function Ring() {
  return (
    <>
      <circle cx="60" cy="76" r="22" {...stroke} strokeWidth={8} stroke="var(--dusty)" />
      <circle cx="60" cy="76" r="26" {...stroke} />
      <circle cx="60" cy="76" r="18" {...stroke} />
      <path d="M47 22h26l10 12-23 18-23-18z" {...stroke} fill="#fff" />
      <path d="M37 34h46M47 22l6 12 7 18M73 22l-6 12-7 18" {...stroke} strokeWidth={1.5} />
      <path d="M95 18v12M89 24h12M24 60v10M19 65h10" {...stroke} stroke="var(--steel)" strokeWidth={1.8} />
    </>
  );
}

function Bear() {
  return (
    <>
      <circle cx="38" cy="38" r="12" {...stroke} fill="#fff" />
      <circle cx="82" cy="38" r="12" {...stroke} fill="#fff" />
      <circle cx="38" cy="38" r="5.5" fill="var(--dusty)" />
      <circle cx="82" cy="38" r="5.5" fill="var(--dusty)" />
      <circle cx="60" cy="66" r="33" {...stroke} fill="#fff" />
      <ellipse cx="60" cy="78" rx="15" ry="11" {...stroke} fill="var(--butter)" />
      <circle cx="48" cy="60" r="2.8" fill={N} />
      <circle cx="72" cy="60" r="2.8" fill={N} />
      <ellipse cx="60" cy="72" rx="4.5" ry="3.2" fill={N} />
      <path d="M60 75v5M54 81q6 5 12 0" {...stroke} strokeWidth={1.8} />
      <ellipse cx="41" cy="72" rx="5.5" ry="4" fill="var(--rose)" opacity=".28" />
      <ellipse cx="79" cy="72" rx="5.5" ry="4" fill="var(--rose)" opacity=".28" />
    </>
  );
}

function Pin() {
  return (
    <>
      <rect x="50" y="86" width="20" height="14" rx="5" {...stroke} fill="#fff" />
      <circle cx="60" cy="54" r="32" {...stroke} fill="var(--dusty)" />
      <circle cx="60" cy="54" r="24" {...stroke} fill="#fff" strokeWidth={1.6} strokeDasharray="1 5" />
      <polygon points={star(60, 54, 15, 6.5)} {...stroke} fill="var(--honey)" />
    </>
  );
}

function Keychain() {
  return (
    <>
      <circle cx="60" cy="24" r="14" {...stroke} />
      <ellipse cx="60" cy="47" rx="4" ry="6" {...stroke} />
      <ellipse cx="60" cy="58" rx="4" ry="6" {...stroke} />
      <rect x="38" y="66" width="44" height="44" rx="13" {...stroke} fill="#fff" />
      <polygon points={star(60, 88, 13, 5.5)} {...stroke} fill="var(--honey)" strokeWidth={1.6} />
    </>
  );
}

function PhoneCharm() {
  return (
    <>
      <rect x="30" y="14" width="46" height="90" rx="11" {...stroke} fill="#fff" />
      <rect x="45" y="21" width="16" height="4.5" rx="2.25" fill="var(--dusty)" />
      <path d="M76 38c20 0 20 18 14 28" {...stroke} stroke="var(--steel)" />
      <circle cx="89" cy="72" r="4.2" {...stroke} fill="var(--powder)" strokeWidth={1.6} />
      <circle cx="87" cy="82" r="4.2" {...stroke} fill="#fff" strokeWidth={1.6} />
      <path d="M87 106c-9-6-13-10-13-15a6.5 6.5 0 0 1 13-2.5 6.5 6.5 0 0 1 13 2.5c0 5-4 9-13 15z" {...stroke} fill="var(--rose)" />
    </>
  );
}

function Brick() {
  return (
    <>
      <rect x="22" y="56" width="76" height="42" rx="7" {...stroke} fill="var(--honey)" />
      <rect x="30" y="44" width="17" height="12" rx="3.5" {...stroke} fill="var(--honey)" />
      <rect x="51.5" y="44" width="17" height="12" rx="3.5" {...stroke} fill="var(--honey)" />
      <rect x="73" y="44" width="17" height="12" rx="3.5" {...stroke} fill="var(--honey)" />
      <path d="M30 68h60" {...stroke} stroke="#fff" opacity=".6" strokeWidth={2.2} />
      <path d="M96 24v12M90 30h12" {...stroke} stroke="var(--steel)" strokeWidth={1.8} />
    </>
  );
}

function Gift() {
  return (
    <>
      <rect x="26" y="52" width="68" height="46" rx="8" {...stroke} fill="#fff" />
      <rect x="22" y="40" width="76" height="16" rx="6" {...stroke} fill="var(--dusty)" />
      <path d="M60 40v58" {...stroke} />
      <path d="M60 40c-8-20-26-14-20-6 4 5 14 6 20 6zM60 40c8-20 26-14 20-6-4 5-14 6-20 6z" {...stroke} fill="var(--blush)" />
    </>
  );
}

function Heart() {
  return (
    <>
      <path d="M60 98C34 80 22 66 22 50a19 19 0 0 1 38-6 19 19 0 0 1 38 6c0 16-12 30-38 48z" {...stroke} fill="var(--rose)" />
      <path d="M36 44a10 10 0 0 1 9-9" {...stroke} stroke="#fff" strokeWidth={3} opacity=".8" />
      <path d="M96 22v12M90 28h12M22 82v10M17 87h10" {...stroke} stroke="var(--steel)" strokeWidth={1.8} />
    </>
  );
}

function Bag() {
  return (
    <>
      <path d="M32 44h56l6 54H26z" {...stroke} fill="#fff" />
      <path d="M46 44V36a14 14 0 0 1 28 0v8" {...stroke} />
      <circle cx="46" cy="58" r="2.4" fill={N} />
      <circle cx="74" cy="58" r="2.4" fill={N} />
      <path d="M52 78c2 5 14 5 16 0" {...stroke} stroke="var(--rose)" strokeWidth={2.4} />
      <path d="M98 26v12M92 32h12" {...stroke} stroke="var(--steel)" strokeWidth={1.8} />
    </>
  );
}

const arts: Record<string, () => React.ReactElement> = {
  corazon: Heart,
  pedido: Bag,
  joyeria: Ring,
  peluches: Bear,
  pines: Pin,
  llaveros: Keychain,
  "phone-charms": PhoneCharm,
  legos: Brick,
};

/** Colores de la paleta clara, fijos: para dibujar sobre fondos pastel que no cambian con el modo oscuro. */
const fixedPalette = {
  "--navy": "#364d66",
  "--dusty": "#a9c1d6",
  "--steel": "#6f8fac",
  "--powder": "#dce7f0",
  "--butter": "#fcefd6",
  "--rose": "#d94a64",
  "--honey": "#f2c14e",
} as React.CSSProperties;

/**
 * Ilustración de una categoría (o un regalo si no hay una específica).
 * `fixed`: usa siempre la paleta clara (sobre fondos pastel); sin eso se adapta al modo oscuro.
 */
export function CategoryArt({ slug, fixed, style, ...props }: { slug: string | null; fixed?: boolean } & SVGProps<SVGSVGElement>) {
  const Art = (slug && arts[slug]) || Gift;
  return (
    <svg viewBox="0 0 120 120" aria-hidden focusable="false" style={fixed ? { ...fixedPalette, ...style } : style} {...props}>
      <Art />
    </svg>
  );
}
