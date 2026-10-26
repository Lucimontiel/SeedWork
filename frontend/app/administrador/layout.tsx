"use client";

import "./estilo-admin.css";
import { useEffect } from "react";
import { useLocalSetting } from "../lib/useSettings";

export default function AdministradorLayout({ children }: { children: React.ReactNode }) {
  // Usamos la misma llave global para que el tema se mantenga
  const [modo] = useLocalSetting("theme:candidato", "claro");

  useEffect(() => {
    if (modo === "oscuro" || modo === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [modo]);

  return <div className="scope-admin">{children}</div>;
}