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
    if (!user?.idCandidato) return;

    setLoading(true);
    try {
      const data = await apiFetch<CandidatoData>(
        `/api/candidato/${user.idCandidato}/perfil`
      );
      setCandidato(data);
    } catch (err) {
      console.error("Error cargando candidato:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.idCandidato]);

  useEffect(() => {
    if (cargandoAuth) return;

    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.tipo !== "candidato" || !user.idCandidato) {
      if (user.tipo === "empresa") router.replace("/empresa/inicio");
      else if (user.tipo === "administrador") router.replace("/administrador/inicio");
      else router.replace("/login");
      return;
    }

    void recargar();
  }, [user, cargandoAuth, router, recargar]);

  return { candidato, loading, recargar };
}
