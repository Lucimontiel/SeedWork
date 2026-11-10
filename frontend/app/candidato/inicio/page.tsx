"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidatoShell from "../CandidatoShell";
import { useAuth } from "@/app/lib/auth-context";
import { apiFetch } from "@/app/lib/api";

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
  const { user } = useAuth();
  
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [aplicando, setAplicando] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.tipo !== "candidato" || !user.idCandidato) return;

    const cargarDatos = async () => {
      try {
        // ⬅️ CORREGIDO: Ahora usa /perfil en lugar de la ruta que no existía
        const [dataCandidato, dataOfertas, dataPostulaciones] = await Promise.all([
          apiFetch<Candidato>(`/api/candidato/${user.idCandidato}/perfil`),
          apiFetch<{ items: Oferta[] }>("/api/vacantes"),
          apiFetch<Postulacion[]>(`/api/candidato/${user.idCandidato}/postulaciones`),
        ]);

        setCandidato(dataCandidato);
        setOfertas(dataOfertas.items);
        setPostulaciones(dataPostulaciones);
      } catch (error) {
        console.error("Error al cargar datos de inicio:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);

  const aplicarOferta = async (idOferta: number) => {
    if (!user?.idCandidato) return;
    
    setAplicando(idOferta);
    try {
      // El backend ya sabe quién eres por la cookie, así que no hace falta mandar idCandidato
      await apiFetch("/api/postulaciones", {
        method: "POST",
        body: { idOferta },
      });
      
      const nuevasPostulaciones = await apiFetch<Postulacion[]>(`/api/candidato/${user.idCandidato}/postulaciones`);
      setPostulaciones(nuevasPostulaciones);
      
    } catch (error: any) {
      alert(error.message || "No se pudo enviar la postulación");
    } finally {
      setAplicando(null);
    }
  };

  const yaAplico = (idOferta: number) => {
    return postulaciones.some((p) => p.idOferta === idOferta);
  };

  if (loading) {
    return (
      <CandidatoShell
        nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : user?.correo}
        fotoUrl={candidato?.fotoUrl}
        pageTitle="Inicio"
        pageSubtitle="Cargando..."
      >
        <p>Cargando tu información...</p>
      </CandidatoShell>
    );
  }

  return (
    <CandidatoShell
      nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : user?.correo}
      fotoUrl={candidato?.fotoUrl}
      pageTitle="Inicio"
      pageSubtitle="Cada vez más cerca de tu próxima gran oportunidad"
    >
      {/* Tarjetas de acción */}
      <div className="quick-actions" style={{ marginBottom: 30 }}>
        <button className="action-card" onClick={() => router.push("/candidato/perfil")}>
          <h4>Completar tu perfil</h4>
          <p>Cuéntanos más sobre ti</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => router.push("/candidato/vacantes")}>
          <h4>Ofertas para ti</h4>
          <p>Encuentra tu próximo empleo</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => router.push("/candidato/simulador")}>
          <h4>Simulador</h4>
          <p>Prepárate con IA para las entrevistas</p>
          <span className="action-arrow"><svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
        </button>
        <button className="action-card" onClick={() => router.push("/candidato/consejos")}>
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
          postulaciones.slice(0, 3).map((postulacion) => (
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
                </div>
              </div>
              <div className="application-status">
                <div className="status-pill in-progress">
                  <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3"/><path d="M10 6.5V10l2.5 1.5"/></svg>
                  {postulacion.estado}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Oportunidades pensadas para ti */}
      <h2 className="section-title" style={{ marginTop: 30 }}>Oportunidades pensadas para ti</h2>
      <div className="opportunity-list">
        {ofertas.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085" }}>No hay ofertas disponibles.</p>
        ) : (
          ofertas.slice(0, 5).map((oferta) => {
            const aplico = yaAplico(oferta.idOferta);
            return (
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
                    <span className="tag">{oferta.experienciaMinima === 0 ? "Sin experiencia" : `${oferta.experienciaMinima}+ años`}</span>
                    <span className="tag">{oferta.modalidad}</span>
                  </div>
                </div>
                <div className="opportunity-meta">
                  <span><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2"/></svg>{oferta.ciudad}</span>
                </div>
                <div className="opportunity-actions">
                  <button 
                    className="btn-solid-sm" 
                    onClick={() => aplicarOferta(oferta.idOferta)}
                    disabled={aplico || aplicando === oferta.idOferta}
                  >
                    {aplico ? "Aplicado ✓" : aplicando === oferta.idOferta ? "Enviando..." : "Aplicar"}
                  </button>
                  <button className="btn-outline-sm" onClick={() => router.push("/candidato/vacantes")}>Ver más</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </CandidatoShell>
  );
}