"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";

export interface Perfil {
  idCandidato: number;
  nombres: string;
  apellidos: string;
  tituloProfesional?: string | null;
  correo: string;
  ciudad?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  about?: string | null;
  fotoUrl?: string | null;
  areaInteres?: string | null;
  salarioEsperado?: string | null;
  tipoContratoPreferido?: string | null;
  jornadaPreferida?: string | null;
  movilidad?: string | null;
  modalidadPreferida?: string | null;
  disponibilidad?: string | null;
  habilidades: { idHabilidad: number; nombre: string }[];
  educacion: { idEducacion: number; titulo: string; institucion?: string | null; anio?: string | null }[];
  experiencia: { idProyecto: number; titulo: string; descripcion?: string | null; meta?: string | null }[];
  idiomas: { idIdioma: number; descripcion: string }[];
}

export function usePerfil(idCandidato: number | null) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!idCandidato) return;
    setLoading(true);
    fetch(`${API_BASE}/api/candidato/${idCandidato}/perfil`)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar tu perfil");
        return r.json();
      })
      .then(setPerfil)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [idCandidato]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mutar = useCallback(
    async (path: string, method: string, body?: unknown): Promise<Perfil> => {
      const resp = await fetch(`${API_BASE}/api/candidato/${idCandidato}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo guardar el cambio");
      }
      const nuevo = await resp.json();
      setPerfil(nuevo);
      return nuevo;
    },
    [idCandidato]
  );

  return {
    perfil,
    loading,
    error,
    guardarDatos: (body: any) => mutar("/perfil/datos", "PUT", body),
    guardarPreferencias: (body: any) => mutar("/perfil/preferencias", "PUT", body),
    guardarSobreMi: (about: string) => mutar("/cv/sobre-mi", "PUT", { about }),
    guardarHabilidades: (habilidades: string[]) => mutar("/cv/habilidades", "PUT", { habilidades }),
    guardarFoto: (fotoUrl: string) => mutar("/cv/foto", "PUT", { fotoUrl }),
    agregarEducacion: (body: any) => mutar("/cv/educacion", "POST", body),
    agregarIdioma: (descripcion: string) => mutar("/cv/idiomas", "POST", { descripcion }),
    agregarExperiencia: (body: any) => mutar("/cv/proyectos", "POST", body),
  };
}

// El HTML original mostraba una barra de progreso por idioma (ej: 100%, Nativo).
// El backend solo guarda "Inglés - B2" como texto libre, así que el nivel/porcentaje
// se infiere aquí por palabras clave — es una aproximación visual, no un dato real.
export function inferirNivelIdioma(descripcion: string): { nivel: string; porcentaje: number } {
  const d = descripcion.toLowerCase();
  const partes = descripcion.split(" - ");
  const nivel = partes.length > 1 ? partes[1].trim() : descripcion;
  if (d.includes("nativo")) return { nivel, porcentaje: 100 };
  if (d.includes("c2")) return { nivel, porcentaje: 95 };
  if (d.includes("c1") || d.includes("avanzado")) return { nivel, porcentaje: 85 };
  if (d.includes("b2")) return { nivel, porcentaje: 65 };
  if (d.includes("b1") || d.includes("intermedio")) return { nivel, porcentaje: 55 };
  if (d.includes("a2")) return { nivel, porcentaje: 35 };
  if (d.includes("a1") || d.includes("básico") || d.includes("basico")) return { nivel, porcentaje: 25 };
  return { nivel, porcentaje: 50 };
}