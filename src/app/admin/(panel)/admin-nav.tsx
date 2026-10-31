"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/categorias", label: "Categorías" },
];

export function AdminNav({
  email,
  signOutAction,
}: {
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-ivory/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <nav aria-label="Admin" className="-mx-1 flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {links.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                  active ? "bg-navy text-ivory" : "text-muted hover:bg-powder/70 hover:text-navy"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={signOutAction} className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-muted md:block">{email}</span>
          <button
            className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-powder/70 hover:text-navy"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="size-[18px]" />
          </button>
        </form>
      </div>
    </header>
  );
}
