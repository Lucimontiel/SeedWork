"use client";

import { useEffect, useState } from "react";
import AdministradorShell from "../AdministradorShell";
import { showToast } from "../toast";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

type Vacante = {
  idOferta: number;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: string;
  estado: string;
};

const AVATAR_COLORS = ["#3B6BF5", "#1C9A5B", "#8B5CF6", "#6B7385", "#B5750C"];

function colorForEmpresa(nombre: string) {
  let hash = 0;
  for (const ch of nombre) hash = (hash + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}
function inicialesEmpresa(nombre: string) {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}
function badgeClaseParaEstado(estado: string) {
  if (estado === "Publicada") return "badge-green";
  if (estado === "Por aprobar" || estado === "Pausada") return "badge-amber";
  return "badge-red";
}

export default function VacantesAdminPage() {
  const [vacantes, setVacantes] = useState<Vacante[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    try {
      const resp = await fetch(`${API_BASE}/api/admin/vacantes`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      setVacantes(await resp.json());
      setError(null);
    } catch (e: any) {
      setError("No se pudo conectar con la API (" + e.message + "). ¿Está corriendo uvicorn?");
    }
  }

  useEffect(() => { cargar(); }, []);

  async function cambiarEstado(idOferta: number, nuevoEstado: string) {
    try {
      const resp = await fetch(`${API_BASE}/api/admin/vacantes/${idOferta}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoEstado }),
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const mensajes: Record<string, string> = {
        Publicada: "Vacante aprobada y publicada",
        Rechazada: "Vacante rechazada",
        Pausada: "Vacante pausada",
      };
      showToast(mensajes[nuevoEstado] || "Vacante actualizada");
      cargar();
    } catch (e: any) {
      showToast("No se pudo actualizar: " + e.message);
    }
  }

  return (
    <AdministradorShell pageTitle="Vacantes" pageSubtitle="Modera y supervisa todas las vacantes publicadas por las empresas">
      <div className="toolbar">
        <div className="search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Buscar por cargo o empresa" />
        </div>
        <select className="adm-filter-select"><option>Todos los estados</option><option>Por aprobar</option><option>Publicada</option><option>Pausada</option><option>Rechazada</option></select>
        <select className="adm-filter-select"><option>Toda modalidad</option><option>Presencial</option><option>Híbrido</option><option>Remoto</option></select>
      </div>

      {error && <div style={{ background: "#fbe7e5", color: "#c6382e", padding: 16, borderRadius: 12, marginBottom: 16 }}>{error}</div>}

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>Vacante</th><th>Modalidad</th><th>Ubicación</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {vacantes === null && !error && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted2)", padding: 24 }}>Cargando vacantes…</td></tr>
            )}
            {vacantes?.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--muted2)", padding: 24 }}>No hay vacantes registradas.</td></tr>
            )}
            {vacantes?.map((v) => (
              <tr key={v.idOferta}>
                <td>
                  <div className="cell-entity">
                    <div className="mini-avatar" style={{ background: colorForEmpresa(v.empresa) }}>{inicialesEmpresa(v.empresa)}</div>
                    <div><div className="name">{v.titulo}</div><div className="sub">{v.empresa}</div></div>
                  </div>
                </td>
                <td>{v.modalidad}</td>
                <td>{v.ciudad}</td>
                <td><span className={"badge " + badgeClaseParaEstado(v.estado)}>{v.estado}</span></td>
                <td>
                  <div className="table-actions">
                    {v.estado === "Por aprobar" && (
                      <>
                        <button className="btn btn-sm btn-solid" onClick={() => cambiarEstado(v.idOferta, "Publicada")}>Aprobar</button>
                        <button className="btn btn-sm btn-ghost-red" onClick={() => cambiarEstado(v.idOferta, "Rechazada")}>Rechazar</button>
                      </>
                    )}
                    {v.estado === "Publicada" && (
                      <>
                        <button className="btn btn-sm" onClick={() => showToast("Abriendo oferta completa…")}>Ver oferta</button>
                        <button className="btn btn-sm" onClick={() => cambiarEstado(v.idOferta, "Pausada")}>Pausar</button>
                      </>
                    )}
                    {v.estado !== "Por aprobar" && v.estado !== "Publicada" && (
                      <button className="btn btn-sm" onClick={() => showToast("Abriendo oferta completa…")}>Ver oferta</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdministradorShell>
  );
}