import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Privado o sin valor para buscadores.
      disallow: ["/admin", "/api/", "/carrito", "/favoritos"],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
