"use client";

import { useMemo, useState, useEffect, JSX } from "react";
import CandidatoShell from "../CandidatoShell";
import { useCandidato } from "../../lib/useCandidato";
import { API_BASE } from "../../lib/api";

interface Postulacion {
  idPostulacion: number;
  idOferta: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  estado: string;
  vista: boolean;
  fechaPostulacion: string;
}

type TabKey = "todas" | "postulado" | "vistas" | "proceso" | "cerradas";

function estadoVisual(p: Postulacion): { label: string; className: string } {
  if (p.estado === "Cerrada") return { label: "Cerrada", className: "closed" };
  if (p.estado === "En proceso") return { label: "En proceso", className: "in-progress" };
  if (p.vista) return { label: "Vista por la empresa", className: "viewed" };
  return { label: "Postulado", className: "" };
}

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_ICON: Record<string, JSX.Element> = {
  "in-progress": (
    <svg viewBox="0 0 20 20"><path d="M6 3.5h8M6 16.5h8" /><path d="M6.5 3.5v2.3c0 1.5 1.2 2.7 1.9 3.2.7.5.7 1.6 0 2.1-.7.5-1.9 1.7-1.9 3.2v2.2M13.5 3.5v2.3c0 1.5-1.2 2.7-1.9 3.2-.7.5-.7 1.6 0 2.1.7.5 1.9 1.7 1.9 3.2v2.2" /></svg>
  ),
  viewed: (
    <svg viewBox="0 0 20 20"><path d="M2 10s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5-8-5.5-8-5.5z" /><circle cx="10" cy="10" r="2" /></svg>
  ),
  closed: (
    <svg viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="7.5" rx="1.4" /><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" /></svg>
  ),
  "": (
    <svg viewBox="0 0 20 20"><rect x="3.5" y="4" width="13" height="12" rx="1.5" /><path d="M3.5 8h13M7 2.5v3M13 2.5v3" /></svg>
  ),
};

