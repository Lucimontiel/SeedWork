"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { CV } from "./types";

export function useCV(idCandidato: number | null) {
  const [cv, setCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!idCandidato) return;
    setLoading(false);
    try {
      const data = await apiFetch<CV>(`/api/candidato/${idCandidato}/cv`);
      setCv(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [idCandidato]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mutar = useCallback(
    async (path: string, method: string, body?: unknown): Promise<CV> => {
      if (!idCandidato) throw new Error("ID de candidato no disponible");
      
      const nuevo = await apiFetch<CV>(`/api/candidato/${idCandidato}${path}`, {
        method,
        body,
      });
      
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
    eliminarEducacion: (id: number) => mutar(`/cv/educacion/${id}`, "DELETE"),
    eliminarProyecto: (id: number) => mutar(`/cv/proyectos/${id}`, "DELETE"),
    eliminarIdioma: (id: number) => mutar(`/cv/idiomas/${id}`, "DELETE"),
    eliminarReferencia: (id: number) => mutar(`/cv/referencias/${id}`, "DELETE"),
    eliminarSeccion: (id: number) => mutar(`/cv/secciones/${id}`, "DELETE"),
  };
}