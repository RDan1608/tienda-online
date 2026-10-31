import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-3xl font-semibold">Tienda</p>
        <p className="mt-1 text-center text-sm text-muted">Panel de administración</p>
        <LoginForm />
      </div>
    </main>
  );
}
