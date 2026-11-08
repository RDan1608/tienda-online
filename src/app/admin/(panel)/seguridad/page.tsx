import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { MfaSetup } from "./mfa-setup";

export const metadata: Metadata = { title: "Seguridad" };

export default async function SecurityPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp[0] ?? null; // solo trae los verificados

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">Seguridad</h1>
      <p className="mt-2 max-w-xl text-muted">
        La verificación en dos pasos pide, además de la contraseña, un código de tu celular. Aunque alguien
        consiga tu contraseña, no puede entrar al panel ni cambiar nada.
      </p>
      <MfaSetup enabledFactorId={factor?.id ?? null} />
    </>
  );
}
