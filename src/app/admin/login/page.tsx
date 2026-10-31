import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-3xl font-semibold tracking-[-0.025em]">Tienda</h1>
        <p className="mt-1 text-center text-sm text-muted">Panel de administración</p>
        <LoginForm />
      </div>
    </main>
  );
}
