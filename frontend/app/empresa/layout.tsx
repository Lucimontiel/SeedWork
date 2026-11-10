// app/(empresa)/layout.tsx
"use client";

import "../estilo-shell.css"; 
import "./estilo-empresa.css";
import { useLayoutEffect } from "react"; 
import { useLocalSetting } from "../lib/useSettings";
import { useSyncAccesibilidad } from "../lib/useAccessibility";

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const [modo] = useLocalSetting("empresa:apariencia", "light");
  const [contraste] = useLocalSetting("empresa:accesibilidad:contraste", false);
  const [reducirAnim] = useLocalSetting("empresa:accesibilidad:reducirAnim", false);
  const [navTeclado] = useLocalSetting("empresa:accesibilidad:navTeclado", true);

  useSyncAccesibilidad(contraste, reducirAnim, navTeclado);

  // 👈 2. Cambia useEffect por useLayoutEffect aquí
  useLayoutEffect(() => {
    if (modo === "dark" || modo === "oscuro") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [modo]);

  return <div className="scope-empresa">{children}</div>;
}