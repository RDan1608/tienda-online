"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { isDarkNow, setTheme, useThemeMode, type ThemeMode } from "@/lib/theme";

/** Botón del encabezado: alterna claro/oscuro con un toque (la elección queda guardada). */
export function ThemeButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => setTheme(isDarkNow() ? "light" : "dark")}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
      className={className}
    >
      {/* Un solo ícono visible según el tema (se decide con CSS, sin parpadeo al cargar) */}
      <Moon className="theme-moon size-5" strokeWidth={1.75} aria-hidden />
      <Sun className="theme-sun size-5" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Automático", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

/** Selector de tres opciones (para el pie de página): automático sigue al dispositivo. */
export function ThemeSwitch() {
  const mode = useThemeMode();
  return (
    <div role="radiogroup" aria-label="Tema de la tienda" className="inline-flex rounded-full bg-powder/70 p-1">
      {options.map(({ value, label, icon: Icon }) => {
        const on = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(value)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-[background-color,color] duration-200 ${
              on ? "bg-navy text-ivory shadow-soft" : "text-muted hover:text-navy"
            }`}
          >
            <Icon className="size-4" /> {label}
          </button>
        );
      })}
    </div>
  );
}
