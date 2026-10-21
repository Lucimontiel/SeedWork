"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "@/app/lib/auth-context";
import { apiFetch } from "@/app/lib/api";

type Empresa = {
  idEmpresa: number;
  nombreEmpresa: string;
  correo: string;
  nit: string;
  sector?: string;
  ciudad?: string;
};

type Candidato = {
  idPostulacion: number;
  idCandidato: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  tituloOferta: string;
  estado: string;
  fechaPostulacion: string;
};

type Oferta = {
  idOferta: number;
  titulo: string;
  ciudad: string;
  modalidad: string;
  estado: string;
  empresa: string;
};

export default function InicioEmpresaPage() {
  const router = useRouter();
  const { user, cargando: cargandoAuth } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (cargandoAuth) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.tipo !== "empresa" || !user.idEmpresa) {
      if (user.tipo === "candidato") router.replace("/candidato/inicio");
      else if (user.tipo === "administrador") router.replace("/administrador/inicio");
      else router.replace("/login");
    }
  }, [user, cargandoAuth, router]);

  useEffect(() => {
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) return;

    const cargarDatos = async () => {
      try {
        const [dataEmpresa, dataCandidatos, dataOfertas] = await Promise.all([
          apiFetch<Empresa>(`/api/empresa/${user.idEmpresa}`),
          apiFetch<Candidato[]>(`/api/empresa/${user.idEmpresa}/candidatos`),
          apiFetch<Oferta[]>(`/api/empresa/${user.idEmpresa}/ofertas`),
        ]);

        setEmpresa(dataEmpresa);
        if (Array.isArray(dataCandidatos)) setCandidatos(dataCandidatos);
        if (Array.isArray(dataOfertas)) setOfertas(dataOfertas);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [user]);

  async function cambiarEstadoOferta(idOferta: number, nuevoEstado: string) {
    try {
      await apiFetch(`/api/empresa/ofertas/${idOferta}/estado`, {
        method: "PATCH",
        body: { nuevoEstado },
      });
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "Error al cambiar estado");
    }
  }

  async function cambiarEstadoCandidato(idPostulacion: number, nuevoEstado: string) {
    try {
      await apiFetch(`/api/empresa/postulaciones/${idPostulacion}/estado`, {
        method: "PATCH",
        body: { nuevoEstado },
      });
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "Error al cambiar estado");
    }
  }

  if (cargandoAuth || (user?.tipo === "empresa" && loadingData)) {
    return (
      <EmpresaShell
        nombre={user?.correo}
        pageTitle="Inicio"
        pageSubtitle="Cargando..."
      >
        <p style={{ padding: 40, textAlign: "center" }}>Cargando panel...</p>
      </EmpresaShell>
    );
  }

  if (!user || user.tipo !== "empresa") return null;

  return (
    <EmpresaShell
      nombre={empresa?.nombreEmpresa || user.correo}
      pageTitle="Inicio"
      pageSubtitle="Resumen de tu actividad en SeedWork"
    >
      {/* Banner de bienvenida */}
      <div className="empresa-welcome-card">
        <div className="empresa-welcome-main">
          <h1>¡Bienvenido a SeedWork, {empresa?.nombreEmpresa || "Empresa"}!</h1>
          <p>Encuentra el talento perfecto para tu empresa.</p>
          <div className="empresa-welcome-actions">
            <button className="btn-empresa-solid" onClick={() => router.push("/empresa/mis-ofertas")}>
              <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>
              Nueva oferta
            </button>
            <button className="btn-empresa-outline" onClick={() => router.push("/empresa/candidatos")}>
              <svg viewBox="0 0 20 20"><circle cx="7" cy="6.5" r="2.3"/><path d="M2.8 15.5c0-2.4 1.9-4 4.2-4s4.2 1.6 4.2 4"/><circle cx="14.2" cy="7.3" r="1.8"/><path d="M12.5 11.7c1.9.2 3.2 1.6 3.2 3.8"/></svg>
              Ver candidatos
            </button>
          </div>
        </div>
        <div className="empresa-welcome-completion">
          <span className="empresa-completion-label">Perfil completado</span>
          <span className="empresa-completion-percent">60%</span>
          <div className="empresa-completion-bar-bg">
            <div className="empresa-completion-bar-fill" style={{ width: "60%" }}></div>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="section-title">¿Qué puedes hacer ahora?</h2>
      <div className="quick-actions">
        <button className="action-card" onClick={() => router.push("/empresa/perfil")}>
          <h4>Completar tu perfil</h4>
          <p>Cuéntanos más sobre tu empresa</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => router.push("/empresa/mis-ofertas")}>
          <h4>Publica una oferta</h4>
          <p>Encuentra jóvenes talentosos</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => router.push("/empresa/candidatos")}>
          <h4>Explora postulantes</h4>
          <p>Conoce increíbles perfiles</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => router.push("/empresa/notificaciones")}>
          <h4>Notificaciones</h4>
          <p>Revísalas y actúa</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
      </div>

      {/* Mis ofertas recientes (Dinámicas) */}
      <h2 className="section-title">Mis ofertas recientes</h2>
      <div className="empresa-offer-list">
        {ofertas.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085" }}>No tienes ofertas publicadas aún.</p>
        ) : (
          ofertas.slice(0, 3).map((oferta) => (
            <div className="empresa-offer-card" key={oferta.idOferta}>
              <div className="empresa-offer-icon icon-blue-soft">
                <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>
              </div>
              <div className="empresa-offer-info">
                <h4>{oferta.titulo}</h4>
                <p>{oferta.ciudad} · {oferta.modalidad}</p>
              </div>
              <div className="empresa-offer-status active">
                <span className="status-pill">{oferta.estado}</span>
              </div>
              <div className="empresa-offer-actions">
                <button className="btn-solid-sm" onClick={() => router.push("/empresa/candidatos")}>
                  Candidatos
                </button>
                <button className="btn-outline-sm" onClick={() => router.push("/empresa/mis-ofertas")}>
                  Editar
                </button>
                <select
                  className="empresa-status-select"
                  value=""
                  onChange={(e) => cambiarEstadoOferta(oferta.idOferta, e.target.value)}
                >
                  <option value="">Estado</option>
                  <option value="Pausada">Pausada</option>
                  <option value="Cerrada">Cerrada</option>
                  <option value="Publicada">Publicada</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Postulantes recientes */}
      <h2 className="section-title">Postulantes recientes</h2>
      <div className="empresa-candidate-list">
        {candidatos.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085", marginTop: 20 }}>No hay postulantes para mostrar.</p>
        ) : (
          candidatos.slice(0, 5).map((candidato) => (
            <div className="empresa-candidate-card" key={candidato.idPostulacion}>
              <div className="empresa-candidate-avatar">
                <svg viewBox="0 0 20 20" style={{ width: "100%", height: "100%", fill: "#fff" }}>
                  <circle cx="10" cy="7" r="3"/>
                  <path d="M4 16c0-3 2.7-5 6-5s6 2 6 5"/>
                </svg>
              </div>
              <div className="empresa-candidate-info">
                <h4>{candidato.nombres} {candidato.apellidos}</h4>
                <p>{candidato.tituloOferta}</p>
                <div className="tag-row">
                  <span className="tag">{candidato.estado}</span>
                </div>
              </div>
              <div className="empresa-candidate-actions">
                <button className="btn-outline-sm" onClick={() => router.push("/empresa/candidatos")}>
                  Ver perfil
                </button>
                <button className="btn-solid-sm" onClick={() => alert(`Contactando a ${candidato.nombres}...`)}>
                  Contactar
                </button>
                <select
                  className="empresa-status-select"
                  value=""
                  onChange={(e) => cambiarEstadoCandidato(candidato.idPostulacion, e.target.value)}
                >
                  <option value="">Estado</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Prestación de servicios">Prestación de servicios</option>
                  <option value="Contratado">Contratado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </EmpresaShell>
  );
}