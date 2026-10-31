import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { CartToast } from "@/components/cart-toast";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-5 focus:py-3 focus:text-sm focus:text-ivory"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {/* espacio para que la barra inferior no tape el footer en móvil */}
      <div className="h-[var(--mobile-nav-h)] md:hidden" aria-hidden />
      <MobileNav />
      <CartToast />
    </>
  );
}
