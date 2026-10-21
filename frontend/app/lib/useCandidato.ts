"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { apiFetch } from "./api";

export interface CandidatoData {
  idCandidato: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  ciudad?: string;
  telefono?: string;
  fotoUrl?: string | null;
}

export function useCandidato() {
  const router = useRouter();
  const { user, cargando: cargandoAuth } = useAuth();
  const [candidato, setCandidato] = useState<CandidatoData | null>(null);
  const [loading, setLoading] = useState(true);

  const recargar = useCallback(async () => {
    // Si no es un candidato, no hacemos nada (el shell protegerá la ruta)
    if (!user || user.tipo !== "candidato" || !user.idCandidato) {
      if (!cargandoAuth) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<CandidatoData>(`/api/candidato/${user.idCandidato}`);
      setCandidato(data);
    } catch (err) {
      console.error("Error al cargar candidato:", err);
    } finally {
      setLoading(false);
    }
  }, [user, cargandoAuth]);

  useEffect(() => {
    if (!cargandoAuth) {
      recargar();
    }
  }, [cargandoAuth, recargar]);

  return { candidato, loading, recargar };
}