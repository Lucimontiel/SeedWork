"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Esperar a que el AuthProvider cargue
    if (cargandoAuth) return;

    // Sin sesión o no es candidato → redirigir
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

    // Cargar datos del candidato con cookies (apiFetch)
    apiFetch<CandidatoData>(`/api/candidato/${user.idCandidato}`)
      .then(setCandidato)
      .catch((err) => {
        console.error("Error cargando candidato:", err);
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [user, cargandoAuth, router]);

  return { candidato, loading };
}