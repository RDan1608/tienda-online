import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VerifyForm } from "./verify-form";

export default async function VerifyPage() {
  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  // Sin sesión lo manda el proxy al login; sin segundo paso pendiente, al panel.
  if (aal?.nextLevel !== "aal2" || aal.currentLevel === "aal2") redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-navy text-ivory shadow-float">
          <ShieldCheck className="size-6" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-0.04em]">Verificación en dos pasos</h1>
        <p className="mb-6 mt-1 text-[15px] text-muted">Escribe el código de 6 dígitos de tu app de autenticación.</p>
        <VerifyForm />
      </div>
    </main>
  );
}
