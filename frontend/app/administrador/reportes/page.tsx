"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { apiFetch } from "../../lib/api";

type Reporte = {
  idReporte: number;
  reportadoPor: string;
  motivo: string;
  estado: string;
  oferta: string;
};

export default function ReportesAdminPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [casoAbierto, setCasoAbierto] = useState<Reporte | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  async function cargar() {
    try {
      const data = await apiFetch<Reporte[]>("/api/admin/reportes");
      setReportes(data);
    } catch {
      mostrarToast("Error cargando reportes");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function resolver(idReporte: number) {
    try {
      await apiFetch(`/api/admin/reportes/${idReporte}/resolver`, { method: "PATCH" });
      setCasoAbierto(null);
      mostrarToast("Caso cerrado exitosamente");
      await cargar();
    } catch {
      mostrarToast("Error al cerrar caso");
    }
  }

  return (
    <AdministradorShell pageTitle="Reportes y moderación" pageSubtitle="Casos reportados por candidatos o empresas">
      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Reportado por</th><th>Oferta</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Cargando reportes...</td></tr>
            ) : reportes.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>No hay reportes pendientes.</td></tr>
            ) : (
              reportes.map((r) => (
                <tr key={r.idReporte}>
                  <td>#{r.idReporte.toString().padStart(4, '0')}</td>
                  <td>{r.reportadoPor}</td>
                  <td>{r.oferta}</td>
                  <td>{r.motivo}</td>
                  <td>
                    <span className={`badge ${r.estado === "Abierto" ? "badge-red" : "badge-green"}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {r.estado === "Abierto" && (
                        <button className="btn btn-sm btn-solid" onClick={() => setCasoAbierto(r)}>Revisar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {casoAbierto && (
        <div className="modal-overlay open" onClick={() => setCasoAbierto(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Caso #{casoAbierto.idReporte.toString().padStart(4, '0')}</h3>
            <p>Reportado por: <strong>{casoAbierto.reportadoPor}</strong></p>
            <p>Oferta: {casoAbierto.oferta}</p>
            <p style={{ background: "var(--blue-bg-soft)", padding: 12, borderRadius: 8 }}>{casoAbierto.motivo}</p>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn" onClick={() => setCasoAbierto(null)}>Cancelar</button>
              <button className="btn btn-solid" onClick={() => resolver(casoAbierto.idReporte)}>Marcar como resuelto</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast show">{toast}</div>}
    </AdministradorShell>
  );
}