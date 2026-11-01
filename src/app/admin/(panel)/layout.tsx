import { Suspense } from "react";
import { getAdmin } from "@/lib/admin";
import { signOut } from "../actions";
import { AdminNav } from "./admin-nav";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ivory" />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  const { supabase, user, isAdmin } = await getAdmin();

  // El proxy ya mandó a /admin/login si no hay sesión; aquí cubrimos usuarios sin rol.
  if (!user || !isAdmin) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ivory px-4 text-center">
        <div className="max-w-sm">
          <p className="font-display tracking-[-0.025em] text-3xl">Sin permisos</p>
          <p className="mt-2 text-sm text-muted">
            Esta cuenta no tiene acceso al panel de administración.
          </p>
          <form action={signOut} className="mt-6">
            <button className="h-11 rounded-full bg-navy px-6 text-sm font-medium text-ivory">
              Cerrar sesión
            </button>
          </form>
        </div>
      </main>
    );
  }

  const { count: newOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "nuevo");

  return (
    <div className="min-h-dvh bg-ivory">
      <AdminNav email={user.email ?? ""} newOrders={newOrders ?? 0} signOutAction={signOut} />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-24">{children}</main>
    </div>
  );
}
