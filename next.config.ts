import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // AVIF primero (más liviano con la misma calidad); 90 para la foto grande del producto.
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          // Sin script-src a propósito (Next y BotID inyectan scripts propios); esto cierra lo demás:
          // que otro sitio la meta en un marco, cambie <base>, cargue plugins o reciba formularios.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// BotID: captcha invisible de Vercel (proxy del desafío en el propio dominio).
export default withBotId(nextConfig);
