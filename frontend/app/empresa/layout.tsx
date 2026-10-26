"use client";

import "./estilo-empresa.css";
import { useEffect } from "react";
import { useLocalSetting } from "../lib/useSettings";
import { useSyncAccesibilidad } from "../lib/useAccessibility";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  // Modo oscuro / claro
  const [modo] = useLocalSetting("empresa:apariencia", "light");

  // Accesibilidad — SÍNCRONO con los settingKeys del page.tsx
  const [contraste] = useLocalSetting("empresa:accesibilidad:contraste", false);
  const [reducirAnim] = useLocalSetting("empresa:accesibilidad:reducirAnim", false);
  const [navTeclado] = useLocalSetting("empresa:accesibilidad:navTeclado", true);

  // Aplica data-contrast, data-reduce-motion, data-keyboard-nav en <html>
  useSyncAccesibilidad(contraste, reducirAnim, navTeclado);

  // Aplica el tema
  useEffect(() => {
    if (modo === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [modo]);

  return <div className="scope-empresa">{children}</div>;
}