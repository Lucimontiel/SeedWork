"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";

// ============================================================
// Tipos
// ============================================================
type Empresa = {
  idEmpresa: number;
  nombreEmpresa: string;
  correo: string;
  nit: string;
  sector?: string;
  ciudad?: string;
  telefono?: string;
  descripcion?: string;
  logoUrl?: string | null;
  mision?: string;
  vision?: string;
  sitioweb?: string;
  correoCorporativo?: string;
  especialidades?: string;
  anioFundacion?: number;
  direccion?: string;
};

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

type Oferta = {
  idOferta: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  categoria: string;
  estado: string;
  fechaPublicacion?: string;
};

type OfertaDetalle = {
  idOferta: number;
  titulo: string;
  descripcion: string;
  ciudad: string;
  modalidad: string;
};

type PerfilCandidato = {
  idCandidato: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  ciudad?: string;
  tituloProfesional?: string;
  about?: string;
  fotoUrl?: string;
  habilidades: { idHabilidad: number; nombre: string }[];
  educacion: { idEducacion: number; titulo: string; institucion?: string; anio?: string }[];
  experiencia: { idProyecto: number; titulo: string; descripcion?: string; meta?: string }[];
  idiomas: { idIdioma: number; descripcion: string }[];
};

// ============================================================
// Cálculo de perfil completado
// ============================================================
const CAMPOS_PERFIL = [
  "nombreEmpresa",
  "nit",
  "ciudad",
  "sector",
  "telefono",
  "descripcion",
  "logoUrl",
  "mision",
  "vision",
  "sitioweb",
] as const;

function calcularPerfilCompletado(empresa: Empresa | null): number {
  if (!empresa) return 0;

  const completados = CAMPOS_PERFIL.filter((campo) => {
    const valor = empresa[campo];
    return valor !== null && valor !== undefined && String(valor).trim() !== "";
  }).length;

  return Math.round((completados / CAMPOS_PERFIL.length) * 100);
}

function camposFaltantes(empresa: Empresa | null): string[] {
  if (!empresa) return [];

  const etiquetas: Record<(typeof CAMPOS_PERFIL)[number], string> = {
    nombreEmpresa: "Nombre",
    nit: "NIT",
    ciudad: "Ciudad",
    sector: "Sector",
    telefono: "Teléfono",
    descripcion: "Descripción",
    logoUrl: "Logo",
    mision: "Misión",
    vision: "Visión",
    sitioweb: "Sitio web",
  };

  return CAMPOS_PERFIL.filter((campo) => {
    const valor = empresa[campo];
    return valor === null || valor === undefined || String(valor).trim() === "";
  }).map((campo) => etiquetas[campo]);
}

