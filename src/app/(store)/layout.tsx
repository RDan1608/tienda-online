import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* espacio para que la barra inferior no tape el footer en móvil */}
      <div className="h-20 md:hidden" aria-hidden />
      <MobileNav />
    </>
  );
}
