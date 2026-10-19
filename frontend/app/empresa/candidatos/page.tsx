"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";

// ============================================================
// Tipos
// ============================================================
type Candidato = {
  idPostulacion: number;
  idCandidato: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  fotoUrl?: string | null;
  tituloOferta: string;
  estado: string;
  fechaPostulacion: string;
};

type PerfilCandidato = {
  idCandidato: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string | null;
  ciudad?: string | null;
  tituloProfesional?: string | null;
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
  referencias: { idReferencia: number; nombre: string; cargo?: string | null; contacto?: string | null }[];
  secciones: { idSeccion: number; titulo: string; contenido?: string | null }[];
};

// ============================================================
// Componente principal
// ============================================================
export default function CandidatosEmpresaPage() {
  const { user, cargando: cargandoAuth } = useAuth();

  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Modal de perfil
  const [perfilAbierto, setPerfilAbierto] = useState<PerfilCandidato | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function recargar() {
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) return;

    try {
      const data = await apiFetch<Candidato[]>(`/api/empresa/${user.idEmpresa}/candidatos`);
      if (Array.isArray(data)) setCandidatos(data);
    } catch (err) {
      console.error("Error cargando candidatos:", err);
    }
  }

  useEffect(() => {
    if (cargandoAuth) return;
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) {
      setCargando(false);
      return;
    }

    setCargando(true);
    recargar().finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cargandoAuth]);

  async function cambiarEstadoCandidato(idPostulacion: number, nuevoEstado: string) {
    try {
      await apiFetch(`/api/empresa/postulaciones/${idPostulacion}/estado`, {
        method: "PATCH",
        body: { nuevoEstado },
      });
      mostrarToast("Estado actualizado");
      await recargar();
    } catch (err: any) {
      mostrarToast(err?.message || "Error al cambiar estado");
    }
  }

  // 👇 NUEVO: abrir modal con el perfil del candidato
  async function verPerfil(idCandidato: number) {
    setCargandoPerfil(true);
    setPerfilAbierto(null);
    try {
      const data = await apiFetch<PerfilCandidato>(`/api/candidato/${idCandidato}/perfil`);
      setPerfilAbierto(data);
    } catch (err: any) {
      mostrarToast(err?.message || "No se pudo cargar el perfil del candidato");
    } finally {
      setCargandoPerfil(false);
    }
  }

  function filtrarCandidatos() {
    return candidatos.filter((candidato) => {
      const nombreCompleto = `${candidato.nombres} ${candidato.apellidos}`.toLowerCase();
      const coincideNombre = nombreCompleto.includes(filtroBusqueda.toLowerCase());
      const coincideTitulo = candidato.tituloOferta.toLowerCase().includes(filtroBusqueda.toLowerCase());
      const coincideEstado = filtroEstado ? candidato.estado === filtroEstado : true;
      return (coincideNombre || coincideTitulo) && coincideEstado;
    });
  }

  return (
    <EmpresaShell pageTitle="Candidatos" pageSubtitle="Explora y gestiona los candidatos que se han postulado a tus ofertas">
      {/* Tabs por estado */}
      <div className="misofertas-tabs" style={{ marginBottom: 18 }}>
        <button className={"misofertas-tab" + (filtroEstado === "" ? " active" : "")} onClick={() => setFiltroEstado("")}>
          <strong>Todos {candidatos.length}</strong>
        </button>
        <button className={"misofertas-tab" + (filtroEstado === "En revisión" ? " active" : "")} onClick={() => setFiltroEstado("En revisión")}>
          <strong>En revisión</strong>
        </button>
        <button className={"misofertas-tab" + (filtroEstado === "Entrevista" ? " active" : "")} onClick={() => setFiltroEstado("Entrevista")}>
          <strong>Entrevista</strong>
        </button>
        <button className={"misofertas-tab" + (filtroEstado === "Preseleccionado" ? " active" : "")} onClick={() => setFiltroEstado("Preseleccionado")}>
          <strong>Preseleccionados</strong>
        </button>
        <button className={"misofertas-tab" + (filtroEstado === "Rechazado" ? " active" : "")} onClick={() => setFiltroEstado("Rechazado")}>
          <strong>Rechazados</strong>
        </button>
      </div>

      {/* Filtros */}
      <div className="vacantes-filters">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Buscar candidato u oferta..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="6"/><path d="M17 17l-4-4"/></svg>
        </div>
        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Estado</option>
          <option value="En revisión">En revisión</option>
          <option value="Entrevista">Entrevista</option>
          <option value="Preseleccionado">Preseleccionado</option>
          <option value="Contratado">Contratado</option>
          <option value="Rechazado">Rechazado</option>
        </select>
      </div>

      {/* Lista */}
      <div className="candidatos-table-card">
        <div className="candidatos-body">
          {cargando ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>Cargando candidatos...</p>
          ) : filtrarCandidatos().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>No hay candidatos que coincidan.</p>
          ) : (
            filtrarCandidatos().map((candidato) => (
              <div className="candidato-row" key={candidato.idPostulacion}>
                <div
                  className="candidato-avatar avatar-blue"
                  style={{ overflow: "hidden", padding: 0, background: candidato.fotoUrl ? "transparent" : "#3B8EE8" }}
                >
                  {candidato.fotoUrl ? (
                    <img
                      src={candidato.fotoUrl}
                      alt={`${candidato.nombres} ${candidato.apellidos}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                    />
                  ) : (
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                      {candidato.nombres.charAt(0)}{candidato.apellidos.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="candidato-info">
                  <h4>{candidato.nombres} {candidato.apellidos}</h4>
                  <p>{candidato.correo}</p>
                  <div className="tag-row">
                    <span className="tag">{candidato.telefono || "Sin teléfono"}</span>
                  </div>
                </div>
                <div className="candidato-offer">
                  <strong>{candidato.tituloOferta}</strong>
                  <span>Postulado el {new Date(candidato.fechaPostulacion).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2D6CDF", minWidth: 100 }}>
                  {candidato.estado}
                </div>
                <select
                  className="candidato-estado-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) cambiarEstadoCandidato(candidato.idPostulacion, e.target.value);
                  }}
                >
                  <option value="">Cambiar estado</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Preseleccionado">Preseleccionado</option>
                  <option value="Contratado">Contratado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
                <button
                  className="btn-solid-sm candidato-ver-perfil"
                  onClick={() => verPerfil(candidato.idCandidato)}
                >
                  Ver perfil
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 👇 MODAL con el perfil del candidato */}
      {perfilAbierto && (
        <ModalPerfilCandidato
          perfil={perfilAbierto}
          onCerrar={() => setPerfilAbierto(null)}
        />
      )}

      {/* Loader mientras se carga el perfil */}
      {cargandoPerfil && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 300, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>Cargando perfil...</p>
          </div>
        </div>
      )}

      {toast && <div className="sw-toast show">{toast}</div>}
    </EmpresaShell>
  );
}

// ============================================================
// MODAL: Perfil del candidato
// ============================================================
function ModalPerfilCandidato({
  perfil,
  onCerrar,
}: {
  perfil: PerfilCandidato;
  onCerrar: () => void;
}) {
  const nombreCompleto = `${perfil.nombres} ${perfil.apellidos}`.trim();
  const iniciales = `${perfil.nombres.charAt(0)}${perfil.apellidos.charAt(0)}`.toUpperCase();

  return (
    <div style={overlayStyle} onClick={onCerrar}>
      <div style={{ ...modalStyle, maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Perfil del candidato</h3>
          <button onClick={onCerrar} style={closeButtonStyle}>×</button>
        </div>

        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          {/* Foto + info principal */}
          <div style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "flex-start" }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 14,
                background: perfil.fotoUrl ? "transparent" : "linear-gradient(160deg, #E4EEFC, #C4D3F6)",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {perfil.fotoUrl ? (
                <img
                  src={perfil.fotoUrl}
                  alt={nombreCompleto}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 700, color: "#35509E" }}>
                  {iniciales}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{nombreCompleto}</h2>
              <p style={{ margin: "0 0 14px", color: "#2D6CDF", fontSize: 13.5, fontWeight: 600 }}>
                {perfil.tituloProfesional || "Sin título profesional"}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {perfil.correo && (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#475467" }}>
                    <svg viewBox="0 0 20 20" style={{ width: 15, height: 15, stroke: "#667085", fill: "none", strokeWidth: 1.6 }}>
                      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
                      <path d="M3 5.5l7 5.5 7-5.5" />
                    </svg>
                    {perfil.correo}
                  </span>
                )}
                {perfil.telefono && (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#475467" }}>
                    <svg viewBox="0 0 20 20" style={{ width: 15, height: 15, stroke: "#667085", fill: "none", strokeWidth: 1.6 }}>
                      <path d="M4 3.5h3l1.5 3.5-2 1.5a10 10 0 005 5l1.5-2 3.5 1.5v3a1 1 0 01-1 1A12.5 12.5 0 013 4.5a1 1 0 011-1z" />
                    </svg>
                    {perfil.telefono}
                  </span>
                )}
                {perfil.ciudad && (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#475467" }}>
                    <svg viewBox="0 0 20 20" style={{ width: 15, height: 15, stroke: "#667085", fill: "none", strokeWidth: 1.6 }}>
                      <path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 004.5 8c0 4 5.5 9 5.5 9z" />
                      <circle cx="10" cy="8" r="1.8" />
                    </svg>
                    {perfil.ciudad}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sobre mí */}
          {perfil.about && (
            <Seccion titulo="Sobre mí">
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#475467" }}>{perfil.about}</p>
            </Seccion>
          )}

          {/* Habilidades */}
          {perfil.habilidades.length > 0 && (
            <Seccion titulo="Habilidades">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {perfil.habilidades.map((h) => (
                  <span
                    key={h.idHabilidad}
                    style={{
                      background: "#E4EEFC",
                      color: "#1B4FBA",
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {h.nombre}
                  </span>
                ))}
              </div>
            </Seccion>
          )}

          {/* Educación */}
          {perfil.educacion.length > 0 && (
            <Seccion titulo="Educación">
              {perfil.educacion.map((e) => (
                <div key={e.idEducacion} style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 14, display: "block" }}>{e.titulo}</strong>
                  {e.institucion && <span style={{ fontSize: 13, color: "#667085" }}>{e.institucion}</span>}
                  {e.anio && <span style={{ fontSize: 12.5, color: "#98A2B3", display: "block" }}>{e.anio}</span>}
                </div>
              ))}
            </Seccion>
          )}

          {/* Experiencia */}
          {perfil.experiencia.length > 0 && (
            <Seccion titulo="Experiencia / Proyectos">
              {perfil.experiencia.map((e) => (
                <div key={e.idProyecto} style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 14, display: "block" }}>{e.titulo}</strong>
                  {e.meta && <span style={{ fontSize: 13, color: "#2D6CDF", fontWeight: 500 }}>{e.meta}</span>}
                  {e.descripcion && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667085" }}>{e.descripcion}</p>}
                </div>
              ))}
            </Seccion>
          )}

          {/* Idiomas */}
          {perfil.idiomas.length > 0 && (
            <Seccion titulo="Idiomas">
              {perfil.idiomas.map((i) => (
                <p key={i.idIdioma} style={{ margin: "4px 0", fontSize: 13.5 }}>
                  🌐 {i.descripcion}
                </p>
              ))}
            </Seccion>
          )}

          {/* Referencias */}
          {perfil.referencias && perfil.referencias.length > 0 && (
            <Seccion titulo="Referencias">
              {perfil.referencias.map((r) => (
                <div key={r.idReferencia} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 13.5, display: "block" }}>{r.nombre}</strong>
                  {r.cargo && <span style={{ fontSize: 13, color: "#667085" }}>{r.cargo}</span>}
                  {r.contacto && <span style={{ fontSize: 12.5, color: "#98A2B3", display: "block" }}>{r.contacto}</span>}
                </div>
              ))}
            </Seccion>
          )}

          {/* Secciones personalizadas */}
          {perfil.secciones && perfil.secciones.length > 0 && (
            <>
              {perfil.secciones.map((s) => (
                <Seccion key={s.idSeccion} titulo={s.titulo}>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#475467" }}>
                    {s.contenido || "—"}
                  </p>
                </Seccion>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid #E6E9EF" }}>
          <button type="button" className="btn-empresa-outline" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Subcomponente Sección
// ============================================================
function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4
        style={{
          margin: "0 0 10px",
          fontSize: 12.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          color: "#667085",
        }}
      >
        {titulo}
      </h4>
      {children}
    </div>
  );
}

// ============================================================
// Estilos del modal
// ============================================================
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  width: "100%",
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 26,
  cursor: "pointer",
  color: "#667085",
  padding: 0,
  lineHeight: 1,
};