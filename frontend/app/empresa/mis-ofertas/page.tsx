"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { getSession } from "../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type Oferta = {
  idOferta: number;
  titulo: string;
  ciudad: string;
  modalidad: string;
  estado: string;
  empresa: string;
  categoria?: string;
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
};

export default function MisOfertasEmpresaPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [conteo, setConteo] = useState<ConteoEstados | null>(null);
  const [crearNueva, setCrearNueva] = useState(false);
  const [tabActivo, setTabActivo] = useState<string>("todas");
  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);

  // Estados para el modal de edición
  const [editando, setEditando] = useState(false);
  const [ofertaEditar, setOfertaEditar] = useState<OfertaEditable | null>(null);
  const [formEdicion, setFormEdicion] = useState({
    titulo: "",
    descripcion: "",
    ciudad: "",
    modalidad: "",
  });

  useEffect(() => {
    const session = getSession();
    if (!session) return;

    fetch(`${API_BASE}/api/empresa/${session.id}/ofertas`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setOfertas(data);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/empresa/${session.id}/ofertas/estados`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setConteo)
      .catch(() => {});
  }, []);

  function filtrarOfertas() {
    return ofertas.filter((oferta) => {
      const coincideTitulo = oferta.titulo.toLowerCase().includes(filtroTitulo.toLowerCase());
      const coincideModalidad = filtroModalidad ? oferta.modalidad === filtroModalidad : true;
      const coincideEstado = filtroEstado ? oferta.estado === filtroEstado : true;
      const coincideArea = filtroArea ? oferta.categoria === filtroArea : true;

      let coincideTab = true;
      if (tabActivo === "todas") coincideTab = true;
      if (tabActivo === "activas") coincideTab = oferta.estado === "Publicada" || oferta.estado === "Activa";
      if (tabActivo === "en_revision") coincideTab = oferta.estado === "Por aprobar" || oferta.estado === "En revisión";
      if (tabActivo === "pausadas") coincideTab = oferta.estado === "Pausada";
      if (tabActivo === "cerradas") coincideTab = oferta.estado === "Cerrada";

      return coincideTitulo && coincideModalidad && coincideEstado && coincideArea && coincideTab;
    });
  }

  // Función para cambiar el estado
  async function cambiarEstado(idOferta: number, nuevoEstado: string) {
    const resp = await fetch(`${API_BASE}/api/empresa/ofertas/${idOferta}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevoEstado }),
    });

    if (resp.ok) {
      window.location.reload();
    } else {
      const data = await resp.json().catch(() => null);
      alert(data?.detail || "Error al cambiar estado");
    }
    setMenuAbierto(null);
  }

  // Función para abrir el modal de edición
  async function abrirEdicion(idOferta: number) {
    setMenuAbierto(null);
    const resp = await fetch(`${API_BASE}/api/ofertas/${idOferta}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    if (resp) {
      setOfertaEditar(resp);
      setFormEdicion({
        titulo: resp.titulo,
        descripcion: resp.descripcion,
        ciudad: resp.ciudad,
        modalidad: resp.modalidad,
      });
      setEditando(true);
    }
  }

  // Función para guardar la edición
  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!ofertaEditar) return;

    const resp = await fetch(`${API_BASE}/api/ofertas/${ofertaEditar.idOferta}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formEdicion),
    });

    if (resp.ok) {
      setEditando(false);
      window.location.reload();
    } else {
      const data = await resp.json().catch(() => null);
      alert(data?.detail || "Error al actualizar oferta");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const session = getSession();
    if (!session) return;

    setCrearNueva(false);

    const resp = await fetch(`${API_BASE}/api/ofertas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idEmpresa: session.id,
        titulo: form.titulo,
        descripcion: form.descripcion,
        ciudad: form.ciudad,
        modalidad: form.modalidad,
      }),
    });

    if (resp.ok) {
      window.location.reload();
    } else {
      const data = await resp.json().catch(() => null);
      alert(data?.detail || "Error al crear oferta");
    }
  }

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    ciudad: "Medellín",
    modalidad: "Híbrido",
  });

  return (
    <EmpresaShell pageTitle="Mis ofertas" pageSubtitle="Gestiona las ofertas que has publicado">
      <div className="misofertas-toolbar-row">
        <div className="misofertas-tabs">
          <button className="misofertas-tab active" onClick={() => setTabActivo("todas")}>
            <strong>Todas {conteo?.total ?? 0}</strong>
          </button>
          <button className="misofertas-tab" onClick={() => setTabActivo("activas")}>
            <strong>Activas {conteo?.activas ?? 0}</strong>
          </button>
          <button className="misofertas-tab" onClick={() => setTabActivo("en_revision")}>
            <strong>En revisión {conteo?.en_revision ?? 0}</strong>
          </button>
          <button className="misofertas-tab" onClick={() => setTabActivo("pausadas")}>
            <strong>Pausadas {conteo?.pausadas ?? 0}</strong>
          </button>
          <button className="misofertas-tab" onClick={() => setTabActivo("cerradas")}>
            <strong>Cerradas {conteo?.cerradas ?? 0}</strong>
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
          <input
            type="text"
            placeholder="Buscar ofertas"
            value={filtroTitulo}
            onChange={(e) => setFiltroTitulo(e.target.value)}
          />
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

      {/* Formulario para crear */}
      {crearNueva && (
        <form onSubmit={handleCreate} style={{ background: "#fff", border: "1px solid #E6E9EF", borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Nueva Oferta</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              type="text"
              placeholder="Título de la oferta"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
            <input
              type="text"
              placeholder="Ciudad"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              required
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
              rows={4}
              style={{ width: "100%", border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <select
              value={form.modalidad}
              onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
              style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
            >
              <option value="Híbrido">Híbrido</option>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
            </select>
          </div>
          <button type="submit" className="btn-empresa-solid" style={{ marginTop: 12 }}>
            Crear oferta
          </button>
        </form>
      )}

      {/* Tabla */}
      <div className="misofertas-table-card">
        <div className="misofertas-header-row" style={{ display: "grid", gridTemplateColumns: "2.3fr 0.9fr 1.2fr 1fr 1fr 1fr 0.6fr" }}>
          <span>Oferta</span>
          <span>Área</span>
          <span>Modalidad</span>
          <span>Postulaciones</span>
          <span>Estado</span>
          <span>Publicada</span>
          <span>Acciones</span>
        </div>
        <div className="misofertas-body">
          {filtrarOfertas().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", padding: 16 }}>No hay ofertas activas.</p>
          ) : (
            <>
              {filtrarOfertas().map((oferta) => (
                <div className="misofertas-row" key={oferta.idOferta} style={{ display: "grid", gridTemplateColumns: "2.3fr 0.9fr 1.2fr 1fr 1fr 1fr 0.6fr" }}>
                  <div className="misofertas-offer-cell" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div className="misofertas-avatar">DM</div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#101828" }}>{oferta.titulo}</h4>
                      <p style={{ margin: "2px 0 8px", fontSize: 12.5, color: "#667085" }}>{oferta.empresa}</p>
                      <span className="tag tag-blue-soft">Sin experiencia</span>
                      <span className="tag tag-blue-soft" style={{ marginLeft: 5 }}>Publicado por ti</span>
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
                  <div className="misofertas-postulaciones">28</div>
                  <div className="misofertas-status-pill">{oferta.estado || "Publicada"}</div>
                  <div className="misofertas-publicada">18/06/2026</div>
                  <div className="misofertas-actions-btn" style={{ position: "relative" }}>
                    <button
                      onClick={() => setMenuAbierto(menuAbierto === oferta.idOferta ? null : oferta.idOferta)}
                      style={{ background: "none", border: "none", fontSize: 18, color: "#667085", cursor: "pointer" }}
                    >
                      ...
                    </button>
                    {menuAbierto === oferta.idOferta && (
                      <div style={{ position: "absolute", right: 0, bottom: "100%", marginBottom: 8, background: "#fff", border: "1px solid #E6E9EF", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 8, zIndex: 10, width: 150 }}>
                        <button
                          onClick={() => abrirEdicion(oferta.idOferta)}
                          style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#101828", cursor: "pointer" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => cambiarEstado(oferta.idOferta, "Pausada")}
                          style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#101828", cursor: "pointer" }}
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => cambiarEstado(oferta.idOferta, "Cerrada")}
                          style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#D0402F", cursor: "pointer" }}
                        >
                          Cerrar
                        </button>
                        <button
                          onClick={() => cambiarEstado(oferta.idOferta, "Publicada")}
                          style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#2FA360", cursor: "pointer" }}
                        >
                          Publicar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "90%", maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Editar Oferta</h3>
              <button onClick={() => setEditando(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#667085" }}>
                ×
              </button>
            </div>
            <form onSubmit={guardarEdicion}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Título"
                  value={formEdicion.titulo}
                  onChange={(e) => setFormEdicion({ ...formEdicion, titulo: e.target.value })}
                  required
                  style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
                />
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={formEdicion.ciudad}
                  onChange={(e) => setFormEdicion({ ...formEdicion, ciudad: e.target.value })}
                  required
                  style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <textarea
                  placeholder="Descripción"
                  value={formEdicion.descripcion}
                  onChange={(e) => setFormEdicion({ ...formEdicion, descripcion: e.target.value })}
                  required
                  rows={4}
                  style={{ width: "100%", border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
                />
              </div>
              <div style={{ marginTop: 12 }}>
                <select
                  value={formEdicion.modalidad}
                  onChange={(e) => setFormEdicion({ ...formEdicion, modalidad: e.target.value })}
                  style={{ border: "1px solid #E6E9EF", borderRadius: 8, padding: 10 }}
                >
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </div>
              <button type="submit" className="btn-empresa-solid" style={{ marginTop: 12 }}>
                Guardar cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </EmpresaShell>
  );
}