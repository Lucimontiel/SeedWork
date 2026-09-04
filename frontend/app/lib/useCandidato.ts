"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "./session";
import { API_BASE } from "./api";

export interface CandidatoData {
  idCandidato: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  ciudad?: string;
  telefono?: string;
}

export function useCandidato() {
  const router = useRouter();
  const [candidato, setCandidato] = useState<CandidatoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session || session.tipo !== "candidato") {
      router.replace("/login");
      return;
    }
    fetch(`${API_BASE}/api/candidato/${session.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el candidato");
        return r.json();
      })
      .then((data: CandidatoData) => setCandidato(data))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  return { candidato, loading };
}