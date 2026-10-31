import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen por defecto al compartir el sitio (los productos usan su propia foto).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "linear-gradient(135deg, #f7f6f2 0%, #dce7f0 100%)",
          color: "#364d66",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#6f8fac" }}>
          {site.description}
        </div>
        <div style={{ fontSize: 112, fontWeight: 600, marginTop: 24, lineHeight: 1.05 }}>{site.name}</div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#5d7186" }}>{site.tagline}</div>
      </div>
    ),
    size,
  );
}
