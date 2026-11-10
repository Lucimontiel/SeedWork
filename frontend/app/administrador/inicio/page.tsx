"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { apiFetch } from "../../lib/api";
import Link from "next/link";

type Vacante = { idOferta: number; titulo: string; empresa: string; estado: string; };

export default function InicioAdminPage() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [cargando, setCargando] = useState(true);

  const [resumen, setResumen] = useState({
    totalUsuarios: 0,
    totalEmpresas: 0,
    totalCandidatos: 0,
    totalOfertas: 0,
    reportesPendientes: 0,
  });

  useEffect(() => {
    Promise.all([
      apiFetch<{ items: Vacante[] }>("/api/admin/vacantes?limit=100"), 
      apiFetch<any>("/api/admin/resumen")
    ])
      .then(([vacantesData, resumenData]) => {
        setVacantes(vacantesData.items);
        setResumen(resumenData);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const pendientes = vacantes.filter((v) => v.estado === "Por aprobar").length;
  const publicadas = vacantes.filter((v) => v.estado === "Publicada").length;

  return (
    <AdministradorShell pageTitle="Panel de control" pageSubtitle="Supervisa la actividad de la plataforma">
      
      <div className="quick-grid">
        <div className="quick-card">
          <div>
            <h3>Vacantes pendientes</h3>
            <div className="stat" style={{ color: pendientes > 0 ? "#C97A1F" : "var(--ink)" }}>
              {cargando ? "-" : pendientes}
            </div>
            <p>Esperan aprobación antes de publicarse</p>
          </div>
        </div>
        <div className="quick-card">
          <div>
            <h3>Vacantes activas</h3>
            <div className="stat" style={{ color: "#2FA360" }}>{cargando ? "-" : publicadas}</div>
            <p>Ofertas actualmente visibles a candidatos</p>
          </div>
        </div>
        <div className="quick-card">
          <div>
            <h3>Total ofertas</h3>
            <div className="stat">{cargando ? "-" : resumen.totalOfertas}</div>
            <p>Histórico en la plataforma</p>
          </div>
        </div>
        <div className="quick-card">
          <div>
            <h3>Reportes activos</h3>
            <div className="stat" style={{ color: "#C6382E" }}>
              {cargando ? "-" : resumen.reportesPendientes}
            </div>
            <p>Casos abiertos sin resolver</p>
          </div>
        </div>
      </div>

      <section>
        <div className="section-head">
          <h2>Ofertas pendientes por revisar</h2>
          <Link href="/administrador/vacantes">Ver todas</Link>
        </div>
        
        {cargando && <p>Cargando datos...</p>}
        
        {!cargando && pendientes === 0 && (
          <div className="row-card" style={{ justifyContent: "center", padding: "30px", color: "var(--muted)" }}>
            No hay ofertas pendientes de aprobación.
          </div>
        )}

        {!cargando && vacantes.filter(v => v.estado === "Por aprobar").slice(0, 3).map(v => (
          <div className="row-card" key={v.idOferta}>
            <div className="row-icon" style={{ background: "var(--blue-600)" }}>OF</div>
            <div className="row-body">
              <p className="row-title">{v.titulo}</p>
              <p className="row-sub">{v.empresa}</p>
            </div>
            <div className="row-actions">
              <span className="badge badge-amber">Por aprobar</span>
              <Link href="/administrador/vacantes" className="btn btn-solid">Ir a Vacantes</Link>
            </div>
          </div>
        ))}
      </section>
    </AdministradorShell>
  );
}