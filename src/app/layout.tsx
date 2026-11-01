import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import "./globals.css";

// Una sola familia (moderna, geométrica, redondeada sin ser infantil): menos peso y más coherencia.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "es_HN",
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("tienda-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#0f1722":"#f7f6f2")}}catch(e){}`;

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  // Pantalla completa: así el navegador informa el alto de la barra del sistema (env(safe-area-inset-bottom))
  // y la barra inferior se sube sobre los botones de Android / el indicador del iPhone.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-HN" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Antes del primer pintado: aplica el tema elegido, para que no haya un destello claro al abrir en oscuro. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
