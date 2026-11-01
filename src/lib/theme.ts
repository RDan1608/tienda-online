"use client";

import { useSyncExternalStore } from "react";

export type ThemeMode = "system" | "light" | "dark";
const KEY = "tienda-theme";
const EVENT = "tienda-theme-change";

function read(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Aplica la elección al <html> (y al color de la barra del navegador) y la guarda en el dispositivo. */
export function setTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.add("theme-fade"); // el cambio se funde en vez de saltar
  setTimeout(() => root.classList.remove("theme-fade"), 320);
  if (mode === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = mode;
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    // Sin almacenamiento: el cambio vale mientras la pestaña siga abierta.
  }
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0f1722" : "#f7f6f2");
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Elección actual de la persona ("system" = seguir el tema del dispositivo). */
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, read, () => "system");
}

/** ¿Se está viendo en oscuro ahora mismo? (elección explícita o tema del sistema). */
export function isDarkNow() {
  const t = document.documentElement.dataset.theme;
  return t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches);
}
