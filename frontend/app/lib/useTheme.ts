"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "claro" | "oscuro";

const THEME_KEY = "theme:candidato";
const THEME_EVENT = "theme-change:candidato";

function leerTema(): Theme {
  if (typeof window === "undefined") return "claro";
  return localStorage.getItem(THEME_KEY) === "oscuro" ? "oscuro" : "claro";
}

function aplicarTema(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "oscuro") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("claro");

  useEffect(() => {
    const guardado = leerTema();
    setThemeState(guardado);
    aplicarTema(guardado);
  }, []);

  useEffect(() => {
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Theme>).detail;
      setThemeState(detail);
      aplicarTema(detail);
    }
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  const setTheme = useCallback((nuevo: Theme) => {
    setThemeState(nuevo);
    localStorage.setItem(THEME_KEY, nuevo);
    aplicarTema(nuevo);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nuevo }));
  }, []);

  return { theme, setTheme };
}