// ============================================================
// Componente
// ============================================================
export default function InicioEmpresaPage() {
  const router = useRouter();
  const { user, cargando: cargandoAuth } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [modalNuevaOferta, setModalNuevaOferta] = useState(false);
  const [modalEditarOferta, setModalEditarOferta] = useState<OfertaDetalle | null>(null);
  const [modalCandidatosOferta, setModalCandidatosOferta] = useState<{ oferta: Oferta; candidatos: Candidato[] } | null>(null);
  const [modalPerfilCandidato, setModalPerfilCandidato] = useState<PerfilCandidato | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  // ============================================================
  // Protección
  // ============================================================
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

  // ============================================================
  // Carga de datos
  // ============================================================
  const recargar = useCallback(async () => {
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) return;

    try {
      const [empresaData, ofertasData, candidatosData] = await Promise.all([
        apiFetch<Empresa>(`/api/empresa/${user.idEmpresa}`),
        apiFetch<Oferta[]>(`/api/empresa/${user.idEmpresa}/ofertas`),
        apiFetch<Candidato[]>(`/api/empresa/${user.idEmpresa}/candidatos`),
      ]);
      setEmpresa(empresaData);
      if (Array.isArray(ofertasData)) setOfertas(ofertasData);
      if (Array.isArray(candidatosData)) setCandidatos(candidatosData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    }
  }, [user]);

  useEffect(() => {
    if (cargandoAuth) return;
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) {
      setCargando(false);
      return;
    }
    setCargando(true);
    recargar().finally(() => setCargando(false));
  }, [user, cargandoAuth, recargar]);

  // ============================================================
  // Acciones
  // ============================================================
    async function crearOferta(form: { titulo: string; descripcion: string; ciudad: string; modalidad: string;
      categoria: string;tipoContrato: string;jornada: string;
  }) {
    try {
      await apiFetch("/api/ofertas", {
        method: "POST",
        body: {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          ciudad: form.ciudad.trim(),
          modalidad: form.modalidad,
          categoria: form.categoria,         // ⬅️ AÑADIDO
          tipoContrato: form.tipoContrato,   // ⬅️ AÑADIDO
          jornada: form.jornada              // ⬅️ AÑADIDO
        },
      });
      setModalNuevaOferta(false);
      mostrarToast("Oferta creada correctamente");
      await recargar();
    } catch (err: any) {
      mostrarToast(err?.message || "Error al crear la oferta");
    }
  }

  async function abrirEditarOferta(idOferta: number) {
    try {
      const detalle = await apiFetch<OfertaDetalle>(`/api/ofertas/${idOferta}`);
      setModalEditarOferta(detalle);
    } catch (err: any) {
      mostrarToast(err?.message || "Error al cargar la oferta");
    }
  }

  async function guardarEdicionOferta(form: OfertaDetalle) {
    try {
      await apiFetch(`/api/ofertas/${form.idOferta}`, {
        method: "PUT",
        body: {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          ciudad: form.ciudad.trim(),
          modalidad: form.modalidad,
        },
      });
      setModalEditarOferta(null);
      mostrarToast("Oferta actualizada");
      await recargar();
    } catch (err: any) {
      mostrarToast(err?.message || "Error al actualizar la oferta");
    }
  }

  async function verCandidatosDeOferta(oferta: Oferta) {
    try {
      const data = await apiFetch<Candidato[]>(`/api/empresa/ofertas/${oferta.idOferta}/candidatos`);
      setModalCandidatosOferta({
        oferta,
        candidatos: Array.isArray(data) ? data : [],
      });
    } catch (err: any) {
      mostrarToast(err?.message || "Error al cargar candidatos");
    }
  }

    async function verPerfilCandidato(idCandidato: number) {
    try {
      const data = await apiFetch<PerfilCandidato>(`/api/candidato/${idCandidato}/perfil`);
      setModalCandidatosOferta(null); // ⬅️ ESTO CIERRA EL MODAL ANTERIOR
      setModalPerfilCandidato(data);
    } catch (err: any) {
      mostrarToast(err?.message || "Error al cargar el perfil");
    }
  }

  async function cambiarEstadoOferta(idOferta: number, nuevoEstado: string) {
    try {
      await apiFetch(`/api/empresa/ofertas/${idOferta}/estado`, {
        method: "PATCH",
        body: { nuevoEstado },
      });
      mostrarToast(`Oferta marcada como ${nuevoEstado.toLowerCase()}`);
      await recargar();
    } catch (err: any) {
      mostrarToast(err?.message || "Error al cambiar estado");
    }
  }

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

  // ============================================================
  // Estados de carga
  // ============================================================
  if (cargandoAuth) {
    return (
      <EmpresaShell variant="busqueda">
        <p style={{ padding: 40, textAlign: "center" }}>Cargando...</p>
      </EmpresaShell>
    );
  }

  if (!user || user.tipo !== "empresa") {
    return null;
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <EmpresaShell variant="busqueda">
      {/* Banner de bienvenida */}
      <div className="empresa-welcome-card">
        <div className="empresa-welcome-main">
          <h1>¡Bienvenido a SeedWork, {empresa?.nombreEmpresa || "Empresa Demo"}!</h1>
          <p>Encuentra el talento perfecto para tu empresa.</p>
          <div className="empresa-welcome-actions">
            <button className="btn-empresa-solid" onClick={() => setModalNuevaOferta(true)}>
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
          <span className="empresa-completion-percent">
            {calcularPerfilCompletado(empresa)}%
          </span>
          <div className="empresa-completion-bar-bg">
            <div
              className="empresa-completion-bar-fill"
              style={{ width: `${calcularPerfilCompletado(empresa)}%` }}
            ></div>
          </div>
          {camposFaltantes(empresa).length > 0 && (
            <span
              style={{
                fontSize: 11.5,
                color: "#667085",
                marginTop: 6,
                lineHeight: 1.4,
              }}
            >
              Te falta: {camposFaltantes(empresa).join(", ")}
            </span>
          )}
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
        <button className="action-card" onClick={() => setModalNuevaOferta(true)}>
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

      {/* Mis ofertas recientes */}
      <h2 className="section-title">Mis ofertas recientes</h2>
      <div className="empresa-offer-list">
        {cargando ? (
          <p style={{ fontSize: 14, color: "#667085" }}>Cargando ofertas...</p>
        ) : ofertas.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085" }}>No tienes ofertas publicadas todavía. ¡Crea la primera!</p>
        ) : (
          ofertas.slice(0, 5).map((oferta) => (
            <div className="empresa-offer-card" key={oferta.idOferta}>
              <div className="empresa-offer-icon icon-blue-soft">
                <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>
              </div>
              <div className="empresa-offer-info">
                <h4>{oferta.titulo}</h4>
                <p>{oferta.ciudad} · {oferta.modalidad} · {oferta.estado}</p>
              </div>
              <div className={"empresa-offer-status " + (oferta.estado === "Publicada" ? "active" : "")}>
                <span className="status-pill">{oferta.estado}</span>
              </div>
              <div className="empresa-offer-actions">
                <button className="btn-solid-sm" onClick={() => verCandidatosDeOferta(oferta)}>
                  Candidatos
                </button>
                <button className="btn-outline-sm" onClick={() => abrirEditarOferta(oferta.idOferta)}>
                  Editar
                </button>
                {oferta.estado === "Publicada" && (
                <select
                  className="empresa-status-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) cambiarEstadoOferta(oferta.idOferta, e.target.value);
                  }}
                >
                  <option value="">Cambiar estado</option>
                  <option value="Pausada">Pausar</option>
                  <option value="Cerrada">Cerrar</option>
                </select>
              )}

              {oferta.estado === "Pausada" && (
                <select
                  className="empresa-status-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) cambiarEstadoOferta(oferta.idOferta, e.target.value);
                  }}
                >
                  <option value="">Cambiar estado</option>
                  <option value="Cerrada">Cerrar</option>
                </select>
              )}
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
              <div
                className="empresa-candidate-avatar"
                style={{ overflow: "hidden", padding: 0, background: candidato.fotoUrl ? "transparent" : "#2D6CDF" }}
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
              <div className="empresa-candidate-info">
                <h4>{candidato.nombres} {candidato.apellidos}</h4>
                <p>{candidato.tituloOferta}</p>
                <div className="tag-row">
                  <span className="tag">{candidato.estado}</span>
                </div>
              </div>
              <div className="empresa-candidate-actions">
                <button className="btn-outline-sm" onClick={() => verPerfilCandidato(candidato.idCandidato)}>
                  Ver perfil
                </button>
                <select
                  className="empresa-status-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) cambiarEstadoCandidato(candidato.idPostulacion, e.target.value);
                  }}
                >
                  <option value="">Estado</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Preseleccionado">Preseleccionado</option>
                  <option value="Contratado">Contratado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALES */}
      {modalNuevaOferta && (
        <ModalNuevaOferta
          onCancel={() => setModalNuevaOferta(false)}
          onCrear={crearOferta}
        />
      )}

      {modalEditarOferta && (
        <ModalEditarOferta
          oferta={modalEditarOferta}
          onCancel={() => setModalEditarOferta(null)}
          onGuardar={guardarEdicionOferta}
        />
      )}

      {modalCandidatosOferta && (
        <ModalCandidatos
          oferta={modalCandidatosOferta.oferta}
          candidatos={modalCandidatosOferta.candidatos}
          onCerrar={() => setModalCandidatosOferta(null)}
          onVerPerfil={verPerfilCandidato}
        />
      )}

      {modalPerfilCandidato && (
        <ModalPerfilCandidato
          perfil={modalPerfilCandidato}
          onCerrar={() => setModalPerfilCandidato(null)}
        />
      )}

      {toast && <div className="sw-toast show">{toast}</div>}
    </EmpresaShell>
  );
}

