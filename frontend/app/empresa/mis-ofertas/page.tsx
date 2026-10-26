"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";

type Oferta = {
  idOferta: number;
  titulo: string;
  ciudad: string;
  modalidad: string;
  estado: string;
  empresa: string;
  categoria?: string;
  fechaPublicacion?: string;
  totalPostulaciones?: number;  
};

type OfertaEditable = {
  idOferta: number;
  titulo: string;
  descripcion: string;
  ciudad: string;
  modalidad: string;
};

type ConteoEstados = {
  total: number;
  activas: number;
  en_revision: number;
  pausadas: number;
  cerradas: number;
  rechazadas: number;  // ⬅️ NUEVO
};

export default function MisOfertasEmpresaPage() {
  const { user, cargando: cargandoAuth } = useAuth();

  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [conteo, setConteo] = useState<ConteoEstados | null>(null);
  const [cargando, setCargando] = useState(true);

  const [crearNueva, setCrearNueva] = useState(false);
  const [tabActivo, setTabActivo] = useState<string>("todas");

  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroArea, setFiltroArea] = useState("");

  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [ofertaEditar, setOfertaEditar] = useState<OfertaEditable | null>(null);
  const [formEdicion, setFormEdicion] = useState({
    titulo: "",
    descripcion: "",
    ciudad: "",
    modalidad: "",
  });

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    ciudad: "Medellín",
    modalidad: "Híbrido",
    categoria: "Desarrollo de Software",  // ⬅️ AÑADIR
    tipoContrato: "Término Indefinido",   // ⬅️ AÑADIR
    jornada: "Tiempo Completo"            // ⬅️ AÑADIR
  });

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function recargar() {
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) return;

    try {
      const [ofertasData, conteoData] = await Promise.all([
        apiFetch<Oferta[]>(`/api/empresa/${user.idEmpresa}/ofertas`),
        apiFetch<ConteoEstados>(`/api/empresa/${user.idEmpresa}/ofertas/estados`),
      ]);
      if (Array.isArray(ofertasData)) setOfertas(ofertasData);
      setConteo(conteoData);
    } catch (err) {
      console.error("Error recargando ofertas:", err);
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

  function filtrarOfertas() {
    return ofertas.filter((oferta) => {
      const coincideTitulo = oferta.titulo.toLowerCase().includes(filtroTitulo.toLowerCase());
      const coincideModalidad = filtroModalidad ? oferta.modalidad === filtroModalidad : true;
      const coincideEstado = filtroEstado ? oferta.estado === filtroEstado : true;
      const coincideArea = filtroArea ? oferta.categoria === filtroArea : true;

      let coincideTab = true;
      if (tabActivo === "todas") coincideTab = true;
      if (tabActivo === "activas") coincideTab = oferta.estado === "Publicada";
      if (tabActivo === "en_revision") coincideTab = oferta.estado === "Por aprobar";
      if (tabActivo === "pausadas") coincideTab = oferta.estado === "Pausada";
      if (tabActivo === "cerradas") coincideTab = oferta.estado === "Cerrada";
      if (tabActivo === "rechazadas") coincideTab = oferta.estado === "Rechazada";  // ⬅️ NUEVO

      return coincideTitulo && coincideModalidad && coincideEstado && coincideArea && coincideTab;
    });
  }

  async function cambiarEstado(idOferta: number, nuevoEstado: string) {
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
    setMenuAbierto(null);
  }

  async function abrirEdicion(idOferta: number) {
    setMenuAbierto(null);
    try {
      const resp = await apiFetch<OfertaEditable>(`/api/ofertas/${idOferta}`);
      setOfertaEditar(resp);
      setFormEdicion({
        titulo: resp.titulo,
        descripcion: resp.descripcion,
        ciudad: resp.ciudad,
        modalidad: resp.modalidad,
      });
      setEditando(true);
    } catch (err: any) {
      mostrarToast(err?.message || "Error al cargar la oferta");
    }
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!ofertaEditar) return;

    try {
      await apiFetch(`/api/ofertas/${ofertaEditar.idOferta}`, {
        method: "PUT",
        body: {
          titulo: formEdicion.titulo?.trim() || undefined,
          descripcion: formEdicion.descripcion?.trim() || undefined,
          ciudad: formEdicion.ciudad?.trim() || undefined,
          modalidad: formEdicion.modalidad || undefined,
        },
      });
      setEditando(false);
      mostrarToast("Oferta actualizada");
      await recargar();
    } catch (err: any) {
      mostrarToast(err?.message || "Error al actualizar la oferta");
    }
  }

    async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/api/ofertas`, {
        method: "POST",
        body: {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          ciudad: form.ciudad.trim(),
          modalidad: form.modalidad,
          categoria: form.categoria,       // ⬅️ AÑADIR
          tipoContrato: form.tipoContrato, // ⬅️ AÑADIR
          jornada: form.jornada            // ⬅️ AÑADIR
        },
      });
      setCrearNueva(false);
      setForm({ titulo: "", descripcion: "", ciudad: "Medellín", modalidad: "Híbrido", categoria: "Desarrollo de Software", tipoContrato: "Término Indefinido", jornada: "Tiempo Completo" });
      mostrarToast("Oferta creada");
      await recargar();
    } catch (err: any) {
      mostrarToast(err?.message || "Error al crear la oferta");
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
    <EmpresaShell pageTitle="Mis ofertas" pageSubtitle="Gestiona las ofertas que has publicado">
      <div className="misofertas-toolbar-row">
        <div className="misofertas-tabs">
          <button className={"misofertas-tab" + (tabActivo === "todas" ? " active" : "")} onClick={() => setTabActivo("todas")}>
            <strong>Todas {conteo?.total ?? 0}</strong>
          </button>
          <button className={"misofertas-tab" + (tabActivo === "activas" ? " active" : "")} onClick={() => setTabActivo("activas")}>
            <strong>Activas {conteo?.activas ?? 0}</strong>
          </button>
          <button className={"misofertas-tab" + (tabActivo === "en_revision" ? " active" : "")} onClick={() => setTabActivo("en_revision")}>
            <strong>En revisión {conteo?.en_revision ?? 0}</strong>
          </button>
          <button className={"misofertas-tab" + (tabActivo === "pausadas" ? " active" : "")} onClick={() => setTabActivo("pausadas")}>
            <strong>Pausadas {conteo?.pausadas ?? 0}</strong>
          </button>
            <button className={"misofertas-tab" + (tabActivo === "cerradas" ? " active" : "")} onClick={() => setTabActivo("cerradas")}>
            <strong>Cerradas {conteo?.cerradas ?? 0}</strong>
          </button>
          <button className={"misofertas-tab" + (tabActivo === "rechazadas" ? " active" : "")} onClick={() => setTabActivo("rechazadas")}>
            <strong>Rechazadas {conteo?.rechazadas ?? 0}</strong>
          </button>
        </div>
        <button className="btn-empresa-solid" onClick={() => setCrearNueva(true)}>
          <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>
          Nueva oferta
        </button>
      </div>

      {/* Filtros */}
      <div className="vacantes-filters" style={{ marginBottom: 16 }}>
        <div className="search-input-wrap">
          <input type="text" placeholder="Buscar ofertas" value={filtroTitulo} onChange={(e) => setFiltroTitulo(e.target.value)} />
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="6"/><path d="M17 17l-4-4"/></svg>
        </div>
        <select className="filter-select" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
          <option value="">Área</option>
          <option value="Tecnología">Tecnología</option>
          <option value="Administración">Administración</option>
          <option value="Marketing">Marketing</option>
          <option value="Ventas">Ventas</option>
          <option value="Recursos Humanos">Recursos Humanos</option>
        </select>
        <select className="filter-select" value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)}>
          <option value="">Modalidad</option>
          <option value="Presencial">Presencial</option>
          <option value="Remoto">Remoto</option>
          <option value="Híbrido">Híbrido</option>
        </select>
        <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Estado</option>
          <option value="Activa">Activa</option>
          <option value="Pausada">Pausada</option>
          <option value="Cerrada">Cerrada</option>
        </select>
      </div>

      {/* Formulario crear */}
            {/* Formulario crear */}
      {crearNueva && (
        <form 
          onSubmit={handleCreate} 
          style={{ 
            background: "var(--white)",      // ⬅️ Usar variable
            border: "1px solid var(--line)", // ⬅️ Usar variable
            borderRadius: 14, 
            padding: 20, 
            marginBottom: 20,
            color: "var(--ink)"              // ⬅️ Asegurar que el texto se vea
          }}
        >
          <h3 style={{ marginTop: 0, color: "var(--ink)" }}>Nueva Oferta</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="text" placeholder="Título de la oferta" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required style={inputStyle} />
            <input type="text" placeholder="Ciudad" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} required style={inputStyle} />
          </div>
          
          <div style={{ marginTop: 12 }}>
            <textarea placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          
          <div style={{ marginTop: 12 }}>
            <select value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value })} style={inputStyle}>
              <option value="Híbrido">Híbrido</option>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
            </select>
          </div>
          
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn-empresa-solid">Crear oferta</button>
            <button type="button" className="btn-empresa-outline" onClick={() => setCrearNueva(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="misofertas-table-card">
        <div className="misofertas-header-row" style={{ display: "grid", gridTemplateColumns: "2.3fr 0.9fr 1.2fr 1fr 1fr 1fr 0.6fr" }}>
          <span>Oferta</span><span>Área</span><span>Modalidad</span><span>Postulaciones</span><span>Estado</span><span>Publicada</span><span>Acciones</span>
        </div>
        <div className="misofertas-body">
          {cargando ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>Cargando ofertas...</p>
          ) : filtrarOfertas().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>No hay ofertas para mostrar.</p>
          ) : (
            filtrarOfertas().map((oferta) => (
              <div className="misofertas-row" key={oferta.idOferta} style={{ display: "grid", gridTemplateColumns: "2.3fr 0.9fr 1.2fr 1fr 1fr 1fr 0.6fr" }}>
                <div className="misofertas-offer-cell" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div className="misofertas-avatar">DM</div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{oferta.titulo}</h4>
                    <p style={{ margin: "2px 0 8px", fontSize: 12.5, color: "#667085" }}>{oferta.empresa}</p>
                    <span className="tag tag-blue-soft">Sin experiencia</span>
                  </div>
                </div>
                <div className="misofertas-area">{oferta.categoria || "Tecnología"}</div>
                <div className="misofertas-modalidad">
                  <div className="misofertas-modalidad-top">
                    <svg viewBox="0 0 20 20"><rect x="3.5" y="4" width="13" height="12" rx="1.5"/><path d="M3.5 8h13M7 2.5v3M13 2.5v3"/></svg>
                    <span>{oferta.modalidad}</span>
                  </div>
                  <div className="misofertas-modalidad-sub">{oferta.ciudad} - Colombia</div>
                </div>
                <div className="misofertas-postulaciones">
                  {oferta.totalPostulaciones ?? 0}
                </div>
                <div className="misofertas-status-pill">{oferta.estado || "Publicada"}</div>
                <div className="misofertas-publicada">
                  {oferta.fechaPublicacion ? new Date(oferta.fechaPublicacion).toLocaleDateString() : "—"}
                </div>
                                <div className="misofertas-actions-btn" style={{ position: "relative" }}>
                  <button 
                    onClick={() => setMenuAbierto(menuAbierto === oferta.idOferta ? null : oferta.idOferta)} 
                    style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 18, color: "var(--muted)", cursor: "pointer", padding: "2px 10px" }}
                  >
                    ...
                  </button>
                  {menuAbierto === oferta.idOferta && (
                  <div style={{ position: "absolute", right: 0, bottom: "100%", marginBottom: 8, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", padding: 8, zIndex: 10, width: 170 }}>
                    {/* Editar: mientras no esté Cerrada/Rechazada */}
                    {(oferta.estado === "Publicada" || oferta.estado === "Pausada" || oferta.estado === "Por aprobar") && (
                      <button onClick={() => abrirEdicion(oferta.idOferta)}
                        style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                      >Editar</button>
                    )}

                    {/* Pausar: solo si está Publicada */}
                    {oferta.estado === "Publicada" && (
                      <button
                        onClick={() => cambiarEstado(oferta.idOferta, "Pausada")}
                        style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                      >
                        Pausar
                      </button>
                    )}

                    {/* Cerrar: si está Publicada o Pausada */}
                    {(oferta.estado === "Publicada" || oferta.estado === "Pausada") && (
                      <button
                        onClick={() => cambiarEstado(oferta.idOferta, "Cerrada")}
                        style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#D0402F", cursor: "pointer", textAlign: "left" }}
                      >
                        Cerrar oferta
                      </button>
                    )}

                    {/* Por aprobar / Rechazada / Cerrada: solo lectura */}
                    {(oferta.estado === "Por aprobar" || oferta.estado === "Rechazada" || oferta.estado === "Cerrada") && (
                      <p style={{ margin: 0, padding: "8px 12px", fontSize: 12.5, color: "var(--muted)", fontStyle: "italic" }}>
                        {oferta.estado === "Por aprobar"
                          ? "En revisión por el administrador"
                          : oferta.estado === "Rechazada"
                          ? "Rechazada por el administrador"
                          : "Oferta cerrada"}
                      </p>
                    )}
                  </div>
                )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de edición */}
            {editando && ofertaEditar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--white)", color: "var(--ink)", borderRadius: 16, padding: 24, width: "90%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Editar Oferta</h3>
              <button onClick={() => setEditando(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--muted)" }}>×</button>
            </div>
            <form onSubmit={guardarEdicion}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input type="text" placeholder="Título" value={formEdicion.titulo} onChange={(e) => setFormEdicion({ ...formEdicion, titulo: e.target.value })} required style={inputStyle} />
                <input type="text" placeholder="Ciudad" value={formEdicion.ciudad} onChange={(e) => setFormEdicion({ ...formEdicion, ciudad: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ marginTop: 12 }}>
                <textarea placeholder="Descripción" value={formEdicion.descripcion} onChange={(e) => setFormEdicion({ ...formEdicion, descripcion: e.target.value })} required rows={4} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ marginTop: 12 }}>
                <select value={formEdicion.modalidad} onChange={(e) => setFormEdicion({ ...formEdicion, modalidad: e.target.value })} style={inputStyle}>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="submit" className="btn-empresa-solid">Guardar cambios</button>
                <button type="button" className="btn-empresa-outline" onClick={() => setEditando(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="sw-toast show">{toast}</div>}
    </EmpresaShell>
  );
}