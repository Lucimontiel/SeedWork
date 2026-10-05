"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidatoShell from "../CandidatoShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";

type Candidato = {
  idCandidato: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  ciudad?: string;
  telefono?: string;
  fotoUrl?: string | null;
};

type Oferta = {
  idOferta: number;
  idEmpresa: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  descripcion: string;
  experienciaMinima: number;
  fechaPublicacion: string;
};

type Postulacion = {
  idPostulacion: number;
  idOferta: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  estado: string;
  fechaPostulacion: string;
};

export default function InicioCandidatoPage() {
  const router = useRouter();
  const { user, cargando: cargandoAuth } = useAuth();

  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);

  // ============================================================
  // Protección de la página
  // ============================================================
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
    }
  }, [user, cargandoAuth, router]);

  // ============================================================
  // Carga de datos
  // ============================================================
  useEffect(() => {
    if (!user || user.tipo !== "candidato" || !user.idCandidato) return;

    // Datos del candidato
    apiFetch<Candidato>(`/api/candidato/${user.idCandidato}`)
      .then(setCandidato)
      .catch((err) => console.error("Error al cargar candidato:", err));

    // Vacantes publicadas (público, pero usamos apiFetch por consistencia)
    apiFetch<Oferta[]>("/api/vacantes")
      .then((data) => {
        if (Array.isArray(data)) setOfertas(data);
      })
      .catch((err) => console.error("Error al cargar vacantes:", err));

    // Postulaciones del candidato
    apiFetch<Postulacion[]>(`/api/candidato/${user.idCandidato}/postulaciones`)
      .then((data) => {
        if (Array.isArray(data)) setPostulaciones(data);
      })
      .catch((err) => console.error("Error al cargar postulaciones:", err));
  }, [user]);

  if (cargandoAuth) {
    return (
      <CandidatoShell pageTitle="Inicio" pageSubtitle="Cargando...">
        <p style={{ padding: 40, textAlign: "center" }}>Cargando...</p>
      </CandidatoShell>
    );
  }

  if (!user || user.tipo !== "candidato") {
    return null;
  }

  const nombreCompleto = candidato
    ? `${candidato.nombres} ${candidato.apellidos}`.trim()
    : "";

  return (
    <CandidatoShell
      pageTitle="Inicio"
      pageSubtitle="Cada vez más cerca de tu próxima gran oportunidad"
      nombre={nombreCompleto}
      fotoUrl={candidato?.fotoUrl || null}
    >
      {/* Tarjetas de acción */}
      <div className="quick-actions" style={{ marginBottom: 30 }}>
        <button className="action-card" onClick={() => (window.location.href = "/candidato/perfil")}>
          <h4>Completar tu perfil</h4>
          <p>Cuéntanos más sobre ti</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => (window.location.href = "/candidato/vacantes")}>
          <h4>Ofertas para ti</h4>
          <p>Encuentra tu próximo empleo</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => (window.location.href = "/candidato/simulador")}>
          <h4>Simulador</h4>
          <p>Prepárate con IA para las entrevistas</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => (window.location.href = "/candidato/consejos")}>
          <h4>Consejos para ti</h4>
          <p>Revísalos para que deslumbres</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
      </div>

      {/* Estado de tus postulaciones */}
      <h2 className="section-title">Estado de tus postulaciones</h2>
      <div className="application-list">
        {postulaciones.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085" }}>No hay postulaciones para mostrar.</p>
        ) : (
          <>
            {postulaciones.map((postulacion) => (
              <div className="application-card" key={postulacion.idPostulacion}>
                <div className="application-icon icon-blue">
                  <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 3v2M10 15v2M3 10h2M15 10h2"/></svg>
                </div>
                <div className="application-info">
                  <h4>{postulacion.titulo}</h4>
                  <p>{postulacion.empresa}</p>
                  <div className="application-meta">
                    <span><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>{postulacion.ciudad}</span>
                    <span><svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="12" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>{postulacion.modalidad}</span>
                    <span><svg viewBox="0 0 20 20"><rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="M7 8h6M7 11h4"/></svg>{new Date(postulacion.fechaPostulacion).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="application-status">
                  <div className="status-pill in-progress">
                    <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 6.5V10l2.5 1.5"/></svg>
                    {postulacion.estado}
                  </div>
                </div>
                <div className="application-actions">
                  <button className="btn-outline-sm" onClick={() => (window.location.href = "/candidato/postulaciones")}>Ver oferta</button>
                  <button className="btn-solid-sm" onClick={() => (window.location.href = "/candidato/postulaciones")}>Ver empresa</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Oportunidades pensadas para ti */}
      <h2 className="section-title">Oportunidades pensadas para ti</h2>
      <div className="opportunity-list">
        {ofertas.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085" }}>No hay ofertas disponibles.</p>
        ) : (
          <>
            {ofertas.slice(0, 5).map((oferta) => (
              <div className="opportunity-card" key={oferta.idOferta}>
                <div className="opportunity-avatar avatar-purple">
                  <svg viewBox="0 0 20 20" style={{ width: "100%", height: "100%", fill: "#fff" }}>
                    <path d="M4 16V8M8 16V4M12 16v-6M16 16V6"/>
                  </svg>
                </div>
                <div className="opportunity-info">
                  <h4>{oferta.titulo}</h4>
                  <p>{oferta.empresa}</p>
                  <div className="opportunity-desc">{oferta.descripcion}</div>
                  <div className="tag-row">
                    <span className="tag">Sin experiencia</span>
                    <span className="tag">Tiempo completo</span>
                  </div>
                </div>
                <div className="opportunity-meta">
                  <span><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>{oferta.ciudad}</span>
                  <span><svg viewBox="0 0 20 20"><rect x="2.5" y="4" width="15" height="12" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>{oferta.modalidad}</span>
                  <span><svg viewBox="0 0 20 20"><rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="M7 8h6M7 11h4"/></svg>{new Date(oferta.fechaPublicacion).toLocaleDateString()}</span>
                </div>
                <div className="opportunity-actions">
                  <button className="btn-solid-sm" onClick={() => alert("Postulándote a: " + oferta.titulo)}>Aplicar</button>
                  <button className="btn-outline-sm" onClick={() => (window.location.href = "/candidato/vacantes")}>Ver más</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </CandidatoShell>
  );
}