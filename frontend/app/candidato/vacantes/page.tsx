"use client";

import { useCallback, useEffect, useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";

interface Oferta {
  idOferta: number;
  idEmpresa: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  categoria: string;
  tipoContrato: string;
  descripcion: string;
  experienciaMinima: number;
  fechaPublicacion: string;
}

interface Postulacion {
  idPostulacion: number;
  idOferta: number;
}

function avatarFromName(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function tiempoDesde(fechaISO: string) {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias <= 0) return "Publicada hoy";
  if (dias === 1) return "Publicada hace 1 día";
  return `Publicada hace ${dias} días`;
}

export default function VacantesPage() {
  const { user } = useAuth();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loadingOfertas, setLoadingOfertas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [searchCiudad, setSearchCiudad] = useState("");
  const [tab, setTab] = useState<"todas" | "guardadas">("todas");
  const [area, setArea] = useState("");
  const [modalidad, setModalidad] = useState("");

  const [aplicadas, setAplicadas] = useState<Set<number>>(new Set());
  const [guardadas, setGuardadas] = useState<Set<number>>(new Set());
  const [enviando, setEnviando] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);

  // Estados para el modal de reporte
  const [reporteOfertaId, setReporteOfertaId] = useState<number | null>(null);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const cargarOfertas = useCallback(async (q: string, ciudad: string) => {
    setLoadingOfertas(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (ciudad) params.set("ciudad", ciudad);
      if (modalidad) params.set("modalidad", modalidad);
      if (area) params.set("categoria", area);
      
      const data = await apiFetch<Oferta[]>(`/api/vacantes?${params.toString()}`);
      setOfertas(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingOfertas(false);
    }
  }, [modalidad, area]);

  useEffect(() => {
    cargarOfertas(search, searchCiudad);
  }, [cargarOfertas]); // Al montar o cambiar filtros select

  useEffect(() => {
    const t = setTimeout(() => cargarOfertas(search, searchCiudad), 400);
    return () => clearTimeout(t);
  }, [search, searchCiudad, cargarOfertas]);

  useEffect(() => {
    if (!user?.idCandidato) return;
    apiFetch<Postulacion[]>(`/api/candidato/${user.idCandidato}/postulaciones`)
      .then((data) => {
        setPostulaciones(data);
        setAplicadas(new Set(data.map((p) => p.idOferta)));
      })
      .catch(() => {});
  }, [user]);

  async function aplicar(idOferta: number) {
    if (!user?.idCandidato) return;
    setEnviando(idOferta);
    try {
      await apiFetch(`/api/postulaciones`, {
        method: "POST",
        body: { idOferta },
      });
      setAplicadas((prev) => new Set(prev).add(idOferta));
      mostrarToast("Tu postulación fue enviada");
    } catch (err: any) {
      mostrarToast(err.message);
    } finally {
      setEnviando(null);
    }
  }

  async function salirDeOferta(idOferta: number) {
    if (!user?.idCandidato) return;
    const postulacion = postulaciones.find((p) => p.idOferta === idOferta);
    if (!postulacion) {
      mostrarToast("No estás postulado a esta oferta");
      setMenuAbierto(null);
      return;
    }

    try {
      await apiFetch(`/api/postulaciones/${postulacion.idPostulacion}`, {
        method: "DELETE",
      });
      setAplicadas((prev) => {
        const next = new Set(prev);
        next.delete(idOferta);
        return next;
      });
      setPostulaciones((prev) => prev.filter((p) => p.idOferta !== idOferta));
      mostrarToast("Has salido de la oferta");
    } catch (err: any) {
      mostrarToast(err.message);
    } finally {
      setMenuAbierto(null);
    }
  }

  function toggleGuardada(idOferta: number) {
    setGuardadas((prev) => {
      const next = new Set(prev);
      if (next.has(idOferta)) {
        next.delete(idOferta);
        mostrarToast("Oferta eliminada de guardadas");
      } else {
        next.add(idOferta);
        mostrarToast("Oferta guardada (solo en este dispositivo)");
      }
      return next;
    });
  }

  function abrirModalReporte(idOferta: number) {
    setReporteOfertaId(idOferta);
    setMotivoReporte("");
    setMenuAbierto(null);
  }

  async function enviarReporte() {
    if (!reporteOfertaId || !motivoReporte.trim()) return;

    setEnviandoReporte(true);
    try {
      await apiFetch(`/api/reportes`, {
        method: "POST",
        body: {
          idOferta: reporteOfertaId,
          motivo: motivoReporte.trim(),
        },
      });
      mostrarToast("Oferta reportada correctamente al administrador");
      setReporteOfertaId(null);
      setMotivoReporte("");
    } catch (err: any) {
      mostrarToast(err.message || "No se pudo enviar el reporte");
    } finally {
      setEnviandoReporte(false);
    }
  }

  const listaVisible = tab === "guardadas" ? ofertas.filter((o) => guardadas.has(o.idOferta)) : ofertas;

  return (
    <CandidatoShell
      nombre={user?.correo}
      pageTitle="Vacantes"
      pageSubtitle="Oportunidades pensadas para ti"
    >
      {/* CONTENEDOR CENTRADO PARA BUSCADOR, FILTROS Y TABS */}
      <div className="vacantes-top-controls">
        
        {/* ⬇️ NUEVA FILA: BUSCADOR Y FILTROS ⬇️ */}
        <div className="search-row">
          
          {/* BUSCADOR PÍLDORA */}
          <div className="custom-search-bar">
            <div className="search-field">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <input
                type="text"
                placeholder="Cargo o categoría"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-field">
              <svg viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                placeholder="Lugar"
                value={searchCiudad}
                onChange={(e) => setSearchCiudad(e.target.value)}
              />
            </div>

            <button 
              className="search-submit-btn" 
              onClick={() => cargarOfertas(search, searchCiudad)}
              title="Buscar"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </div>

          {/* FILTROS SECUNDARIOS (Ahora al lado derecho) */}
          <div className="vacantes-filters">
            <select className="filter-select" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Todas las áreas</option>
              <option value="Desarrollo de Software">Desarrollo de Software</option>
              <option value="Diseño Gráfico">Diseño Gráfico</option>
              <option value="Marketing">Marketing</option>
              <option value="Administración">Administración</option>
              <option value="Ventas">Ventas</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
            </select>
            <select className="filter-select" value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
              <option value="">Todas las modalidades</option>
              <option value="Presencial">Presencial</option>
              <option value="Remoto">Remoto</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>

        </div>

        {/* 3. TABS (TODAS / GUARDADAS) */}
        <div className="vacantes-tabs">
          <button className={"vacantes-tab" + (tab === "todas" ? " active" : "")} onClick={() => setTab("todas")}>
            Todas <strong>{ofertas.length}</strong>
          </button>
          <button className={"vacantes-tab" + (tab === "guardadas" ? " active" : "")} onClick={() => setTab("guardadas")}>
            Guardadas <strong>{guardadas.size}</strong>
          </button>
        </div>
      </div>
      {/* FIN DEL CONTENEDOR */}

      <div className="vacantes-layout">
        <div className="vacantes-list">
          {loadingOfertas && <p>Cargando vacantes...</p>}
          {error && <p style={{ color: "#dc3545" }}>{error}</p>}
          {!loadingOfertas && listaVisible.length === 0 && <p>No hay vacantes que coincidan con tu búsqueda.</p>}

          {listaVisible.map((oferta) => {
            const yaAplico = aplicadas.has(oferta.idOferta);
            const guardada = guardadas.has(oferta.idOferta);
            return (
              <div className="opportunity-card" key={oferta.idOferta}>
                <div className="opportunity-avatar avatar-purple">{avatarFromName(oferta.empresa)}</div>
                <div className="opportunity-info">
                  <h4>{oferta.titulo}</h4>
                  <p>{oferta.empresa} - {oferta.ciudad}</p>
                  <span className="opportunity-desc">{oferta.descripcion}</span>
                  <div className="tag-row">
                    <span className="tag">{oferta.experienciaMinima === 0 ? "Sin experiencia" : `${oferta.experienciaMinima}+ años`}</span>
                    <span className="tag">{oferta.tipoContrato}</span>
                  </div>
                </div>
                <div className="opportunity-meta">
                  <span><svg viewBox="0 0 20 20"><path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 004.5 8c0 4 5.5 9 5.5 9z" /><circle cx="10" cy="8" r="1.8" /></svg>{oferta.ciudad}</span>
                  <span><svg viewBox="0 0 20 20"><rect x="3" y="6" width="14" height="9.5" rx="1.4" /><path d="M7.5 6V4.8A1.3 1.3 0 018.8 3.5h2.4a1.3 1.3 0 011.3 1.3V6" /></svg>{oferta.modalidad}</span>
                  <span><svg viewBox="0 0 20 20"><rect x="3.5" y="4" width="13" height="12" rx="1.5" /><path d="M3.5 8h13M7 2.5v3M13 2.5v3" /></svg>{tiempoDesde(oferta.fechaPublicacion)}</span>
                </div>
                <div className="opportunity-actions">
                  <div className="opportunity-actions-row">
                    <button className="btn-solid-sm" disabled={yaAplico || enviando === oferta.idOferta} onClick={() => aplicar(oferta.idOferta)}>
                      {yaAplico ? "Aplicado ✓" : enviando === oferta.idOferta ? "Enviando..." : "Aplicar"}
                    </button>
                    <button
                      className={"bookmark-btn" + (guardada ? " bookmark-btn-active" : "")}
                      aria-label="Guardar"
                      onClick={() => toggleGuardada(oferta.idOferta)}
                    >
                      <svg viewBox="0 0 20 20"><path d="M5 3.5h10v13l-5-3.2-5 3.2z" /></svg>
                    </button>
                  </div>

                  <div style={{ position: "relative" }}>
                    <button
                      style={{ background: "none", border: "none", fontSize: 18, color: "var(--muted)", cursor: "pointer", padding: "0 8px" }}
                      onClick={() => setMenuAbierto(menuAbierto === oferta.idOferta ? null : oferta.idOferta)}
                    >
                      ...
                    </button>
                    {menuAbierto === oferta.idOferta && (
                      <div style={{ position: "absolute", right: 0, bottom: "100%", marginBottom: 8, background: "var(--white)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 8, zIndex: 10, width: 180 }}>
                        <button onClick={() => abrirModalReporte(oferta.idOferta)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#D0402F", cursor: "pointer", textAlign: "left" }}>Reportar oferta</button>
                        <button onClick={() => salirDeOferta(oferta.idOferta)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>Salir de la oferta</button>
                        <button onClick={() => { toggleGuardada(oferta.idOferta); setMenuAbierto(null); }} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}>{guardada ? "Quitar de guardadas" : "Guardar oferta"}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="vacantes-sidebar">
          <h3 className="sidebar-title">Búsquedas guardadas</h3>
          <div className="saved-search-item">
            <div className="saved-search-icon"><svg viewBox="0 0 20 20"><path d="M10 2.5a5 5 0 00-3 9c.5.4.8 1 .8 1.6v1h4.4v-1c0-.6.3-1.2.8-1.6a5 5 0 00-3-9z" /></svg></div>
            <div className="saved-search-info"><strong>Desarrollo de software</strong><span>5 nuevas ofertas</span></div>
          </div>
          <a href="#" className="view-all-saved">Ver todas</a>
        </div>
      </div>

      {/* MODAL DE REPORTE DE OFERTA */}
      {reporteOfertaId !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }} onClick={() => !enviandoReporte && setReporteOfertaId(null)}>
          
          <div style={{
            background: "var(--white)", color: "var(--ink)", borderRadius: 16, 
            width: "100%", maxWidth: 450, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reportar oferta</h3>
              <button 
                onClick={() => setReporteOfertaId(null)} 
                disabled={enviandoReporte}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--muted)" }}
              >×</button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
              Cuéntanos por qué consideras que esta oferta es sospechosa o inapropiada. Nuestro equipo de moderación la revisará.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>Motivo del reporte</label>
              <textarea
                rows={4}
                placeholder="Ej. Piden dinero para aplicar, el salario es falso, la empresa no existe..."
                value={motivoReporte}
                onChange={(e) => setMotivoReporte(e.target.value)}
                autoFocus
                style={{
                  width: "100%", border: "1px solid var(--line)", background: "var(--white)",
                  color: "var(--ink)", borderRadius: 8, padding: "10px 12px", fontSize: 14,
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button 
                type="button" 
                className="btn-cancel-edit" 
                onClick={() => setReporteOfertaId(null)} 
                disabled={enviandoReporte}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="cv-btn-solid" 
                onClick={enviarReporte} 
                disabled={enviandoReporte || !motivoReporte.trim()}
              >
                {enviandoReporte ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sw-toast show">{toast}</div>}
    </CandidatoShell>
  );
}