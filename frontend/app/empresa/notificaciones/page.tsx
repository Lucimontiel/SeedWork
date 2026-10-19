"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api";

type Notificacion = {
  idNotificacion: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
};

type Resumen = {
  nuevosCandidatos: number;
  candidatosRecomendados: number;
  entrevistas: number;
  vacantesPorVencer: number;
  rendimiento: number;
};

// ============================================================
// Helpers
// ============================================================
function formatearFecha(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;

  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs} h`;
  if (diffDias === 1) return "Ayer";
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

// ============================================================
// Componente
// ============================================================
export default function NotificacionesEmpresaPage() {
  const { user, cargando: cargandoAuth } = useAuth();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "no-leidas">("todas");
  const [toast, setToast] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function recargar() {
    if (!user || user.tipo !== "empresa" || !user.idEmpresa) return;

    try {
      const [notisData, resumenData] = await Promise.all([
        apiFetch<Notificacion[]>(`/api/empresa/${user.idEmpresa}/notificaciones`),
        apiFetch<Resumen>(`/api/empresa/${user.idEmpresa}/resumen`),
      ]);
      if (Array.isArray(notisData)) setNotificaciones(notisData);
      setResumen(resumenData);
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
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

  // Marcar UNA como leída
  async function marcarLeida(idNotificacion: number) {
    if (!user || !user.idEmpresa) return;

    // Optimista: actualiza la UI primero
    setNotificaciones((prev) =>
      prev.map((n) =>
        n.idNotificacion === idNotificacion ? { ...n, leida: true } : n
      )
    );

    try {
      await apiFetch(`/api/empresa/${user.idEmpresa}/notificaciones/${idNotificacion}/leer`, {
        method: "PATCH",
      });
    } catch (err: any) {
      // Si falla, revertimos
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.idNotificacion === idNotificacion ? { ...n, leida: false } : n
        )
      );
      mostrarToast(err?.message || "No se pudo marcar como leída");
    }
  }

  // Marcar TODAS como leídas
  async function marcarTodasLeidas() {
    if (!user || !user.idEmpresa) return;

    setMarcandoTodas(true);
    try {
      await apiFetch(`/api/empresa/${user.idEmpresa}/notificaciones/leer-todas`, {
        method: "PATCH",
      });
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      mostrarToast("Todas las notificaciones marcadas como leídas");
    } catch (err: any) {
      mostrarToast(err?.message || "No se pudieron marcar como leídas");
    } finally {
      setMarcandoTodas(false);
    }
  }

  // Filtrado
  function filtrarNotificaciones() {
    if (filtro === "todas") return notificaciones;
    if (filtro === "no-leidas") return notificaciones.filter((n) => !n.leida);
    return notificaciones;
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <EmpresaShell
      pageTitle="Notificaciones"
      pageSubtitle="Tus vacantes y candidatos tienen novedades, revísalas aquí"
    >
      <div className="notif-toolbar-row">
        <div className="notif-tabs">
          <button
            className={"notif-tab" + (filtro === "todas" ? " active" : "")}
            onClick={() => setFiltro("todas")}
          >
            Todas {notificaciones.length > 0 && `(${notificaciones.length})`}
          </button>
          <button
            className={"notif-tab" + (filtro === "no-leidas" ? " active" : "")}
            onClick={() => setFiltro("no-leidas")}
          >
            No leídas {noLeidas > 0 && `(${noLeidas})`}
          </button>
        </div>

        <button
          className="notif-mark-all-btn"
          onClick={marcarTodasLeidas}
          disabled={marcandoTodas || noLeidas === 0}
          style={noLeidas === 0 ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
        >
          <svg viewBox="0 0 20 20">
            <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
            <path d="M3 5.5l7 5.5 7-5.5" />
          </svg>
          {marcandoTodas ? "Marcando..." : "Marcar todas como leídas"}
        </button>
      </div>

      <div className="notif-layout">
        <div className="notif-list">
          {cargando ? (
            <p style={{ fontSize: 14, color: "#667085", marginTop: 20 }}>
              Cargando notificaciones...
            </p>
          ) : filtrarNotificaciones().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", marginTop: 20 }}>
              {filtro === "no-leidas"
                ? "No tienes notificaciones sin leer."
                : "No hay notificaciones para mostrar."}
            </p>
          ) : (
            filtrarNotificaciones().map((n) => (
              <div
                className={"notif-card" + (n.leida ? "" : " is-unread")}
                key={n.idNotificacion}
                onClick={() => !n.leida && marcarLeida(n.idNotificacion)}
                style={{
                  cursor: n.leida ? "default" : "pointer",
                  transition: "background 0.2s ease",
                }}
                title={n.leida ? "" : "Clic para marcar como leída"}
              >
                <div className={"notif-icon " + (n.leida ? "notif-icon-blue" : "notif-icon-purple")}>
                  <svg viewBox="0 0 20 20">
                    <circle cx="8" cy="7" r="3" />
                    <path d="M2.5 17c0-2.9 2.5-4.8 5.5-4.8s5.5 1.9 5.5 4.8" />
                    <path d="M15 8v4M13 10h4" />
                  </svg>
                </div>
                <div className="notif-body">
                  <div className="notif-header-row">
                    <h4>{n.titulo}</h4>
                    <span className="notif-time">{formatearFecha(n.fecha)}</span>
                  </div>
                  <p>{n.mensaje}</p>
                  {!n.leida && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "#2D6CDF",
                        fontWeight: 600,
                        marginTop: 6,
                      }}
                    >
                      ● Sin leer — clic para marcar
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="notif-summary-card">
          <h3 className="notif-summary-title">Resumen</h3>
          <div className="notif-summary-row">
            <span>Nuevos candidatos</span>
            <strong>{resumen?.nuevosCandidatos ?? 0}</strong>
          </div>
          <div className="notif-summary-row">
            <span>Candidatos recomendados</span>
            <strong>{resumen?.candidatosRecomendados ?? 0}</strong>
          </div>
          <div className="notif-summary-row">
            <span>Entrevistas</span>
            <strong>{resumen?.entrevistas ?? 0}</strong>
          </div>
          <div className="notif-summary-row">
            <span>Vacantes por vencer</span>
            <strong>{resumen?.vacantesPorVencer ?? 0}</strong>
          </div>
          <div className="notif-summary-row">
            <span>Rendimiento</span>
            <strong>{resumen?.rendimiento ?? 0}</strong>
          </div>
        </aside>
      </div>

      {toast && <div className="sw-toast show">{toast}</div>}
    </EmpresaShell>
  );
}