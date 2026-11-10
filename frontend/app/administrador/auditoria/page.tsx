"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { apiFetch } from "../../lib/api";
import { Pagination } from "../../lib/Pagination";

type AuditLog = {
  idAudit: number;
  evento: string;
  exito: boolean;
  ip: string;
  fecha: string;
  usuario: string;
  detalles: string | null;
};

export default function AuditoriaAdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function cargar(currentPage: number) {
    setCargando(true);
    try {
      const data = await apiFetch<{ items: AuditLog[], pages: number }>(`/api/admin/audit?page=${currentPage}&limit=15`);
      setLogs(data.items);
      setTotalPages(data.pages);
    } catch (err) {
      console.error("Error cargando auditoría:", err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(page);
  }, [page]);

  return (
    <AdministradorShell pageTitle="Auditoría" pageSubtitle="Registro de eventos de seguridad y accesos al sistema">
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Evento</th>
              <th>Estado</th>
              <th>IP</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>Cargando registros...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 24 }}>No hay eventos registrados.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.idAudit}>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>
                    {new Date(log.fecha).toLocaleString("es-CO")}
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.usuario}</td>
                  <td>
                    <span className="badge" style={{ background: "#F2F4F7", color: "var(--ink)" }}>
                      {log.evento}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${log.exito ? "badge-green" : "badge-red"}`}>
                      {log.exito ? "Éxito" : "Fallido"}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{log.ip || "—"}</td>
                  <td style={{ fontSize: 13, color: "var(--muted)", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={log.detalles || ""}>
                    {log.detalles || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </AdministradorShell>
  );
}