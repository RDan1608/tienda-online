"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { useSubmit } from "@/lib/use-submit";
import { signIn, type LoginState } from "../actions";

const input =
  "h-14 w-full rounded-2xl border border-border bg-ivory pl-12 pr-4 text-base outline-none transition placeholder:text-muted/70 focus:border-steel focus:bg-surface focus:ring-4 focus:ring-powder";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const onSubmit = useSubmit(action);
  const [show, setShow] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3.5 rounded-[28px] bg-surface/85 p-6 shadow-float ring-1 ring-border backdrop-blur-xl"
    >
      <label className="relative block">
        <span className="sr-only">Correo</span>
        <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="Correo"
          inputMode="email"
          required
          className={input}
        />
      </label>

      <div className="relative">
        <label className="block">
          <span className="sr-only">Contraseña</span>
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Contraseña"
            required
            className={`${input} pr-14`}
          />
        </label>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar clave" : "Mostrar clave"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-powder hover:text-navy active:scale-90"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="swap-in rounded-2xl bg-blush p-3.5 text-sm font-medium text-rose-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#40597a] to-navy text-base font-semibold text-ivory shadow-soft transition active:scale-[0.98] disabled:opacity-70"
      >
        {pending ? <LoaderCircle className="size-5 animate-spin" /> : "Entrar"}
      </button>
    </form>
  );
}
