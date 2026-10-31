import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Tienda",
    template: "%s · Tienda",
  },
  description: "Joyería, peluches, pines, llaveros, phone charms y legos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-HN" className={`${dmSans.variable} ${cormorant.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
