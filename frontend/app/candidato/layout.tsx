"use client"; // ⬅️ ESTA LÍNEA ES LA QUE ARREGLA EL ERROR

import "./estilo-candidato.css";
import { useLocalSetting } from "@/app/lib/useSettings";
import { useSyncAccesibilidad } from "../lib/useAccessibility";

export default function CandidatoLayout({ children }: { children: React.ReactNode }) {
  // 1. Leemos los ajustes de accesibilidad
  const [altoContraste] = useLocalSetting("accesibilidad:contraste", false);
  const [reducirAnim] = useLocalSetting("accesibilidad:reducirAnim", false);
  const [navTeclado] = useLocalSetting("accesibilidad:navTeclado", true);

  // 2. Los aplicamos al DOM cada vez que cambian o al cargar cualquier página
  useSyncAccesibilidad(altoContraste, reducirAnim, navTeclado);

  return <div className="scope-candidato">{children}</div>;
}