export default function PostulacionesPage() {
  const { candidato } = useCandidato();
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!candidato) return;
    fetch(`${API_BASE}/api/candidato/${candidato.idCandidato}/postulaciones`)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudieron cargar tus postulaciones");
        return r.json();
      })
      .then(setPostulaciones)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [candidato]);

  const conteos = useMemo(() => {
    const c = { postulado: 0, vistas: 0, proceso: 0, cerradas: 0 };
    for (const p of postulaciones) {
      const v = estadoVisual(p);
      if (v.className === "closed") c.cerradas++;
      else if (v.className === "in-progress") c.proceso++;
      else if (v.className === "viewed") c.vistas++;
      else c.postulado++;
    }
    return c;
  }, [postulaciones]);

  const visibles = useMemo(() => {
    let lista = postulaciones;
    if (tab !== "todas") {
      lista = lista.filter((p) => {
        const v = estadoVisual(p);
        if (tab === "cerradas") return v.className === "closed";
        if (tab === "proceso") return v.className === "in-progress";
        if (tab === "vistas") return v.className === "viewed";
        if (tab === "postulado") return v.className === "";
        return true;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      lista = lista.filter((p) => p.titulo.toLowerCase().includes(q) || p.empresa.toLowerCase().includes(q));
    }
    return lista;
  }, [postulaciones, tab, search]);

  const total = postulaciones.length || 1; // evita división por 0
  const pctPostulado = (conteos.postulado / total) * 100;
  const pctProceso = (conteos.proceso / total) * 100;
  const pctVistas = (conteos.vistas / total) * 100;
  const pctCerradas = (conteos.cerradas / total) * 100;

  const a = pctCerradas;
  const b = a + pctProceso;
  const cAcum = b + pctVistas;

  return (
    <CandidatoShell
      nombre={candidato ? `${candidato.nombres} ${candidato.apellidos}` : undefined}
      fotoUrl={candidato?.fotoUrl}
      pageTitle="Mis Postulaciones"
      pageSubtitle="Consulta el estado de las ofertas a las que te has postulado"
    >
      <div className="postulaciones-tabs">
        <button className={"postulaciones-tab" + (tab === "todas" ? " active" : "")} onClick={() => setTab("todas")}>
          Todas <strong>{postulaciones.length}</strong>
        </button>
        <button className={"postulaciones-tab tab-postulado" + (tab === "postulado" ? " active" : "")} onClick={() => setTab("postulado")}>
          Postulado <strong>{conteos.postulado}</strong>
        </button>
        <button className={"postulaciones-tab tab-vistas" + (tab === "vistas" ? " active" : "")} onClick={() => setTab("vistas")}>
          Vistas <strong>{conteos.vistas}</strong>
        </button>
        <button className={"postulaciones-tab tab-proceso" + (tab === "proceso" ? " active" : "")} onClick={() => setTab("proceso")}>
          En proceso <strong>{conteos.proceso}</strong>
        </button>
        <button className={"postulaciones-tab tab-cerradas" + (tab === "cerradas" ? " active" : "")} onClick={() => setTab("cerradas")}>
          Cerradas <strong>{conteos.cerradas}</strong>
        </button>
      </div>

      <div className="vacantes-filters">
        <div className="search-input-wrap">
          <input type="text" placeholder="Buscar oferta o empresa..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="6" /><path d="M17 17l-4-4" /></svg>
        </div>
        <button className="filter-select">Estado <svg viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" /></svg></button>
        <button className="filter-select">Área <svg viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" /></svg></button>
        <button className="filter-select">Modalidad <svg viewBox="0 0 20 20"><path d="M5 8l5 5 5-5" /></svg></button>
      </div>

      <div className="vacantes-layout">
        <div className="application-list" style={{ flex: 1, marginBottom: 0 }}>
          {loading && <p>Cargando tus postulaciones...</p>}
          {error && <p style={{ color: "#dc3545" }}>{error}</p>}
          {!loading && visibles.length === 0 && <p>No tienes postulaciones en esta categoría.</p>}

          {visibles.map((p) => {
            const v = estadoVisual(p);
            return (
              <div className="application-card" key={p.idPostulacion}>
                <div className="application-icon icon-blue">
                  <svg viewBox="0 0 20 20"><path d="M4 16V9M10 16V4M16 16v-6" /></svg>
                </div>
                <div className="application-info">
                  <h4>{p.titulo}</h4>
                  <p>{p.empresa}</p>
                  <div className="application-meta">
                    <span><svg viewBox="0 0 20 20"><path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 004.5 8c0 4 5.5 9 5.5 9z" /><circle cx="10" cy="8" r="1.8" /></svg>{p.ciudad}</span>
                    <span><svg viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="9.5" rx="1.4" /><path d="M7.5 6V4.8A1.3 1.3 0 018.8 3.5h2.4a1.3 1.3 0 011.3 1.3V6" /></svg>{p.modalidad}</span>
                    <span><svg viewBox="0 0 20 20"><rect x="3.5" y="4" width="13" height="12" rx="1.5" /><path d="M3.5 8h13M7 2.5v3M13 2.5v3" /></svg>Postulado el {fechaCorta(p.fechaPostulacion)}</span>
                  </div>
                </div>
                <div className="application-status">
                  <span className={"status-pill" + (v.className ? " " + v.className : "")}>
                    {STATUS_ICON[v.className]}
                    {v.label}
                  </span>
                </div>
                <div className="application-actions">
                  <button className="btn-outline-sm">Ver oferta</button>
                  <button className="btn-outline-sm">Ver empresa</button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="vacantes-sidebar" style={{ width: 250 }}>
          <h3 className="sidebar-title">Resumen de postulaciones</h3>

          <div className="summary-legend">
            <div className="summary-legend-item">
              <span className="legend-dot" style={{ background: "#F0A93F" }} />
              <span className="legend-label">Postulado</span>
              <span className="legend-value">{conteos.postulado}</span>
            </div>
            <div className="summary-legend-item">
              <span className="legend-dot" style={{ background: "#8CF0A4" }} />
              <span className="legend-label">En proceso</span>
              <span className="legend-value">{conteos.proceso}</span>
            </div>
            <div className="summary-legend-item">
              <span className="legend-dot" style={{ background: "#2D6CDF" }} />
              <span className="legend-label">Vistas</span>
              <span className="legend-value">{conteos.vistas}</span>
            </div>
            <div className="summary-legend-item">
              <span className="legend-dot" style={{ background: "#D6D6D6" }} />
              <span className="legend-label">Cerradas</span>
              <span className="legend-value">{conteos.cerradas}</span>
            </div>
          </div>

          <div
            className="donut-chart"
            style={{
              background: `conic-gradient(#D6D6D6 0% ${a}%, #8CF0A4 ${a}% ${b}%, #2D6CDF ${b}% ${cAcum}%, #F0A93F ${cAcum}% 100%)`,
            }}
          />
        </aside>
      </div>
    </CandidatoShell>
  );
}