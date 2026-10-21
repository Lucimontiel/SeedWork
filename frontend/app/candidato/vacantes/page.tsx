"use client";

import { useCallback, useEffect, useState } from "react";
import CandidatoShell from "../CandidatoShell";
import { useAuth } from "@/app/lib/auth-context";
import { apiFetch } from "@/app/lib/api";

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

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"todas" | "guardadas">("todas");
  const [estado, setEstado] = useState("");
  const [area, setArea] = useState("");
  const [modalidad, setModalidad] = useState("");

  const [aplicadas, setAplicadas] = useState<Set<number>>(new Set());
  const [guardadas, setGuardadas] = useState<Set<number>>(new Set());
  const [enviando, setEnviando] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const cargarOfertas = useCallback(async (q: string) => {
    setLoadingOfertas(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
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
    cargarOfertas("");
  }, [cargarOfertas]);

  useEffect(() => {
    const t = setTimeout(() => cargarOfertas(search), 400);
    return () => clearTimeout(t);
  }, [search, cargarOfertas]);

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
        body: { idCandidato: user.idCandidato, idOferta },
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

  async function reportarOferta(idOferta: number) {
    if (!user?.idUsuario) return;
    try {
      await apiFetch(`/api/reportes`, {
        method: "POST",
        body: {
          idUsuario: user.idUsuario,
          idOferta,
          motivo: "Oferta sospechosa o inapropiada",
        },
      });
      mostrarToast("Oferta reportada correctamente");
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

  const listaVisible = tab === "guardadas" ? ofertas.filter((o) => guardadas.has(o.idOferta)) : ofertas;

  return (
    <CandidatoShell
      nombre={user?.correo}
      pageTitle="Vacantes"
      pageSubtitle="Oportunidades pensadas para ti"
    >
      <div className="vacantes-tabs">
        <button className={"vacantes-tab" + (tab === "todas" ? " active" : "")} onClick={() => setTab("todas")}>
          Todas <strong>{ofertas.length}</strong>
        </button>
        <button className={"vacantes-tab" + (tab === "guardadas" ? " active" : "")} onClick={() => setTab("guardadas")}>
          Guardadas <strong>{guardadas.size}</strong>
        </button>
      </div>

      <div className="vacantes-filters">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Buscar oferta o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg viewBox="0 0 20 20"><circle cx="9" cy="9" r="6" /><path d="M17 17l-4-4" /></svg>
        </div>
        <select className="filter-select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Área</option>
          <option value="Tecnología">Tecnología</option>
          <option value="Administración">Administración</option>
          <option value="Marketing">Marketing</option>
          <option value="Ventas">Ventas</option>
        </select>
        <select className="filter-select" value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
          <option value="">Modalidad</option>
          <option value="Presencial">Presencial</option>
          <option value="Remoto">Remoto</option>
          <option value="Híbrido">Híbrido</option>
        </select>
      </div>

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
                      style={{ background: "none", border: "none", fontSize: 18, color: "#667085", cursor: "pointer", padding: "0 8px" }}
                      onClick={() => setMenuAbierto(menuAbierto === oferta.idOferta ? null : oferta.idOferta)}
                    >
                      ...
                    </button>
                    {menuAbierto === oferta.idOferta && (
                      <div style={{ position: "absolute", right: 0, bottom: "100%", marginBottom: 8, background: "#fff", border: "1px solid #E6E9EF", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 8, zIndex: 10, width: 180 }}>
                        <button onClick={() => reportarOferta(oferta.idOferta)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#D0402F", cursor: "pointer" }}>Reportar oferta</button>
                        <button onClick={() => salirDeOferta(oferta.idOferta)} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#101828", cursor: "pointer" }}>Salir de la oferta</button>
                        <button onClick={() => { toggleGuardada(oferta.idOferta); setMenuAbierto(null); }} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#101828", cursor: "pointer" }}>{guardada ? "Quitar de guardadas" : "Guardar oferta"}</button>
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

      {toast && <div className="sw-toast">{toast}</div>}
    </CandidatoShell>
  );
}