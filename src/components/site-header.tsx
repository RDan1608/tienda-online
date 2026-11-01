import Link from "next/link";
import { site } from "@/lib/site";
import { HeaderActions } from "@/components/header-actions";
import { HeaderNav } from "@/components/header-nav";

export function SiteHeader() {
  return (
    <header data-site-header className="sticky top-0 z-40 border-b border-border/70 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-[72px] lg:px-10">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-[-0.04em] lg:text-[1.65rem]">
          {site.name}
        </Link>
        <HeaderNav />
        <HeaderActions />
      </div>
    </header>
  );
}
