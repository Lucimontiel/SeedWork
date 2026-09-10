"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";
import type { CV } from "./types";

export function useCV(idCandidato: number | null) {
  const [cv, setCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!idCandidato) return;
    setLoading(true);
    fetch(`${API_BASE}/api/candidato/${idCandidato}/cv`)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar tu CV");
        return r.json();
      })
      .then((data: CV) => setCv(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [idCandidato]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mutar = useCallback(
    async (path: string, method: string, body?: unknown): Promise<CV> => {
      const resp = await fetch(`${API_BASE}/api/candidato/${idCandidato}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo guardar el cambio");
      }
      const nuevo: CV = await resp.json();
      setCv(nuevo);
      return nuevo;
    },
    [idCandidato]
  );

  return {
    cv,
    loading,
    error,
    recargar: cargar,
    guardarDatosPersonales: (body: { nombres: string; apellidos: string; tituloProfesional?: string; ciudad?: string; correo?: string; telefono?: string }) =>
      mutar("/cv/datos-personales", "PUT", body),
    guardarSobreMi: (about: string) => mutar("/cv/sobre-mi", "PUT", { about }),
    guardarHabilidades: (habilidades: string[]) => mutar("/cv/habilidades", "PUT", { habilidades }),
    agregarEducacion: (body: { titulo: string; institucion?: string; anio?: string }) => mutar("/cv/educacion", "POST", body),
    agregarProyecto: (body: { titulo: string; descripcion?: string; meta?: string }) => mutar("/cv/proyectos", "POST", body),
    agregarIdioma: (descripcion: string) => mutar("/cv/idiomas", "POST", { descripcion }),
    agregarReferencia: (body: { nombre: string; cargo?: string; contacto?: string }) => mutar("/cv/referencias", "POST", body),
    agregarSeccion: (body: { titulo: string; contenido?: string }) => mutar("/cv/secciones", "POST", body),
    actualizarSeccion: (idSeccion: number, contenido: string) => mutar(`/cv/secciones/${idSeccion}`, "PUT", { contenido }),
    guardarPlantilla: (plantilla: string) => mutar("/cv/plantilla", "PUT", { plantilla }),
    guardarFoto: (fotoUrl: string) => mutar("/cv/foto", "PUT", { fotoUrl }),
  };
}