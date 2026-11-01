import { Sparkles } from "lucide-react";
import { site } from "@/lib/site";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-ivory px-4 py-10">
      {/* Fondo: manchas de la paleta, igual que la portada de la tienda */}
      <div aria-hidden className="blob -left-24 -top-16 -z-10 size-80 bg-dusty/70" />
      <div aria-hidden className="blob -bottom-20 -right-16 -z-10 size-96 bg-blush [animation-delay:-6s]" />
      <div aria-hidden className="blob left-1/2 top-1/3 -z-10 size-56 bg-butter [animation-delay:-10s]" />

      <div className="card-in w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-navy text-ivory shadow-float">
            <Sparkles className="size-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em]">{site.name}</h1>
          <p className="mt-1 text-[15px] text-muted">Panel de administración</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted">Acceso solo para administradores</p>
      </div>
    </main>
  );
}