// ============================================================
// MODAL: Nueva oferta
// ============================================================
function ModalNuevaOferta({
  onCancel,
  onCrear,
}: {
  onCancel: () => void;
  onCrear: (form: { 
    titulo: string; 
    descripcion: string; 
    ciudad: string; 
    modalidad: string;
    categoria: string;
    tipoContrato: string;
    jornada: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    ciudad: "Medellín",
    modalidad: "Híbrido",
    categoria: "Desarrollo de Software",
    tipoContrato: "Término Indefinido",
    jornada: "Tiempo Completo"
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      await onCrear(form);
    } catch (err: any) {
      setError(err?.message || "Error al crear la oferta");
    } finally {
      setGuardando(false);
    }
  }

    const inputStyle: React.CSSProperties = {
    border: "1px solid var(--line)", // ⬅️ Usar variable
    borderRadius: 8,
    padding: 10,
    fontFamily: "inherit",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
    background: "var(--white)",      // ⬅️ Cambiado
    color: "var(--ink)",             // ⬅️ Añadido
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Nueva Oferta</h3>
          <button onClick={onCancel} style={closeButtonStyle}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Título de la oferta"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          {/* FILA 1: Ciudad y Modalidad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              required
              style={inputStyle}
            />
            <select
              value={form.modalidad}
              onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
              style={inputStyle}
            >
              <option value="Híbrido">Híbrido</option>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
            </select>
          </div>

          {/* FILA 2: Categoría y Contrato (NUEVO) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              style={inputStyle}
            >
              <option value="Desarrollo de Software">Desarrollo de Software</option>
              <option value="Diseño Gráfico">Diseño Gráfico</option>
              <option value="Marketing">Marketing</option>
              <option value="Administración">Administración</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Ventas">Ventas</option>
            </select>
            <select
              value={form.tipoContrato}
              onChange={(e) => setForm({ ...form, tipoContrato: e.target.value })}
              style={inputStyle}
            >
              <option value="Término Indefinido">Término Indefinido</option>
              <option value="Término Fijo">Término Fijo</option>
              <option value="Prestación de Servicios">Prestación de Servicios</option>
            </select>
          </div>

          {/* FILA 3: Jornada (NUEVO) */}
          <div style={{ marginBottom: 12 }}>
            <select
              value={form.jornada}
              onChange={(e) => setForm({ ...form, jornada: e.target.value })}
              style={inputStyle}
            >
              <option value="Tiempo Completo">Tiempo Completo</option>
              <option value="Medio Tiempo">Medio Tiempo</option>
              <option value="Por Horas">Por Horas</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <textarea
              placeholder="Descripción de la oferta"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && <p style={{ color: "#dc3545", fontSize: 13 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" className="btn-empresa-outline" onClick={onCancel} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn-empresa-solid" disabled={guardando}>
              {guardando ? "Creando..." : "Crear oferta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: Editar oferta
// ============================================================
function ModalEditarOferta({
  oferta,
  onCancel,
  onGuardar,
}: {
  oferta: OfertaDetalle;
  onCancel: () => void;
  onGuardar: (form: OfertaDetalle) => Promise<void>;
}) {
  const [form, setForm] = useState<OfertaDetalle>(oferta);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(form);
    } catch (err: any) {
      setError(err?.message || "Error al actualizar la oferta");
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid #E6E9EF",
    borderRadius: 8,
    padding: 10,
    fontFamily: "inherit",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Editar Oferta</h3>
          <button onClick={onCancel} style={closeButtonStyle}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Título"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              required
              style={inputStyle}
            />
            <select
              value={form.modalidad}
              onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
              style={inputStyle}
            >
              <option value="Híbrido">Híbrido</option>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && <p style={{ color: "#dc3545", fontSize: 13 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" className="btn-empresa-outline" onClick={onCancel} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn-empresa-solid" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: Candidatos de una oferta
// ============================================================
function ModalCandidatos({
  oferta,
  candidatos,
  onCerrar,
  onVerPerfil,
}: {
  oferta: Oferta;
  candidatos: Candidato[];
  onCerrar: () => void;
  onVerPerfil: (idCandidato: number) => void;
}) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 640 }}>
        <div style={modalHeaderStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Candidatos postulados</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667085" }}>{oferta.titulo}</p>
          </div>
          <button onClick={onCerrar} style={closeButtonStyle}>×</button>
        </div>

        {candidatos.length === 0 ? (
          <p style={{ fontSize: 14, color: "#667085", padding: 20, textAlign: "center" }}>
            Aún no hay candidatos postulados a esta oferta.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
            {candidatos.map((c) => (
              <div
                key={c.idPostulacion}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "1px solid #E6E9EF",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: c.fotoUrl ? "transparent" : "#2D6CDF",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {c.fotoUrl ? (
                    <img
                      src={c.fotoUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <span>{c.nombres.charAt(0)}{c.apellidos.charAt(0)}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14, display: "block" }}>
                    {c.nombres} {c.apellidos}
                  </strong>
                  <span style={{ fontSize: 12.5, color: "#667085" }}>{c.correo}</span>
                  <div style={{ fontSize: 12, color: "#2D6CDF", marginTop: 2 }}>{c.estado}</div>
                </div>
                <button className="btn-outline-sm" onClick={() => onVerPerfil(c.idCandidato)}>
                  Ver perfil
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button type="button" className="btn-empresa-outline" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
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
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 640 }}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: 18 }}>
            {perfil.nombres} {perfil.apellidos}
          </h3>
          <button onClick={onCerrar} style={closeButtonStyle}>×</button>
        </div>

        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                background: perfil.fotoUrl ? "transparent" : "#E4EEFC",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {perfil.fotoUrl ? (
                <img src={perfil.fotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <svg viewBox="0 0 20 20" style={{ width: 40, height: 40, stroke: "#7C93C9", fill: "none", strokeWidth: 1.3 }}>
                  <circle cx="10" cy="7" r="3" />
                  <path d="M4 16c0-3 2.7-5 6-5s6 2 6 5" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, color: "#2D6CDF", fontWeight: 600 }}>
                {perfil.tituloProfesional || "Sin título profesional"}
              </p>
              {perfil.ciudad && <p style={{ margin: "2px 0", fontSize: 13, color: "#667085" }}>📍 {perfil.ciudad}</p>}
              {perfil.correo && <p style={{ margin: "2px 0", fontSize: 13, color: "#667085" }}>✉ {perfil.correo}</p>}
              {perfil.telefono && <p style={{ margin: "2px 0", fontSize: 13, color: "#667085" }}>☎ {perfil.telefono}</p>}
            </div>
          </div>

          {perfil.about && (
            <Section title="Sobre mí">
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#475467" }}>{perfil.about}</p>
            </Section>
          )}

          {perfil.habilidades.length > 0 && (
            <Section title="Habilidades">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {perfil.habilidades.map((h) => (
                  <span
                    key={h.idHabilidad}
                    style={{
                      background: "#E4EEFC",
                      color: "#1B4FBA",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    {h.nombre}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {perfil.educacion.length > 0 && (
            <Section title="Educación">
              {perfil.educacion.map((e) => (
                <div key={e.idEducacion} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 14 }}>{e.titulo}</strong>
                  {e.institucion && <p style={{ margin: "2px 0", fontSize: 13, color: "#667085" }}>{e.institucion}</p>}
                  {e.anio && <p style={{ margin: 0, fontSize: 12, color: "#98A2B3" }}>{e.anio}</p>}
                </div>
              ))}
            </Section>
          )}

          {perfil.experiencia.length > 0 && (
            <Section title="Experiencia / Proyectos">
              {perfil.experiencia.map((e) => (
                <div key={e.idProyecto} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 14 }}>{e.titulo}</strong>
                  {e.meta && <p style={{ margin: "2px 0", fontSize: 13, color: "#667085" }}>{e.meta}</p>}
                  {e.descripcion && <p style={{ margin: 0, fontSize: 13, color: "#667085" }}>{e.descripcion}</p>}
                </div>
              ))}
            </Section>
          )}

          {perfil.idiomas.length > 0 && (
            <Section title="Idiomas">
              {perfil.idiomas.map((i) => (
                <p key={i.idIdioma} style={{ margin: "4px 0", fontSize: 13.5 }}>
                  🌐 {i.descripcion}
                </p>
              ))}
            </Section>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button type="button" className="btn-empresa-outline" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Subcomponente Section
// ============================================================
function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
        {title}
      </h4>
      {children}
    </div>
  );
}

// ============================================================
// Estilos reutilizables de los modales
// ============================================================
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: "var(--white)", // ⬅️ Cambiado
  color: "var(--ink)",        // ⬅️ Añadido para que el texto sea visible
  borderRadius: 16,
  padding: 24,
  width: "100%",
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 16,
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  color: "var(--muted)",
  padding: 0,
  lineHeight: 1,
};