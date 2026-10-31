"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { useSubmit } from "@/lib/use-submit";
import { signIn, type LoginState } from "../actions";

const input =
  "h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] outline-none transition focus:border-steel focus:ring-4 focus:ring-powder";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const onSubmit = useSubmit(action);

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl bg-surface p-6 ring-1 ring-border">
      <label className="block">
        <span className="mb-1.5 block text-sm">Correo</span>
        <input name="email" type="email" autoComplete="username" required className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-medium text-ivory transition hover:bg-navy/90 active:scale-[0.98] disabled:opacity-70"
      >
        {pending ? <LoaderCircle className="size-[18px] animate-spin" /> : "Entrar"}
      </button>
    </form>
  );
}
