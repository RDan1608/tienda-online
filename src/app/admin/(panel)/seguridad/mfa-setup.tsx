"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Enroll = { factorId: string; qr: string; secret: string };

export function MfaSetup({ enabledFactorId }: { enabledFactorId: string | null }) {
  const router = useRouter();
  const [enroll, setEnroll] = useState<Enroll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const btn =
    "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition active:scale-95 disabled:opacity-60";

  async function start() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    // Un intento a medias (factor sin verificar) estorba al crear otro: se limpia antes.
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) {
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Panel ${Date.now()}` });
    setBusy(false);
    if (err || !data) return setError("No se pudo iniciar. Intenta de nuevo.");
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enroll) return;
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\D/g, "");
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.mfa.challengeAndVerify({ factorId: enroll.factorId, code });
    setBusy(false);
    if (err) return setError("Código incorrecto. Revisa que la hora del celular sea automática.");
    setEnroll(null);
    router.refresh();
  }

  async function disable() {
    if (!enabledFactorId) return;
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.mfa.unenroll({ factorId: enabledFactorId });
    setBusy(false);
    if (err) return setError("No se pudo desactivar.");
    router.refresh();
  }

  return (
    <section className="mt-8 max-w-md rounded-3xl bg-surface p-6 shadow-soft ring-1 ring-border" aria-live="polite">
      {enabledFactorId ? (
        <>
          <p className="inline-flex items-center gap-2 font-semibold text-navy">
            <ShieldCheck className="size-5" /> Verificación en dos pasos activa
          </p>
          <p className="mt-2 text-sm text-muted">
            Si pierdes el celular no podrás entrar: guarda la clave secreta que te mostró la app al activarla.
          </p>
          <button onClick={disable} disabled={busy} className={`${btn} mt-5 border border-border hover:border-steel`}>
            Desactivar
          </button>
        </>
      ) : enroll ? (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm">
            1. Abre Google Authenticator, Authy o similar y escanea el código.
            <br />
            2. Escribe el código de 6 dígitos que muestre.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="Código QR para la app de autenticación" className="mx-auto size-44 rounded-2xl bg-white p-2" />
          <p className="break-all text-center text-xs text-muted">
            ¿No puedes escanear? Clave: <span className="select-all font-mono text-navy">{enroll.secret}</span>
          </p>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            placeholder="000000"
            required
            aria-label="Código de 6 dígitos"
            className="h-14 w-full rounded-2xl border border-border bg-ivory px-4 text-center text-2xl font-semibold tracking-[0.4em] tabular-nums outline-none focus:border-steel focus:ring-4 focus:ring-powder"
          />
          <button type="submit" disabled={busy} className={`${btn} w-full bg-navy text-ivory`}>
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : "Activar"}
          </button>
        </form>
      ) : (
        <>
          <p className="font-semibold">Verificación en dos pasos desactivada</p>
          <button onClick={start} disabled={busy} className={`${btn} mt-5 bg-navy text-ivory`}>
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : "Activar"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-blush p-3 text-sm font-medium text-rose-ink">
          {error}
        </p>
      )}
    </section>
  );
}
