// lib/useAccessibility.ts
"use client";

import { useEffect } from "react";

/**
 * Sincroniza los toggles de accesibilidad con atributos en <html>.
 *
 * Bug anterior: leía localStorage con getItem plano, pero useSettings
 * guarda con JSON.stringify → "true" (con comillas) !== "true".
 * Ahora usamos los booleanos que vienen por parámetro.
 */
export function useSyncAccesibilidad(
  contraste: boolean,
  reducirAnim: boolean,
  navTeclado: boolean
) {
  useEffect(() => {
    const html = document.documentElement;

    if (contraste) {
      html.setAttribute("data-contrast", "high");
    } else {
      html.removeAttribute("data-contrast");
    }

    if (reducirAnim) {
      html.setAttribute("data-reduce-motion", "true");
    } else {
      html.removeAttribute("data-reduce-motion");
    }

    if (navTeclado) {
      html.setAttribute("data-keyboard-nav", "true");
    } else {
      html.removeAttribute("data-keyboard-nav");
    }
  }, [contraste, reducirAnim, navTeclado]);
}