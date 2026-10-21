"use client";

import { useCallback, useEffect } from "react";

const PREFIX = "settings:candidato:";

/**
 * Aplica los atributos de accesibilidad a <html> según lo guardado en localStorage.
 */
export function aplicarAccesibilidadDesdeStorage() {
  if (typeof document === "undefined") return;

  const html = document.documentElement;

  const contraste = localStorage.getItem(PREFIX + "accesibilidad:contraste");
  const reducirAnim = localStorage.getItem(PREFIX + "accesibilidad:reducirAnim");
  const navTeclado = localStorage.getItem(PREFIX + "accesibilidad:navTeclado");

  // Alto contraste
  if (contraste === "true") {
    html.setAttribute("data-contrast", "high");
  } else {
    html.removeAttribute("data-contrast");
  }

  // Reducir animaciones
  if (reducirAnim === "true") {
    html.setAttribute("data-reduce-motion", "true");
  } else {
    html.removeAttribute("data-reduce-motion");
  }

  // Navegación con teclado
  if (navTeclado === "true") {
    html.setAttribute("data-keyboard-nav", "true");
  } else {
    html.removeAttribute("data-keyboard-nav");
  }
}

/**
 * Hook que sincroniza los 3 toggles de accesibilidad al DOM cada vez que cambian.
 */
export function useSyncAccesibilidad(
  contraste: boolean,
  reducirAnim: boolean,
  navTeclado: boolean
) {
  useEffect(() => {
    aplicarAccesibilidadDesdeStorage();
  }, [contraste, reducirAnim, navTeclado]);

  return useCallback(() => {
    aplicarAccesibilidadDesdeStorage();
  }, []);
}