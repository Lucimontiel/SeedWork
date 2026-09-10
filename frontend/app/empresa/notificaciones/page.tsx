"use client";

import { useEffect, useState } from "react";
import EmpresaShell from "../EmpresaShell";
import { getSession } from "../../lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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

export default function NotificacionesEmpresaPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => {
    const session = getSession();
    if (!session) return;

    fetch(`${API_BASE}/api/empresa/${session.id}/notificaciones`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setNotificaciones(data);
      })
      .catch(() => {});

    // Traer el resumen
    fetch(`${API_BASE}/api/empresa/${session.id}/resumen`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setResumen(data);
      })
      .catch(() => {});
  }, []);

  // Función para filtrar
  function filtrarNotificaciones() {
    if (filtro === "todas") return notificaciones;
    if (filtro === "no-leidas") {
      return notificaciones.filter((n) => !n.leida);
    }
    return notificaciones;
  }

  return (
    <EmpresaShell pageTitle="Notificaciones" pageSubtitle="Tus vacantes y candidatos tienen novedades, revísalas aquí">
      <div className="notif-toolbar-row">
        <div className="notif-tabs">
          <button className="notif-tab active" onClick={() => setFiltro("todas")}>Todas</button>
          <button className="notif-tab" onClick={() => setFiltro("no-leidas")}>No leídas</button>
          <button className="notif-tab" onClick={() => setFiltro("postulaciones")}>Postulaciones</button>
          <button className="notif-tab" onClick={() => setFiltro("vacantes")}>Vacantes</button>
          <button className="notif-tab" onClick={() => setFiltro("sistema")}>Sistema</button>
        </div>

        <button className="notif-mark-all-btn">
          <svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5l7 5.5 7-5.5"/></svg>
          Marcar todas como leídas
        </button>
      </div>

      <div className="notif-layout">
        <div className="notif-list">
          {filtrarNotificaciones().length === 0 ? (
            <p style={{ fontSize: 14, color: "#667085", marginTop: 20 }}>No hay notificaciones para esta empresa.</p>
          ) : (
            <>
              {filtrarNotificaciones().map((n) => (
                <div className={"notif-card" + (n.leida ? "" : " is-unread")} key={n.idNotificacion}>
                  <div className="notif-icon notif-icon-blue">
                    <svg viewBox="0 0 20 20"><circle cx="8" cy="7" r="3"/><path d="M2.5 17c0-2.9 2.5-4.8 5.5-4.8s5.5 1.9 5.5 4.8"/><path d="M15 8v4M13 10h4"/></svg>
                  </div>
                  <div className="notif-body">
                    <div className="notif-header-row">
                      <h4>{n.titulo}</h4>
                      <span className="notif-time">{n.fecha}</span>
                    </div>
                    <p>{n.mensaje}</p>
                  </div>
                </div>
              ))}
            </>
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
    </EmpresaShell>
  );
}