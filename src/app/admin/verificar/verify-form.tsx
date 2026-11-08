"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function VerifyForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\D/g, "");
    if (code.length !== 6) return setError("Escribe los 6 dígitos.");
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp[0];
    if (!factor) {
      setPending(false);
      return setError("No hay verificación configurada.");
    }
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (err) {
      setPending(false);
      return setError("Código incorrecto o vencido.");
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5 rounded-[28px] bg-surface/85 p-6 text-left shadow-float ring-1 ring-border">
      <label className="block">
        <span className="sr-only">Código de 6 dígitos</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={7}
          placeholder="000000"
          autoFocus
          required
          className="h-14 w-full rounded-2xl border border-border bg-ivory px-4 text-center text-2xl font-semibold tracking-[0.4em] tabular-nums outline-none transition focus:border-steel focus:ring-4 focus:ring-powder"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-2xl bg-blush p-3.5 text-sm font-medium text-rose-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-navy text-base font-semibold text-ivory transition active:scale-[0.98] disabled:opacity-70"
      >
        {pending ? <LoaderCircle className="size-5 animate-spin" /> : "Verificar"}
      </button>
    </form>
  );
}
